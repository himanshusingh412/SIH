import React from 'react';
import { Video, Camera, Mic, Type as TypeIcon, Megaphone, Clock } from 'lucide-react';
import type { VideoPackage } from '../../utils/deliverableParsers';

interface VideoStoryboardViewProps {
  pkg: VideoPackage;
  accentColor?: string;
}

const Field: React.FC<{ icon: React.ElementType; label: string; value: string; accent: string }> = ({
  icon: Icon,
  label,
  value,
  accent,
}) => (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: '26px',
        height: '26px',
        borderRadius: '6px',
        background: `${accent}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={14} color={accent} />
    </span>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.55 }}>{value}</div>
    </div>
  </div>
);

/** Renders a VIDEO_PACKAGE deliverable as a scene-by-scene production storyboard. */
export const VideoStoryboardView: React.FC<VideoStoryboardViewProps> = ({ pkg, accentColor = '#E11D48' }) => (
  <div>
    {/* Package header */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
      }}
    >
      <span
        className="badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: `${accentColor}15`,
          color: accentColor,
          border: `1px solid ${accentColor}33`,
          fontWeight: 800,
        }}
      >
        <Video size={13} aria-hidden="true" /> {pkg.storyboard.length} Scene Storyboard
      </span>
      {pkg.targetDurationSeconds && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-xs)',
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={13} aria-hidden="true" /> Target runtime: {pkg.targetDurationSeconds}s
        </span>
      )}
    </div>

    {/* Scene timeline */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {pkg.storyboard.map((scene, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: accentColor,
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {scene.sceneNumber}
            </span>
            <span style={{ fontWeight: 800, color: 'var(--burgundy-900)', fontSize: 'var(--font-sm)', flex: 1, minWidth: 0 }}>
              {scene.title || `Scene ${scene.sceneNumber}`}
            </span>
            {scene.timecode && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  whiteSpace: 'nowrap',
                }}
              >
                {scene.timecode}
              </span>
            )}
          </div>

          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scene.visual && <Field icon={Camera} label="Visual" value={scene.visual} accent={accentColor} />}
            {scene.voiceover && <Field icon={Mic} label="Voiceover" value={scene.voiceover} accent={accentColor} />}
            {scene.onScreenText && <Field icon={TypeIcon} label="On-Screen Text" value={scene.onScreenText} accent={accentColor} />}
          </div>
        </div>
      ))}
    </div>

    {pkg.callToAction && (
      <div
        style={{
          marginTop: '14px',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: `${accentColor}10`,
          border: `1px solid ${accentColor}33`,
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <Megaphone size={16} color={accentColor} aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: accentColor }}>
            Call To Action
          </div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.55 }}>{pkg.callToAction}</div>
        </div>
      </div>
    )}
  </div>
);
