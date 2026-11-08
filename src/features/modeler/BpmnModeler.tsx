import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, ClipboardList, PlayCircle, SlidersHorizontal } from 'lucide-react';
import { patchLabelLayout, viewerConfig } from './bpmnConfig';
import { fitWithPalette } from './fit';
import { ModelerToolbar } from './ModelerToolbar';
import { ExplainPanel } from './ExplainPanel';
import { ShortcutsDialog } from './ShortcutsDialog';
import { IssueList } from '../validation/IssueList';
import { validateBpmnXml } from '../../domain/validation/validate';
import type { ValidationReport } from '../../domain/validation/types';
import './modeler.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BpmnModelerInstance = any;

interface Props {
  xml: string;
  title?: string;
  onChange: (xml: string) => void;
  /** Called with the final XML after a last flush, so callers always get the latest edit. */
  onClose: (finalXml: string) => void;
}

type SidePanelTab = 'properties' | 'explain' | 'issues';

export function BpmnModeler({ xml, title, onChange, onClose }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModelerInstance>(null);
  const [undoRedo, setUndoRedo] = useState({ canUndo: false, canRedo: false });
  const [zoom, setZoom] = useState(1);
  const [panelOpen, setPanelOpen] = useState(true);
  const [tab, setTab] = useState<SidePanelTab>('properties');
  const [shortcuts, setShortcuts] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selection, setSelection] = useState<any>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [simActive, setSimActive] = useState(false);
  const changeTimer = useRef<number | undefined>(undefined);
  const validationTimer = useRef<number | undefined>(undefined);

  const runValidation = useCallback(async () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    try {
      const { xml: currentXml } = await modeler.saveXML({ format: true });
      setReport(validateBpmnXml(currentXml));
    } catch {
      // ignore
    }
  }, []);

  const notifyChange = useCallback(async () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    window.clearTimeout(changeTimer.current);
    try {
      const { xml: updatedXml } = await modeler.saveXML({ format: true });
      onChange(updatedXml);
    } catch {
      // ignore save errors during rapid editing
    }
  }, [onChange]);

  // ── Mount the modeler ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !propsRef.current) return;

    let cancelled = false;

    async function init() {
      const [
        { default: Modeler },
        { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule },
        { default: TokenSimulationModule },
      ] = await Promise.all([
        import('bpmn-js/lib/Modeler'),
        import('bpmn-js-properties-panel'),
        import('bpmn-js-token-simulation/lib/modeler'),
      ]);

      if (cancelled) return;

      const modeler: BpmnModelerInstance = new Modeler({
        container: canvasRef.current!,
        propertiesPanel: { parent: propsRef.current! },
        additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule, TokenSimulationModule],
        ...viewerConfig(),
      });
      patchLabelLayout(modeler);
      modelerRef.current = modeler;

      const eventBus = modeler.get('eventBus');
      const commandStack = modeler.get('commandStack');

      const onChanged = () => {
        setUndoRedo({ canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo() });
        window.clearTimeout(changeTimer.current);
        changeTimer.current = window.setTimeout(() => void notifyChange(), 600);
        window.clearTimeout(validationTimer.current);
        validationTimer.current = window.setTimeout(() => void runValidation(), 1200);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onSelection = (e: any) => {
        const el = e.newSelection?.[0];
        setSelection(el ? el.businessObject : null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onViewbox = (e: any) => setZoom(e.viewbox?.scale ?? 1);
      const onSimToggle = (e: { active: boolean }) => setSimActive(e.active);

      eventBus.on('commandStack.changed', onChanged);
      eventBus.on('selection.changed', onSelection);
      eventBus.on('canvas.viewbox.changed', onViewbox);
      eventBus.on('tokenSimulation.toggleMode', onSimToggle);

      try {
        await modeler.importXML(xml);
        if (!cancelled) {
          fitWithPalette(modeler);
          setReport(validateBpmnXml(xml));
        }
      } catch (err) {
        console.error('BpmnModeler: failed to import XML', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      window.clearTimeout(changeTimer.current);
      window.clearTimeout(validationTimer.current);
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
    // xml is intentionally only loaded on mount; subsequent xml changes are
    // driven by the user editing the diagram, not by prop updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!typing && e.key === '?') {
        setShortcuts(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const zoomBy = (step: number) => modelerRef.current?.get('zoomScroll').stepZoom(step);
  const fit = () => modelerRef.current && fitWithPalette(modelerRef.current);
  const resetZoom = () => modelerRef.current?.get('canvas').zoom(1, 'auto');

  const exportXml = async () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    const { xml: out } = await modeler.saveXML({ format: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out], { type: 'application/xml' }));
    a.download = `${(title ?? 'diagram').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.bpmn`;
    a.click();
  };

  const toggleSimulation = () => {
    modelerRef.current?.get('toggleMode').toggleMode();
  };

  const exportSvg = async () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    const { svg } = await modeler.saveSVG();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = `${(title ?? 'diagram').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.svg`;
    a.click();
  };

  const handleClose = async () => {
    window.clearTimeout(changeTimer.current);
    const modeler = modelerRef.current;
    if (modeler) {
      try {
        const { xml: finalXml } = await modeler.saveXML({ format: true });
        onClose(finalXml);
      } catch {
        onClose(xml);
      }
    } else {
      onClose(xml);
    }
  };

  return (
    <div className={`bpmn-modeler${panelOpen ? '' : ' panel-closed'}`}>
      <ModelerToolbar
        title={title}
        canUndo={undoRedo.canUndo}
        canRedo={undoRedo.canRedo}
        zoom={zoom}
        panelOpen={panelOpen}
        onUndo={() => modelerRef.current?.get('commandStack').undo()}
        onRedo={() => modelerRef.current?.get('commandStack').redo()}
        onZoomIn={() => zoomBy(1)}
        onZoomOut={() => zoomBy(-1)}
        onFit={fit}
        onResetZoom={resetZoom}
        onExportXml={exportXml}
        onExportSvg={exportSvg}
        onTogglePanel={() => setPanelOpen(v => !v)}
        simActive={simActive}
        onToggleSimulation={toggleSimulation}
        onShortcuts={() => setShortcuts(true)}
        onClose={handleClose}
      />

      <div className="modeler-body">
        <div className="modeler-canvas-area">
          <div
            ref={canvasRef}
            className="bpmn-canvas bio-theme-parent"
            aria-label="BPMN modeling canvas"
            style={{ width: '100%', height: '100%' }}
          />
          {simActive && (
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--accent)', color: '#1d1205',
              padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: 'var(--shadow)', zIndex: 15, pointerEvents: 'none', whiteSpace: 'nowrap',
            }} role="status">
              <PlayCircle size={13} /> Token simulation — click elements to trigger events or choose paths.
            </div>
          )}
        </div>

        <aside className="modeler-side-panel" aria-label="Side panel">
          <div className="modeler-side-panel-tabs" role="tablist">
            {([
              { id: 'properties' as const, label: 'Properties', icon: <SlidersHorizontal size={12} />, badge: undefined },
              { id: 'explain' as const, label: 'Explain', icon: <BookOpen size={12} />, badge: undefined },
              {
                id: 'issues' as const,
                label: 'Issues',
                icon: <ClipboardList size={12} />,
                badge: report ? (report.counts.error + report.counts.warning) : undefined,
              },
            ]).map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`modeler-side-panel-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                    background: 'var(--error)', color: '#fff', marginLeft: 2,
                  }}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div className="modeler-side-panel-content">
            <div
              ref={propsRef}
              className="modeler-properties-host"
              hidden={tab !== 'properties'}
            />
            {tab === 'explain' && <ExplainPanel businessObject={selection} />}
            {tab === 'issues' && <IssueList report={report} />}
          </div>
        </aside>
      </div>

      {shortcuts && <ShortcutsDialog onClose={() => setShortcuts(false)} />}
    </div>
  );
}
