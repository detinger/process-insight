import { useState } from 'react';
import { CHALLENGES } from './challenges';
import { ConceptsTab } from './ConceptsTab';
import { UnitsTab } from './UnitsTab';
import { ChallengesTab } from './ChallengesTab';
import type { Workspace } from '../../app/AppShell';

interface LearnProps {
  projectId: string;
  onOpenProject?: (id: string) => void;
  onNavigate?: (w: Workspace) => void;
}

export function LearnWorkspace({ projectId: _, onOpenProject, onNavigate }: LearnProps) {
  const [activeTab, setActiveTab] = useState<'concepts' | 'curriculum' | 'challenges'>('concepts');

  return (
    <div className="workspace">
      <div className="workspace-narrow">
        <div className="page-header">
          <div className="page-header-content">
            <div className="eyebrow">Curriculum</div>
            <h1 className="page-title">Learn</h1>
            <p className="page-description">
              Concept explanations, curriculum units, practice challenges and IT scenario packs
              for Business Process Management.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {(['concepts', 'curriculum', 'challenges'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                marginBottom: -1,
              }}
            >
              {tab === 'curriculum' ? 'Units (12)' : tab === 'challenges' ? `Challenges (${CHALLENGES.length})` : 'Concepts'}
            </button>
          ))}
        </div>

        {activeTab === 'concepts' && <ConceptsTab onOpenProject={onOpenProject} onNavigate={onNavigate} />}
        {activeTab === 'curriculum' && <UnitsTab onOpenProject={onOpenProject} onNavigate={onNavigate} />}
        {activeTab === 'challenges' && <ChallengesTab onOpenProject={onOpenProject} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
