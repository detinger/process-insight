import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';

// bpmn-js is loaded lazily to keep the main bundle small.
// The viewer is never the modeler — no editing tools, properties panel
// or token simulation are instantiated.

interface Props {
  xml: string;
  height?: number;
  onElementClick?: (elementId: string) => void;
}

export function BpmnViewer({ xml, height = 360, onElementClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    async function init() {
      try {
        // Dynamic import keeps bpmn-js out of the initial bundle
        const { default: Viewer } = await import('bpmn-js/lib/Viewer');

        if (cancelled) return;

        // Destroy previous viewer instance if present
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }

        const viewer = new Viewer({ container: containerRef.current! });
        viewerRef.current = viewer;

        await viewer.importXML(xml);

        if (cancelled) {
          viewer.destroy();
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (viewer.get('canvas') as any).zoom('fit-viewport', 'auto');

        if (onElementClick) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (viewer.get('eventBus') as any).on('element.click', (event: { element: { id: string } }) => {
            onElementClick(event.element.id);
          });
        }

        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    }

    setStatus('loading');
    init();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [xml]);

  function fitViewport() {
    viewerRef.current?.get('canvas').zoom('fit-viewport', 'auto');
  }

  return (
    <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      {/* Required bpmn.io watermark — keep visible per bpmn-js license */}
      <div
        ref={containerRef}
        style={{ width: '100%', height, background: 'var(--canvas-bg)' }}
      />

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--canvas-bg)', gap: 8, color: 'var(--text-muted)',
        }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>Loading preview…</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--canvas-bg)',
        }}>
          <div className="callout callout-error" style={{ maxWidth: 420 }}>
            <AlertCircle size={18} className="callout-icon" />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Preview failed</div>
              <div style={{ fontSize: 12 }}>{errorMsg}</div>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <button
          className="btn btn-sm"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}
          onClick={fitViewport}
          title="Fit to viewport"
        >
          Fit
        </button>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
