import { useState, useEffect } from 'react';
import { FileCode, AlertCircle, Plus, Download, History } from 'lucide-react';
import { db } from '../../storage/db';
import { BpmnExportWizard } from '../derivation/BpmnExportWizard';
import { SipocPanel } from './SipocPanel';
import { ProcessMapPanel } from './ProcessMapPanel';
import { WorkspacePath } from '../../components/WorkspacePath';
import type { Workspace } from '../../app/AppShell';
import type { BpmnExport } from '../../domain/contracts/types';

type MapTab = 'bpmn' | 'sipoc' | 'processmap';

export function MapWorkspace({ projectId, onNavigate }: { projectId: string; onNavigate?: (ws: Workspace) => void }) {
  const [tab, setTab] = useState<MapTab>('sipoc');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [exports, setExports] = useState<BpmnExport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.bpmnExports.where('projectId').equals(projectId).toArray()
      .then(exps => {
        setExports(exps.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt)));
        setLoading(false);
      });
  }, [projectId]);

  function handleWizardClose() {
    setWizardOpen(false);
    db.bpmnExports.where('projectId').equals(projectId).toArray()
      .then(exps => setExports(exps.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt))));
  }

  const TABS: { id: MapTab; label: string }[] = [
    { id: 'sipoc',      label: 'SIPOC' },
    { id: 'processmap', label: 'Process Map' },
    { id: 'bpmn',       label: 'BPMN Export' },
  ];

  return (
    <div className="workspace">
      <div className="workspace-narrow">
        <div className="page-header">
          <div className="page-header-content">
            <div className="eyebrow">Operations</div>
            <h1 className="page-title">Map</h1>
            <p className="page-description">
              Scope processes with SIPOC, model swimlane diagrams, and generate traceable BPMN drafts for BPMN Studio.
            </p>
          </div>
        </div>


        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 16px', fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none', border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* BPMN Export tab */}
        {tab === 'bpmn' && (
          <>
            <div className="card" style={{ marginBottom: 24, background: 'var(--primary-soft)', border: '1px solid var(--primary-tint)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <FileCode size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Generate BPMN draft</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                    Map journey steps to activities, assign internal role lanes, and export a
                    standards-compliant BPMN 2.0 file with a traceability manifest.
                    The export is a scoped sequential draft — decisions, parallel work and rework
                    loops require BPMN Studio.
                  </div>
                  <button className="btn btn-primary" onClick={() => setWizardOpen(true)}>
                    <Plus size={15} /> New BPMN draft
                  </button>
                </div>
              </div>
            </div>

            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <History size={16} style={{ color: 'var(--text-muted)' }} />
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Export history</h2>
              </div>

              {loading && <div style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Loading…</div>}

              {!loading && exports.length === 0 && (
                <div className="empty-state">
                  <Download size={22} className="empty-state-icon" />
                  <div className="empty-state-title">No exports yet</div>
                  <div className="empty-state-desc">
                    Generate your first BPMN draft above. Each download creates an immutable revision —
                    regenerating here will never overwrite a file you have already edited in BPMN Studio.
                  </div>
                </div>
              )}

              {!loading && exports.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 80px 80px 100px', padding: '6px 14px', background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <span>Process</span><span>Exported</span>
                    <span style={{ textAlign: 'right' }}>Activities</span>
                    <span style={{ textAlign: 'right' }}>Excluded</span>
                    <span style={{ textAlign: 'right' }}>Unresolved</span>
                    <span>Status</span>
                  </div>
                  {exports.map(ex => (
                    <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 80px 80px 100px', padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{ex.processName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{ex.filename}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(ex.exportedAt).toLocaleString()}</div>
                      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{ex.mappingCount}</div>
                      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: ex.exclusionCount > 0 ? 'var(--text-muted)' : undefined }}>{ex.exclusionCount}</div>
                      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: ex.unresolvedCount > 0 ? 'var(--warning)' : undefined }}>
                        {ex.unresolvedCount > 0 && <AlertCircle size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                        {ex.unresolvedCount}
                      </div>
                      <div>
                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: ex.status === 'draft' ? 'var(--info-soft)' : 'var(--warning-soft)', color: ex.status === 'draft' ? 'var(--info)' : 'var(--warning)' }}>
                          {ex.status === 'draft' ? 'Draft' : 'Source changed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {tab === 'sipoc'      && <SipocPanel      projectId={projectId} />}
        {tab === 'processmap' && <ProcessMapPanel  projectId={projectId} />}

        {onNavigate && <WorkspacePath current="map" onNavigate={onNavigate} />}
      </div>

      {wizardOpen && <BpmnExportWizard projectId={projectId} onClose={handleWizardClose} />}
    </div>
  );
}
