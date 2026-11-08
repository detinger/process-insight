import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScenarioThumb, PREVIEW_LABELS, type PreviewType } from './ScenarioPreview';
import { buildAndCacheBundle } from './registry';
import type { ScenarioPack } from './registry';
import type { ScenarioBundle } from './it01SaasOnboarding';

const PREVIEW_TYPES: PreviewType[] = ['landscape', 'journey', 'map'];

const LEVEL_COLOR: Record<string, string> = {
  Beginner: 'var(--success)',
  Intermediate: 'var(--info)',
  Advanced: 'var(--warning)',
  Capstone: 'var(--accent)',
};

interface Props {
  pack: ScenarioPack;
  onLoad: () => void;
  onGuided?: () => void;
  loading?: boolean;
}


export function ScenarioCard({ pack, onLoad, onGuided, loading }: Props) {
  const [slide, setSlide] = useState(0);
  const [bundle, setBundle] = useState<ScenarioBundle | null>(null);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const b = buildAndCacheBundle(pack.id);
    if (b) setBundle(b);
  }, [pack.id]);

  const prev = () => setSlide(s => (s + PREVIEW_TYPES.length - 1) % PREVIEW_TYPES.length);
  const next = () => setSlide(s => (s + 1) % PREVIEW_TYPES.length);

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (delta < -40) next();
    else if (delta > 40) prev();
    touchStart.current = null;
  };

  const levelColor = LEVEL_COLOR[pack.level] ?? 'var(--text-muted)';

  return (
    <>
      <article className="scenario-card">
        {/* Header */}
        <div className="scenario-card-header">
          <span className="scenario-card-id">{pack.id}</span>
          <span className="scenario-card-level" style={{ color: levelColor, background: `color-mix(in srgb, ${levelColor} 12%, transparent)` }}>
            {pack.level}
          </span>
        </div>

        <h3 className="scenario-card-title">{pack.label}</h3>
        <p className="scenario-card-summary">{pack.summary}</p>

        {/* Preview carousel */}
        <div
          className="scenario-card-carousel"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label="Preview carousel"
        >
          <button className="carousel-nav carousel-nav-prev" onClick={prev} aria-label="Previous preview">
            <ChevronLeft size={14} />
          </button>

          <div className="carousel-slide">
            <ScenarioThumb type={PREVIEW_TYPES[slide]} bundle={bundle} />
          </div>

          <button className="carousel-nav carousel-nav-next" onClick={next} aria-label="Next preview">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Dots */}
        <div className="carousel-dots" aria-hidden>
          {PREVIEW_TYPES.map((t, i) => (
            <button
              key={t}
              className={`carousel-dot${i === slide ? ' active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={PREVIEW_LABELS[t]}
            />
          ))}
        </div>

        {/* Preview label */}
        <div className="carousel-label">{PREVIEW_LABELS[PREVIEW_TYPES[slide]]}</div>

        {/* Actions */}
        <div className="scenario-card-actions">
          <button className="btn btn-sm btn-ghost" onClick={onLoad} disabled={loading} style={{ flex: 1 }}>
            <BookOpen size={12} /> {loading ? 'Loading…' : 'Load'}
          </button>
          {onGuided && (
            <button
              className="btn btn-sm"
              style={{ flex: 1, background: 'var(--primary)', color: '#fff', border: 'none' }}
              onClick={onGuided}
              disabled={loading}
            >
              ▶ Guided
            </button>
          )}
        </div>
      </article>

    </>
  );
}
