import { Download, Keyboard, Maximize, PanelRightClose, PanelRightOpen, PlayCircle, Redo2, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  title?: string;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  panelOpen: boolean;
  simActive: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetZoom: () => void;
  onExportXml: () => void;
  onExportSvg: () => void;
  onTogglePanel: () => void;
  onToggleSimulation: () => void;
  onShortcuts: () => void;
  onClose: () => void;
}

export function ModelerToolbar(p: Props) {
  return (
    <div className="modeler-toolbar" role="toolbar" aria-label="Modeler toolbar">
      {p.title && (
        <div className="modeler-toolbar-group">
          <span style={{ fontWeight: 650, fontSize: 14, color: 'var(--text)' }}>{p.title}</span>
        </div>
      )}

      <div className="modeler-toolbar-group" aria-label="Edit">
        <button className="btn btn-sm btn-icon" onClick={p.onUndo} disabled={!p.canUndo || p.simActive} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">
          <Undo2 size={15} />
        </button>
        <button className="btn btn-sm btn-icon" onClick={p.onRedo} disabled={!p.canRedo || p.simActive} title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo">
          <Redo2 size={15} />
        </button>
      </div>

      <div className="modeler-toolbar-group" aria-label="Zoom">
        <button className="btn btn-sm btn-icon" onClick={p.onZoomOut} title="Zoom out" aria-label="Zoom out">
          <ZoomOut size={15} />
        </button>
        <button className="btn btn-sm modeler-zoom-label" onClick={p.onResetZoom} title="Reset zoom to 100%">
          {Math.round(p.zoom * 100)}%
        </button>
        <button className="btn btn-sm btn-icon" onClick={p.onZoomIn} title="Zoom in" aria-label="Zoom in">
          <ZoomIn size={15} />
        </button>
        <button className="btn btn-sm btn-icon" onClick={p.onFit} title="Fit diagram to screen" aria-label="Fit to screen">
          <Maximize size={15} />
        </button>
      </div>

      <div className="modeler-toolbar-group">
        <button className="btn btn-sm" onClick={p.onExportXml} title="Download BPMN XML">
          <Download size={14} /> Export BPMN
        </button>
        <button className="btn btn-sm btn-ghost" onClick={p.onExportSvg} title="Download SVG image">
          <Download size={14} /> SVG
        </button>
      </div>

      <div className="modeler-spacer" />

      <div className="modeler-toolbar-group">
        <button
          className={`btn btn-sm${p.simActive ? ' active' : ' btn-accent'}`}
          onClick={p.onToggleSimulation}
          aria-pressed={p.simActive}
          title="Animated token simulation — click elements to trigger events"
        >
          <PlayCircle size={14} /> {p.simActive ? 'Exit simulation' : 'Simulate'}
        </button>
      </div>

      <div className="modeler-toolbar-group">
        <button
          className={`btn btn-sm btn-icon btn-ghost`}
          onClick={p.onTogglePanel}
          aria-label={p.panelOpen ? 'Hide side panel' : 'Show side panel'}
          title={p.panelOpen ? 'Hide side panel' : 'Show side panel'}
        >
          {p.panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
        <button className="btn btn-sm btn-icon btn-ghost" onClick={p.onShortcuts} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">
          <Keyboard size={15} />
        </button>
        <button className="btn btn-sm btn-icon btn-ghost" onClick={p.onClose} title="Close editor" aria-label="Close editor">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
