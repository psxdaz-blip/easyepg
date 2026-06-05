// ChannelCard.tsx — EasyEPG oversized channel card with AI badge, drag handle, and overflow menu

import React, { useState, useId } from 'react';

/* ─── Types ─── */

export interface Channel {
  id: string;
  name: string;
  /** Display name used in EPG / M3U tvg-name */
  tvgName?: string;
  /** EPG identifier (e.g. "bbc1.uk", "skysportsfootball.uk") */
  tvgId?: string;
  /** Logo URL from CDN or M3U provider */
  logoUrl?: string;
  /** M3U group-title (category) */
  groupTitle?: string;
  /** Backwards-compatible alias */
  group?: string;
  language?: string;
  nextProgram?: { title: string; startTime: string } | null;
  streamUrl: string;
}

export interface ChannelCardProps {
  channel: Channel;
  /** 0.0–1.0 AI match confidence, undefined = no AI info */
  aiConfidence?: number;
  /** Whether this AI suggestion was auto‑applied */
  aiAutoApplied?: boolean;
  /** True when card sits inside the user's own playlist */
  inMyPlaylist?: boolean;
  /** Multi-select support */
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (channelId: string, shiftKey: boolean) => void;
  onToggle?: (channelId: string, enabled: boolean) => void;
  onMenuOpen?: (channelId: string) => void;
  onDragStart?: (channelId: string) => void;
}

/* ─── Helpers ─── */

const confidenceColor = (c: number): string =>
  c >= 0.85 ? 'var(--success)' : c >= 0.75 ? 'var(--warning)' : 'var(--text-muted)';

const confidenceLabel = (c: number, auto: boolean): string => {
  if (auto) return `🤖 Auto‑applied (${Math.round(c * 100)}%)`;
  return `🤖 ${Math.round(c * 100)}%`;
};

const formatTime = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/* ─── Component ─── */

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  aiConfidence,
  aiAutoApplied = false,
  inMyPlaylist = false,
  selected = false,
  selectable = false,
  onSelect,
  onToggle,
  onMenuOpen,
  onDragStart,
}) => {
  const [enabled, setEnabled] = useState(true);
  const cardId = useId();

  const handleToggle = () => {
    setEnabled((p) => !p);
    onToggle?.(channel.id, !enabled);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (selectable && onSelect) {
      onSelect(channel.id, e.shiftKey);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', channel.id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(channel.id);
  };

  return (
    <article
      id={`channel-card-${cardId}`}
      className={`
        channel-card
        ${selectable ? 'channel-card--selectable' : ''}
        ${selected ? 'channel-card--selected' : ''}
        ${inMyPlaylist ? 'channel-card--mine' : ''}
        ${enabled ? '' : 'channel-card--disabled'}
      `}
      role={selectable ? "option" : "listitem"}
      aria-label={`${channel.name}${channel.nextProgram ? `, next: ${channel.nextProgram.title} at ${formatTime(channel.nextProgram.startTime)}` : ''}`}
      aria-selected={selectable ? selected : undefined}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' && selectable && onSelect) onSelect(channel.id, e.shiftKey); }}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Drag handle — visual only */}
      <button
        className="channel-card__drag"
        aria-label={`Drag to reorder ${channel.name}`}
        tabIndex={-1}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--text-muted)" aria-hidden="true">
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>

      {/* Logo */}
      <div className="channel-card__logo-wrapper">
        {channel.logoUrl ? (
          <img
            className="channel-card__logo"
            src={channel.logoUrl}
            alt={`${channel.name} logo`}
            loading="lazy"
          />
        ) : (
          <div className="channel-card__logo-fallback" aria-hidden="true">
            {channel.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="channel-card__info">
        <div className="channel-card__name-row">
          <span className="channel-card__name">{channel.name}</span>
          {aiConfidence !== undefined && (
            <span
              className="channel-card__ai-badge"
              style={{ '--badge-color': confidenceColor(aiConfidence) } as React.CSSProperties}
              aria-label={`AI ${aiAutoApplied ? 'auto-applied' : 'suggestion'}, confidence ${Math.round(aiConfidence * 100)} percent`}
            >
              {confidenceLabel(aiConfidence, aiAutoApplied)}
            </span>
          )}
        </div>
        {channel.nextProgram && (
          <p className="channel-card__next">
            Next: {formatTime(channel.nextProgram.startTime)} – {channel.nextProgram.title}
          </p>
        )}
        {channel.groupTitle && (
          <p className="channel-card__group">{channel.groupTitle}</p>
        )}
      </div>

      {/* Overflow menu */}
      <button
        className="channel-card__menu"
        aria-label={`Menu for ${channel.name}`}
        onClick={() => onMenuOpen?.(channel.id)}
        tabIndex={0}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--text-secondary)" aria-hidden="true">
          <circle cx="10" cy="4" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="16" r="2" />
        </svg>
      </button>

      {/* Toggle switch (only in personal playlist) */}
      {inMyPlaylist && (
        <button
          className={`channel-card__toggle ${enabled ? 'channel-card__toggle--on' : ''}`}
          onClick={handleToggle}
          aria-label={`${enabled ? 'Disable' : 'Enable'} ${channel.name}`}
          aria-pressed={enabled}
          tabIndex={0}
        />
      )}

      {/* ─── Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .channel-card {
          display: flex;
          align-items: center;
          gap: var(--space-sm, 12px);
          padding: var(--space-sm, 12px) var(--space-md, 16px);
          background: var(--bg-card, #F8F9FA);
          border-radius: var(--card-border-radius, 20px);
          min-height: 72px;
          cursor: default;
          transition: background 150ms ease, opacity 200ms ease;
          outline: none;
        }
        .channel-card:hover,
        .channel-card:focus-within {
          background: var(--bg-hover, #F0F1F3);
        }
        .channel-card:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .channel-card--disabled {
          opacity: 0.45;
        }
        .channel-card__drag {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: var(--btn-min-width, 56px);
          min-height: var(--btn-min-height, 56px);
          background: none;
          border: none;
          cursor: grab;
          border-radius: 12px;
          touch-action: none;
        }
        .channel-card__drag:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .channel-card__logo-wrapper {
          flex-shrink: 0;
        }
        .channel-card__logo {
          width: var(--avatar-size, 40px);
          height: var(--avatar-size, 40px);
          border-radius: 8px;
          object-fit: contain;
          background: #fff;
        }
        .channel-card__logo-fallback {
          width: var(--avatar-size, 40px);
          height: var(--avatar-size, 40px);
          border-radius: 8px;
          background: var(--accent-soft, #EFF6FF);
          color: var(--accent, #2563EB);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-lg, 18px);
          font-weight: 600;
        }
        .channel-card__info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .channel-card__name-row {
          display: flex;
          align-items: center;
          gap: var(--space-xs, 8px);
          flex-wrap: wrap;
        }
        .channel-card__name {
          font-size: var(--font-base, 16px);
          font-weight: 600;
          color: var(--text-primary, #1A1A1A);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .channel-card__ai-badge {
          font-size: var(--font-tiny, 12px);
          font-weight: 500;
          color: var(--badge-color, var(--text-muted));
          background: color-mix(in srgb, var(--badge-color, var(--text-muted)) 12%, transparent);
          padding: 2px 10px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .channel-card__next {
          margin: 2px 0 0;
          font-size: var(--font-small, 14px);
          color: var(--text-secondary, #5F6368);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: var(--line-height, 1.6);
        }
        .channel-card__group {
          margin: 0;
          font-size: var(--font-tiny, 12px);
          color: var(--text-muted, #9AA0A6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .channel-card__menu {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: var(--btn-min-width, 56px);
          min-height: var(--btn-min-height, 56px);
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .channel-card__menu:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .channel-card__toggle {
          flex-shrink: 0;
          width: 48px;
          height: 28px;
          border-radius: 14px;
          border: 2px solid var(--border, #E5E7EB);
          background: var(--border, #E5E7EB);
          cursor: pointer;
          position: relative;
          transition: background 150ms ease, border-color 150ms ease;
          min-width: var(--btn-min-width, 56px);
          min-height: var(--btn-min-height, 56px);
        }
        .channel-card__toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 150ms ease;
        }
        .channel-card__toggle--on {
          background: var(--accent, #2563EB);
          border-color: var(--accent, #2563EB);
        }
        .channel-card__toggle--on::after {
          transform: translateX(20px);
        }
        .channel-card__toggle:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }

        /* ─── Selectable/Selected states ─── */
        .channel-card--selectable {
          cursor: pointer;
        }
        .channel-card--selectable:hover {
          outline: 2px solid var(--accent, #2563EB);
          outline-offset: -2px;
        }
        .channel-card--selected {
          background: var(--accent-soft, #EFF6FF) !important;
          outline: 2px solid var(--accent, #2563EB);
          outline-offset: -2px;
          position: relative;
        }
        .channel-card--selected::before {
          content: '✓';
          position: absolute;
          top: 8px;
          left: 8px;
          width: 28px;
          height: 28px;
          background: var(--accent, #2563EB);
          color: #FFFFFF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          z-index: 2;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
      ` }} />
    </article>
  );
};

export default ChannelCard;
