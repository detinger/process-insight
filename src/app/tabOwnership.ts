// Multi-tab ownership (AT-24): one writable owner, clearly read-only second view.
// Uses BroadcastChannel for cross-tab communication + localStorage for leader tracking.
// Never permits silent last-write-wins data loss.

const CHANNEL_NAME = 'pjs-tab-ownership';
const KEY = 'pjs-owner-tab';
const HEARTBEAT_MS = 2000;
const CLAIM_TIMEOUT_MS = 5000;

type Msg =
  | { type: 'claim'; tabId: string }
  | { type: 'heartbeat'; tabId: string }
  | { type: 'release'; tabId: string }
  | { type: 'query' };

export type OwnershipState = 'owner' | 'observer' | 'pending';

export class TabOwnershipManager {
  private tabId: string;
  private channel: BroadcastChannel;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private state: OwnershipState = 'pending';
  private listeners: ((state: OwnershipState) => void)[] = [];

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = this.onMessage.bind(this);
    window.addEventListener('beforeunload', this.release.bind(this));
    this.tryClaim();
  }

  get currentState(): OwnershipState { return this.state; }
  get id(): string { return this.tabId; }

  subscribe(cb: (state: OwnershipState) => void): () => void {
    this.listeners.push(cb);
    cb(this.state);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private setState(s: OwnershipState) {
    if (s === this.state) return;
    this.state = s;
    this.listeners.forEach(l => l(s));
  }

  private tryClaim() {
    const existing = localStorage.getItem(KEY);
    if (!existing) {
      this.claimOwnership();
      return;
    }
    // Check if existing owner is still alive — wait CLAIM_TIMEOUT_MS for heartbeat
    this.setState('pending');
    const timeout = setTimeout(() => {
      // No heartbeat received — steal ownership
      this.claimOwnership();
    }, CLAIM_TIMEOUT_MS);

    const prevHandler = this.channel.onmessage;
    const checkHandler = (ev: MessageEvent) => {
      const msg = ev.data as Msg;
      if (msg.type === 'heartbeat' && msg.tabId === existing) {
        // Owner is alive — become observer
        clearTimeout(timeout);
        this.channel.onmessage = prevHandler;
        this.setState('observer');
      }
    };
    this.channel.onmessage = (ev) => {
      checkHandler(ev);
      prevHandler?.call(this.channel, ev);
    };
    // Poke existing owner
    this.channel.postMessage({ type: 'query' } satisfies Msg);
  }

  private claimOwnership() {
    localStorage.setItem(KEY, this.tabId);
    this.channel.postMessage({ type: 'claim', tabId: this.tabId } satisfies Msg);
    this.setState('owner');
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.channel.postMessage({ type: 'heartbeat', tabId: this.tabId } satisfies Msg);
    }, HEARTBEAT_MS);
  }

  requestOwnership(): void {
    if (this.state === 'owner') return;
    this.claimOwnership();
  }

  release(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (localStorage.getItem(KEY) === this.tabId) {
      localStorage.removeItem(KEY);
      this.channel.postMessage({ type: 'release', tabId: this.tabId } satisfies Msg);
    }
  }

  private onMessage(ev: MessageEvent) {
    const msg = ev.data as Msg;
    if (msg.type === 'claim' && msg.tabId !== this.tabId) {
      // Another tab claimed ownership
      if (this.state === 'owner') {
        // Another tab stole our ownership (we may have been frozen)
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      this.setState('observer');
    }
    if (msg.type === 'heartbeat' && msg.tabId !== this.tabId && this.state === 'pending') {
      this.setState('observer');
    }
    if (msg.type === 'release' && msg.tabId !== this.tabId && this.state === 'observer') {
      // Owner released — this tab can try to claim
      setTimeout(() => {
        if (this.state === 'observer') this.tryClaim();
      }, Math.random() * 300); // randomize to avoid thundering herd
    }
    if (msg.type === 'query' && this.state === 'owner') {
      this.channel.postMessage({ type: 'heartbeat', tabId: this.tabId } satisfies Msg);
    }
  }

  destroy(): void {
    this.release();
    this.channel.close();
    this.listeners = [];
  }
}

// Singleton — created once per tab
let _manager: TabOwnershipManager | null = null;

export function getTabOwnership(): TabOwnershipManager {
  if (!_manager) {
    _manager = new TabOwnershipManager();
  }
  return _manager;
}
