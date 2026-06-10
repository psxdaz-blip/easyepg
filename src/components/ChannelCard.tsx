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
  onDragOver?: (e: React.DragEvent) => void;
  onMoveUp?: (channelId: string) => void;
  onMoveDown?: (channelId: string) => void;
  onEpgSourceClick?: (channelId: string) => void;
  /** Set of ALL selected channel IDs (for multi-select drag) */
  selectedIds?: Set<string>;
  /** EPG source indicator */
  epgSourceColor?: string;
  epgSourceName?: string;
  /** Brief highlight flash after move */
  moving?: boolean;
}

/* ─── Helpers ─── */

const confidenceColor = (c: number): string =>
  c >= 0.85 ? 'var(--success)' : c >= 0.75 ? 'var(--warning)' : 'var(--text-muted)';

const confidenceLabel = (c: number): string =>
  `🤖 ${Math.round(c * 100)}%`;

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
  onDragOver,
  onMoveUp,
  onMoveDown,
  onEpgSourceClick,
  selectedIds,
  moving,
  epgSourceColor,
  epgSourceName,
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
    // Multi-select drag: include all selected IDs when dragging a selected channel
    if (selected && selectedIds && selectedIds.size > 1) {
      e.dataTransfer.setData('text/plain', Array.from(selectedIds).join('|'));
      e.dataTransfer.effectAllowed = 'copyMove';
    } else {
      e.dataTransfer.setData('text/plain', channel.id);
      e.dataTransfer.effectAllowed = 'copyMove';
    }
    onDragStart?.(channel.id);
  };

  return (
    <article
      id={`channel-card-${cardId}`}
      data-channel-id={channel.id}
      className={`
        channel-card
        ${selectable ? 'channel-card--selectable' : ''}
        ${selected ? 'channel-card--selected' : ''}
        ${inMyPlaylist ? 'channel-card--mine' : ''}
        ${enabled ? '' : 'channel-card--disabled'}
        ${moving ? 'channel-card--moving' : ''}
      `}
      role={selectable ? "option" : "listitem"}
      aria-label={`${channel.name}${channel.nextProgram ? `, next: ${channel.nextProgram.title} at ${formatTime(channel.nextProgram.startTime)}` : ''}`}
      aria-selected={selectable ? selected : undefined}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' && selectable && onSelect) onSelect(channel.id, e.shiftKey); }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
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
          {epgSourceColor && (
            <button
              className="channel-card__epg-dot"
              style={{ background: epgSourceColor, boxShadow: `0 0 6px ${epgSourceColor}40` }}
              onClick={(e) => { e.stopPropagation(); onEpgSourceClick?.(channel.id); }}
              aria-label={`EPG: ${epgSourceName || 'Unknown'}. Click to change.`}
              title={`EPG: ${epgSourceName || 'Unknown'}`}
            />
          )}
          <span className="channel-card__name">{channel.name}</span>
          {aiConfidence !== undefined && (
            <span
              className="channel-card__ai-badge"
              style={{ '--badge-color': confidenceColor(aiConfidence) } as React.CSSProperties}
              aria-label={`AI suggestion, confidence ${Math.round(aiConfidence * 100)} percent`}
            >
              {confidenceLabel(aiConfidence)}
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

      {/* Selection checkmark (absolutely positioned so text doesn't shift) */}
      {selected && (
        <div className="channel-card__check" aria-hidden="true">
          <div className="channel-card__check-ring" />
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 12 9 17 20 6" />
          </svg>
        </div>
      )}

      {/* Move up/down buttons (only in playlist) */}
      {inMyPlaylist && (
        <div className="channel-card__move-group">
          <button
            className="channel-card__move-btn"
            onClick={() => onMoveUp?.(channel.id)}
            aria-label={`Move ${channel.name} up`}
            tabIndex={0}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--text-secondary)" aria-hidden="true">
              <path d="M8 3l6 6H2z" />
            </svg>
          </button>
          <button
            className="channel-card__move-btn"
            onClick={() => onMoveDown?.(channel.id)}
            aria-label={`Move ${channel.name} down`}
            tabIndex={0}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--text-secondary)" aria-hidden="true">
              <path d="M8 13l-6-6h12z" />
            </svg>
          </button>
        </div>
      )}

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
        .channel-card--moving {
          animation: channel-move-flash 400ms ease-out;
        }
        @keyframes channel-move-flash {
          0% { background: var(--accent-soft, #EFF6FF); outline: 2px solid var(--accent, #2563EB); outline-offset: -2px; }
          100% { background: var(--bg-card, #F8F9FA); outline-color: transparent; }
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
        .channel-card__epg-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
          border: none; cursor: pointer; padding: 0;
          transition: transform 150ms ease;
        }
        .channel-card__epg-dot:hover { transform: scale(1.4); }
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
        .channel-card__move-group {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .channel-card__move-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 28px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 120ms ease;
        }
        .channel-card__move-btn:hover {
          background: var(--bg-hover, #F0F1F3);
        }
        .channel-card__move-btn:active {
          background: var(--border, #E5E7EB);
        }
        .channel-card__move-btn:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .channel-card__toggle {
          flex-shrink: 0;
          width: 52px;
          height: 30px;
          border-radius: 15px;
          border: none;
          background: var(--border, #E5E7EB);
          cursor: pointer;
          position: relative;
          transition: background 200ms ease;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
          padding: 0;
          appearance: none;
        }
        .channel-card__toggle::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          transition: transform 200ms ease;
        }
        .channel-card__toggle--on {
          background: var(--accent, #2563EB);
        }
        .channel-card__toggle--on::after {
          transform: translateX(22px);
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
          background: linear-gradient(135deg, #E8EEFF 0%, #FFFFFF 50%) !important;
          position: relative;
          box-shadow:
            inset 4px 0 0 0 var(--accent, #2563EB),
            0 0 0 1px rgba(37,99,235,0.06),
            0 4px 24px rgba(37,99,235,0.12);
        }
        .channel-card--selected .channel-card__info {
          padding-right: 60px;
        }
        .channel-card__check {
          position: absolute;
          right: 80px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent, #2563EB);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: check-bounce 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 3px 14px rgba(37,99,235,0.4);
        }
        .channel-card__check-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2.5px solid var(--accent, #2563EB);
          opacity: 0;
          animation: check-ring-pulse 1.5s ease-out 300ms infinite;
        }
        .channel-card__check svg {
          position: relative;
          z-index: 1;
          animation: check-draw 400ms ease-out 150ms both;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }
        @keyframes check-bounce {
          0% { transform: translateY(-50%) scale(0); opacity: 0; }
          60% { transform: translateY(-50%) scale(1.15); }
          80% { transform: translateY(-50%) scale(0.95); }
          100% { transform: translateY(-50%) scale(1); opacity: 1; }
        }
        @keyframes check-draw {
          0% { stroke-dashoffset: 30; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes check-ring-pulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.4); }
        }
      ` }} />
    </article>
  );
};

export default ChannelCard;
