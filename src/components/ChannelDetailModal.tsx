// ChannelDetailModal.tsx — oversized channel detail modal with logo upload, EPG, and remove

import React, { useRef, useEffect } from "react";
import type { Channel } from "./ChannelCard";

/* ─── Types ─── */

export interface EpgEntry {
  start: string;
  stop: string;
  title: string;
  description?: string;
}

export interface ChannelDetailModalProps {
  channel: Channel;
  epgEntries?: EpgEntry[];
  aiConfidence?: number;
  aiAutoApplied?: boolean;
  inMyPlaylist?: boolean;
  onClose: () => void;
  onUploadLogo?: (channelId: string) => void;
  onRemoveFromPlaylist?: (channelId: string) => void;
}

/* ─── Helpers ─── */

const formatTime = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/* ─── Component ─── */

const ChannelDetailModal: React.FC<ChannelDetailModalProps> = ({
  channel,
  epgEntries = [],
  aiConfidence,
  aiAutoApplied = false,
  inMyPlaylist = false,
  onClose,
  onUploadLogo,
  onRemoveFromPlaylist,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    modalRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Build now/next/later from epgEntries
  const now = epgEntries.find(
    (e) => new Date(e.start) <= new Date() && new Date(e.stop) > new Date()
  );
  const next = epgEntries.find(
    (e) => new Date(e.start) > new Date()
  );
  const later = epgEntries.find(
    (e) => new Date(e.start) > new Date() && e.title !== next?.title
  );

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${channel.name}`}
    >
      <div
        ref={modalRef}
        className="modal-content"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Logo */}
        <div className="modal-logo-area">
          {channel.logoUrl ? (
            <img
              className="modal-logo"
              src={channel.logoUrl}
              alt={`${channel.name} logo`}
            />
          ) : (
            <div className="modal-logo-fallback">
              {channel.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Channel name + meta */}
        <h1 className="modal-channel-name">{channel.name}</h1>
        <p className="modal-channel-meta">
          {channel.groupTitle && <span>{channel.groupTitle}</span>}
          {channel.groupTitle && channel.language && <span> · </span>}
          {channel.language && (
            <span>{channel.language.toUpperCase()}</span>
          )}
        </p>

        {/* AI badge */}
        {aiConfidence !== undefined && (
          <span
            className={`modal-ai-badge ${
              aiAutoApplied ? "modal-ai-badge--auto" : "modal-ai-badge--pending"
            }`}
          >
            🤖{" "}
            {aiAutoApplied
              ? `Auto-applied (${Math.round(aiConfidence * 100)}%)`
              : `${Math.round(aiConfidence * 100)}% · pending review`}
          </span>
        )}

        {/* Upload logo button */}
        <button
          className="btn btn--secondary btn--full modal-upload-btn"
          onClick={() => onUploadLogo?.(channel.id)}
          aria-label="Upload custom logo"
        >
          Upload custom logo  +
        </button>

        {/* Now / Next / Later EPG */}
        <div className="modal-epg">
          {now && (
            <div className="modal-epg-row modal-epg-row--now">
              <span className="modal-epg-label">Now</span>
              <span className="modal-epg-time">
                {formatTime(now.start)} – {formatTime(now.stop)}
              </span>
              <span className="modal-epg-title">{now.title}</span>
              {now.description && (
                <p className="modal-epg-desc">{now.description}</p>
              )}
            </div>
          )}
          {next && (
            <div className="modal-epg-row">
              <span className="modal-epg-label">Next</span>
              <span className="modal-epg-time">
                {formatTime(next.start)} – {formatTime(next.stop)}
              </span>
              <span className="modal-epg-title">{next.title}</span>
            </div>
          )}
          {later && (
            <div className="modal-epg-row">
              <span className="modal-epg-label">Later</span>
              <span className="modal-epg-time">
                {formatTime(later.start)} – {formatTime(later.stop)}
              </span>
              <span className="modal-epg-title">{later.title}</span>
            </div>
          )}
          {epgEntries.length === 0 && (
            <p className="modal-epg-empty">No schedule data available.</p>
          )}
        </div>

        {/* Remove button */}
        {inMyPlaylist && (
          <button
            className="btn btn--danger btn--full modal-remove-btn"
            onClick={() => onRemoveFromPlaylist?.(channel.id)}
            aria-label={`Remove ${channel.name} from my playlist`}
          >
            Remove from my playlist
          </button>
        )}

        {/* ─── Styles ─── */}
        <style dangerouslySetInnerHTML={{ __html: `
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            padding: 24px;
          }
          .modal-content {
            background: var(--bg, #FFFFFF);
            border-radius: var(--card-border-radius, 16px);
            padding: var(--space-xl, 32px);
            max-width: 480px;
            width: 100%;
            text-align: center;
            position: relative;
            outline: none;
            max-height: 90vh;
            overflow-y: auto;
          }
          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            min-width: var(--btn-min-width, 56px);
            min-height: var(--btn-min-height, 56px);
            background: none;
            border: none;
            font-size: 22px;
            cursor: pointer;
            color: var(--text-secondary, #5F6368);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .modal-close:focus-visible {
            outline: 3px solid var(--focus-ring, #2563EB);
            outline-offset: 2px;
          }
          .modal-logo-area {
            margin-bottom: var(--space-md, 16px);
          }
          .modal-logo, .modal-logo-fallback {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            object-fit: contain;
            background: var(--bg-card, #F8F9FA);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 700;
            color: var(--accent, #2563EB);
          }
          .modal-channel-name {
            font-size: var(--font-h1, 32px);
            font-weight: 700;
            color: var(--text-primary, #1A1A1A);
            margin: 0 0 4px;
          }
          .modal-channel-meta {
            font-size: var(--font-base, 16px);
            color: var(--text-secondary, #5F6368);
            margin: 0 0 var(--space-md, 16px);
          }
          .modal-ai-badge {
            display: inline-block;
            font-size: var(--font-tiny, 12px);
            font-weight: 500;
            padding: 4px 14px;
            border-radius: 20px;
            margin-bottom: var(--space-md, 16px);
          }
          .modal-ai-badge--auto {
            background: var(--accent-soft, #EFF6FF);
            color: var(--accent, #2563EB);
          }
          .modal-ai-badge--pending {
            background: #FEF3C7;
            color: var(--warning, #D97706);
          }
          .modal-upload-btn {
            margin-bottom: var(--space-lg, 24px);
          }
          .modal-epg {
            text-align: left;
            margin-bottom: var(--space-lg, 24px);
          }
          .modal-epg-row {
            padding: var(--space-sm, 12px) 0;
            border-bottom: 1px solid var(--border, #E5E7EB);
          }
          .modal-epg-row:last-child { border-bottom: none; }
          .modal-epg-row--now {
            background: var(--accent-soft, #EFF6FF);
            margin: 0 calc(-1 * var(--space-sm, 12px));
            padding: var(--space-sm, 12px);
            border-radius: 8px;
            border-bottom: none;
          }
          .modal-epg-label {
            font-size: var(--font-tiny, 12px);
            font-weight: 600;
            color: var(--accent, #2563EB);
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
          }
          .modal-epg-time {
            font-size: var(--font-small, 14px);
            color: var(--text-muted, #9AA0A6);
          }
          .modal-epg-title {
            font-size: var(--font-lg, 18px);
            font-weight: 600;
            color: var(--text-primary, #1A1A1A);
            display: block;
            margin-top: 2px;
          }
          .modal-epg-desc {
            font-size: var(--font-small, 14px);
            color: var(--text-secondary, #5F6368);
            margin: 4px 0 0;
          }
          .modal-epg-empty {
            text-align: center;
            color: var(--text-muted, #9AA0A6);
            padding: var(--space-lg, 24px) 0;
            margin: 0;
          }
          .modal-remove-btn {
            margin-top: var(--space-sm, 12px);
          }
        ` }} />
      </div>
    </div>
  );
};

export default ChannelDetailModal;
