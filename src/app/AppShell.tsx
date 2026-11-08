import { useState } from 'react';
import {
  BookOpen, Search, Compass, Map, LayoutGrid,
  PanelLeftClose, PanelLeftOpen,
  Sun, Moon, Monitor, FolderOpen,
  Download, GraduationCap, Lightbulb, Trophy,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { WorkspacePath } from '../components/WorkspacePath';
import { useTheme } from './theme';

export type Workspace = 'home' | 'concepts' | 'units' | 'challenges' | 'identify' | 'discover' | 'journey' | 'map';

const NAV_GROUPS = [
  {
    label: 'Learn',
    items: [
      { id: 'concepts'   as Workspace, label: 'Concepts',   icon: <Lightbulb size={16} /> },
      { id: 'units'      as Workspace, label: 'Units',      icon: <BookOpen size={16} /> },
      { id: 'challenges' as Workspace, label: 'Challenges', icon: <Trophy size={16} /> },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'discover' as Workspace, label: 'Discover', icon: <Compass size={16} /> },
      { id: 'identify' as Workspace, label: 'Identify', icon: <Search size={16} /> },
      { id: 'journey'  as Workspace, label: 'Journey',  icon: <LayoutGrid size={16} /> },
      { id: 'map'      as Workspace, label: 'Map',      icon: <Map size={16} /> },
    ],
  },
];

interface Props {
  active: Workspace;
  onNavigate: (w: Workspace) => void;
  children: React.ReactNode;
  toolbarContent?: React.ReactNode;
  projectTitle?: string;
  projectId?: string | null;
  onExport?: (id: string) => void;
  readOnly?: boolean;
  onStartGuidedMode?: () => void;
  guidedBanner?: React.ReactNode;
}

export function AppShell({ active, onNavigate, children, toolbarContent, projectTitle, projectId, onExport, readOnly, onStartGuidedMode, guidedBanner }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { setTheme, theme } = useTheme();

  function cycleTheme() {
    const next: Record<string, 'light' | 'dark' | 'system'> = {
      system: 'light', light: 'dark', dark: 'system',
    };
    setTheme(next[theme]);
  }

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Navigation sidebar */}
      <nav
        className={`app-nav${collapsed ? ' collapsed' : ''}`}
        aria-label="Application navigation"
      >
        {/* Brand */}
        <button
          className="nav-brand"
          onClick={() => onNavigate('home')}
          title="Go to home"
        >
          <div className="brand-mark">
            <BrandMark size={22} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <div className="brand-name">Process Insight</div>
              <div className="brand-sub">discover · identify · map</div>
            </div>
          )}
        </button>

        {/* Grouped nav */}
        <div className="nav-section" style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {!collapsed && <div className="nav-group-label">Start</div>}
          <button
            className={`nav-link${active === 'home' ? ' active' : ''}`}
            onClick={() => onNavigate('home')}
            aria-current={active === 'home' ? 'page' : undefined}
            title={collapsed ? (projectTitle ?? 'Home') : undefined}
            style={collapsed ? { justifyContent: 'center' } : undefined}
          >
            <FolderOpen size={16} />
            {!collapsed && <span className="nav-link-label">{projectTitle ? `← ${projectTitle}` : 'Home'}</span>}
          </button>

          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginTop: 8 }}>
              {!collapsed && <div className="nav-group-label">{group.label}</div>}
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-link${active === item.id ? ' active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active === item.id ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  style={collapsed ? { justifyContent: 'center' } : undefined}
                >
                  {item.icon}
                  {!collapsed && <span className="nav-link-label">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Utilities */}
        <div className="nav-util">
          <button
            className="nav-link"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            style={collapsed ? { justifyContent: 'center' } : undefined}
          >
            <ThemeIcon size={16} />
            {!collapsed && <span className="nav-link-label">Theme: {theme}</span>}
          </button>
          <button
            className="nav-link"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            style={collapsed ? { justifyContent: 'center' } : undefined}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span className="nav-link-label">Collapse</span>}
          </button>
        </div>
      </nav>

      {/* Main area */}
      <main className="app-main" id="main-content" tabIndex={-1}>
        {/* Toolbar */}
        <div className="app-toolbar" role="toolbar" aria-label="Workspace toolbar">
          <span className="toolbar-title">
            {NAV_GROUPS.flatMap(g => g.items).find(i => i.id === active)?.label ?? 'Process Insight'}
          </span>
          <div className="toolbar-spacer" />
          {toolbarContent}
          {onExport && projectId && !['home', 'concepts', 'units', 'challenges'].includes(active) && (
            <button className="btn btn-ghost btn-sm" onClick={() => onExport(projectId)} title="Export project"
              disabled={readOnly}>
              <Download size={15} /> Export
            </button>
          )}
          {onStartGuidedMode && !['home', 'concepts', 'units', 'challenges'].includes(active) && (
            <button
              className="btn btn-sm"
              style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}
              onClick={onStartGuidedMode}
              title="Start the 5-step guided learning path"
            >
              <GraduationCap size={15} /> Guided tour
            </button>
          )}
        </div>

        {/* Guided learning path banner (opt-in) */}
        {guidedBanner}

        {/* Workspace content */}
        {children}

        {/* Always-visible step navigation (the guided tour has its own stepper) */}
        {projectId && !guidedBanner && (['discover', 'identify', 'journey', 'map'] as Workspace[]).includes(active) && (
          <WorkspacePath current={active} onNavigate={onNavigate} />
        )}
      </main>
    </div>
  );
}
