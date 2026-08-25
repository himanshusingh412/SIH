import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Presentation, Volume2 } from 'lucide-react';
import type { Slide } from '../../utils/deliverableParsers';

interface SlideDeckViewProps {
  slides: Slide[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  deckTitle?: string;
  accentColor?: string;
}

/**
 * Renders a PRESENTATION deliverable the way it will actually be presented:
 * a 16:9 slide canvas, one slide at a time, with a numbered thumbnail strip.
 */
export const SlideDeckView: React.FC<SlideDeckViewProps> = ({
  slides,
  activeIndex,
  onChangeIndex,
  deckTitle,
  accentColor = '#D24726',
}) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(slides.length - 1, 0));
  const slide = slides[safeIndex];

  // Keep the active thumbnail in view as the deck advances.
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>('[data-active="true"]');
    if (strip && active) {
      const offset = active.offsetLeft - strip.offsetWidth / 2 + active.offsetWidth / 2;
      strip.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }
  }, [safeIndex]);

  if (!slide) return null;

  const goTo = (index: number) => onChangeIndex(Math.min(Math.max(index, 0), slides.length - 1));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goTo(safeIndex + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(safeIndex - 1);
    }
  };

  // Long decks get smaller body text so a slide never overflows its canvas.
  const bulletCount = slide.bulletPoints.length;
  const bodyFontSize = bulletCount > 6 ? '0.86rem' : bulletCount > 4 ? '0.94rem' : '1rem';

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={deckTitle ? `${deckTitle} slide deck` : 'Slide deck'}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ outline: 'none' }}
    >
      {/* Deck toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <span
          className="badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(210,71,38,0.10)',
            color: accentColor,
            border: `1px solid ${accentColor}33`,
            fontWeight: 800,
          }}
        >
          <Presentation size={13} aria-hidden="true" />
          Slide {safeIndex + 1} of {slides.length}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={safeIndex === 0}
            onClick={() => goTo(safeIndex - 1)}
            aria-label="Previous slide"
          >
            <ChevronLeft size={15} aria-hidden="true" /> Prev
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={safeIndex === slides.length - 1}
            onClick={() => goTo(safeIndex + 1)}
            aria-label="Next slide"
          >
            Next <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 16:9 slide canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          minHeight: '260px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Accent rail */}
        <div style={{ height: '6px', background: `linear-gradient(90deg, ${accentColor}, var(--burgundy-700))`, flexShrink: 0 }} />

        <div style={{ padding: 'clamp(18px, 3.2vw, 34px)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <h3
            style={{
              fontSize: 'clamp(1.05rem, 2.2vw, 1.6rem)',
              fontWeight: 800,
              color: 'var(--burgundy-900)',
              lineHeight: 1.25,
              marginBottom: '10px',
            }}
          >
            {slide.title}
          </h3>

          <div style={{ height: '2px', width: '56px', background: accentColor, borderRadius: '2px', marginBottom: '16px', flexShrink: 0 }} />

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: bulletCount > 6 ? '8px' : '12px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
            }}
          >
            {slide.bulletPoints.map((point, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: bodyFontSize,
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: '0.5em',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {slide.visualPrompt && (
            <div
              style={{
                marginTop: '12px',
                fontSize: 'var(--font-xs)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                flexShrink: 0,
              }}
            >
              Visual direction: {slide.visualPrompt}
            </div>
          )}

          {/* Slide footer, like a real deck */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {deckTitle || 'ContentSpine AI'}
            </span>
            <span style={{ fontWeight: 700 }}>{safeIndex + 1}</span>
          </div>
        </div>
      </div>

      {slide.speakerNotes && (
        <div
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: 'var(--pink-100)',
            border: '1px solid var(--pink-300)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--burgundy-900)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Volume2 size={13} aria-hidden="true" /> Speaker Notes:
          </strong>{' '}
          {slide.speakerNotes}
        </div>
      )}

      {/* Thumbnail strip */}
      {slides.length > 1 && (
        <div
          ref={stripRef}
          role="tablist"
          aria-label="Slide thumbnails"
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '14px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {slides.map((s, i) => {
            const isActive = i === safeIndex;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                data-active={isActive}
                onClick={() => goTo(i)}
                style={{
                  flex: '0 0 auto',
                  width: '124px',
                  height: '70px',
                  padding: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'var(--bg-surface)',
                  border: isActive ? `2px solid ${accentColor}` : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  overflow: 'hidden',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 800, color: isActive ? accentColor : 'var(--text-muted)' }}>
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
