// PersonalPlaylistView.tsx — two‑pane Master → My Playlist copy flow with Copy All and Smart Suggest

import React, { useState, useCallback, useRef } from 'react';
import ChannelCard, { type Channel } from './ChannelCard';

/* ─── Helpers ─── */

/** Group channels by groupTitle, preserving order */
function groupByCategory(chs: Channel[]): Map<string, Channel[]> {
  const map = new Map<string, Channel[]>();
  for (const ch of chs) {
    const key = ch.groupTitle || ch.group || "Uncategorised";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ch);
  }
  return map;
}

/* ─── Types ─── */

export type CopyMode = 'all' | 'category' | 'smart';

export interface PersonalPlaylistViewProps {
  masterChannels: Channel[];
  myChannels: Channel[];
  /** Name of the active personal playlist */
  activePlaylistName?: string;
  /** Color of the active personal playlist */
  activePlaylistColor?: string;
  /** Other playlists to show on the right side (for multi-playlist view) */
  otherPlaylists?: Array<{ id: string; name: string; color?: string; channels: Channel[] }>;
  /** Mock AI confidence map for master channels */
  aiConfidenceMap?: Record<string, { confidence: number; autoApplied: boolean }>;
  /** Smart suggest result: AI‑picked channel IDs + avg confidence */
  smartSuggestResult?: { channelIds: string[]; avgConfidence: number } | null;
  /** Called when user initiates a copy */
  onCopyFromMaster: (mode: CopyMode, categories?: string[]) => void;
  onRemoveFromMyPlaylist: (channelId: string) => void;
  onToggleChannel?: (channelId: string, enabled: boolean) => void;
  /** Returns true when the viewport is narrow */
  isMobile?: boolean;
}

/* ─── Smart Suggest Modal ─── */

const SmartSuggestModal: React.FC<{
  result: { channelIds: string[]; avgConfidence: number };
  onCopy: () => void;
  onDismiss: () => void;
}> = ({ result, onCopy, onDismiss }) => (
  <div className="two-pane__modal-overlay" role="dialog" aria-modal="true" aria-label="Smart Suggest results">
    <div className="two-pane__modal">
      <h2 className="two-pane__modal-title">⚡ AI suggests adding {result.channelIds.length} channels</h2>
      <p className="two-pane__modal-conf">
        Average confidence: {Math.round(result.avgConfidence * 100)}%
      </p>
      <p className="two-pane__modal-note">
        {result.avgConfidence >= 0.75
          ? '✅ Auto‑apply enabled — channels will be added automatically.'
          : '⏳ Some suggestions need your review.'}
      </p>
      <div className="two-pane__modal-actions">
        <button
          className="btn btn--primary"
          onClick={onCopy}
          aria-label={`Copy ${result.channelIds.length} selected channels`}
        >
          Copy {result.channelIds.length} Selected
        </button>
        <button className="btn btn--ghost" onClick={onDismiss} aria-label="Dismiss suggestions">
          Dismiss
        </button>
      </div>
    </div>
  </div>
);

/* ─── Component ─── */

const PersonalPlaylistView: React.FC<PersonalPlaylistViewProps> = ({
  masterChannels,
  myChannels,
  aiConfidenceMap,
  smartSuggestResult = null,
  onCopyFromMaster,
  onRemoveFromMyPlaylist,
  onToggleChannel,
  otherPlaylists = [],
  activePlaylistName = 'My Playlist',
  activePlaylistColor = '',
  isMobile = false,
}) => {
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [selectedMasterIds, setSelectedMasterIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<number>(-1);

  const handleSmartSuggest = () => {
    onCopyFromMaster('smart');
    if (smartSuggestResult) {
      setShowSuggestModal(true);
    }
  };

  const handleSelectMaster = useCallback((channelId: string, shiftKey: boolean) => {
    setSelectedMasterIds((prev) => {
      const next = new Set(prev);
      const idx = masterChannels.findIndex((c) => c.id === channelId);

      if (shiftKey && lastClickedRef.current >= 0 && idx >= 0) {
        // Select range from last clicked to this one
        const start = Math.min(lastClickedRef.current, idx);
        const end = Math.max(lastClickedRef.current, idx);
        for (let i = start; i <= end; i++) {
          next.add(masterChannels[i].id);
        }
      } else if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }

      lastClickedRef.current = idx;
      return next;
    });
  }, [masterChannels]);

  const handleAddSelected = () => {
    if (selectedMasterIds.size === 0) return;
    // Convert to copy from master by passing selected IDs
    onCopyFromMaster('all');
    setSelectedMasterIds(new Set());
  };

  const handleCopyAll = () => onCopyFromMaster('all');
  const handleRemoveAll = () => myChannels.forEach((c) => onRemoveFromMyPlaylist(c.id));

  const masterCount = masterChannels.length;
  const myCount = myChannels.length;
  const selectedCount = selectedMasterIds.size;

  const pane = (title: string, chs: Channel[], count: number, side: 'master' | 'mine') => {
    // Group "mine" channels by category
    const grouped = side === 'mine' ? groupByCategory(chs) : null;

    return (
    <div className={`two-pane__pane two-pane__pane--${side}`}>
      <h2 className="two-pane__pane-title">
        {title}
        <span className="two-pane__pane-count"> ({count})</span>
        {side === 'master' && selectedCount > 0 && (
          <span className="two-pane__selected-badge">{selectedCount} selected</span>
        )}
      </h2>
      <div className="two-pane__pane-list" role="list" aria-label={`${title} channels`}>
        {side === 'mine' && grouped ? (
          // Render with category headers
          Array.from(grouped.entries()).map(([cat, catChs]) => (
            <div key={cat} className="two-pane__cat-group">
              <div className="two-pane__cat-header">{cat}</div>
              {catChs.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  aiConfidence={aiConfidenceMap?.[ch.id]?.confidence}
                  aiAutoApplied={aiConfidenceMap?.[ch.id]?.autoApplied}
                  inMyPlaylist={true}
                  onToggle={onToggleChannel}
                  onMenuOpen={(id) => console.log('Menu open:', id)}
                />
              ))}
            </div>
          ))
        ) : (
          // Flat list for master
          chs.map((ch, i) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              aiConfidence={aiConfidenceMap?.[ch.id]?.confidence}
              aiAutoApplied={aiConfidenceMap?.[ch.id]?.autoApplied}
              inMyPlaylist={side === 'mine'}
              selectable={side === 'master'}
              selected={side === 'master' ? selectedMasterIds.has(ch.id) : false}
              onSelect={side === 'master' ? handleSelectMaster : undefined}
              onToggle={onToggleChannel}
              onMenuOpen={(id) => console.log('Menu open:', id)}
            />
          ))
        )}
        {chs.length === 0 && (
          <p className="two-pane__empty">
            {side === 'master' ? 'No channels available.' : 'Your playlist is empty. Add channels from the Master list.'}
          </p>
        )}
      </div>

      {/* Pane actions */}
      <div className="two-pane__pane-actions">
        {side === 'master' && (
          <>
            {selectedCount > 0 && (
              <button className="btn btn--primary two-pane__add-btn" onClick={handleAddSelected} aria-label={`Add ${selectedCount} selected channels`}>
                → Add {selectedCount} to My Playlist
              </button>
            )}
            <button className={`btn ${selectedCount > 0 ? 'btn--secondary' : 'btn--primary'}`} onClick={handleCopyAll} aria-label="Copy all channels">
              Copy All ({count})
            </button>
            <button className="btn btn--ai" onClick={handleSmartSuggest} aria-label="Smart Suggest: AI picks channels for you">
              Smart Suggest
            </button>
          </>
        )}
        {side === 'mine' && myCount > 0 && (
          <button className="btn btn--danger" onClick={handleRemoveAll} aria-label="Remove all channels from my playlist">
            Remove All ({myCount})
          </button>
        )}
      </div>
    </div>
  );
  };

  /* ─── Mobile: Single column ─── */
  if (isMobile) {
    return (
      <section className="two-pane two-pane--mobile" aria-label="Personal Playlist Editor">
        <header className="two-pane__topbar">
          <h1 className="two-pane__title">{activePlaylistName} ({myCount})</h1>
        </header>

        {pane(activePlaylistName, myChannels, myCount, 'mine')}

        <div className="two-pane__sticky-add">
          <button
            className="btn btn--primary btn--full"
            onClick={() => setShowSuggestModal(true)}
            aria-label="Add channels from Master Playlist"
          >
            Add Channels
          </button>
        </div>

        {/* "Add Channels" modal on mobile renders the master list */}
        {showSuggestModal && (
          <div className="two-pane__modal-overlay" role="dialog" aria-modal="true" aria-label="Add channels">
            <div className="two-pane__modal two-pane__modal--full">
              <header className="two-pane__modal-header">
                <h2 className="two-pane__modal-title">Master Playlist ({masterCount})</h2>
                <button
                  className="btn btn--ghost"
                  onClick={() => setShowSuggestModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>
              <div className="two-pane__pane-list" role="list">
                {masterChannels.map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    aiConfidence={aiConfidenceMap?.[ch.id]?.confidence}
                    aiAutoApplied={aiConfidenceMap?.[ch.id]?.autoApplied}
                    onMenuOpen={(id) => console.log('Menu:', id)}
                  />
                ))}
              </div>
              <div className="two-pane__sticky-copy">
                <button className="btn btn--primary btn--full" onClick={handleCopyAll}>
                  Copy All ({masterCount})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Suggest modal */}
        {smartSuggestResult && showSuggestModal && (
          <SmartSuggestModal
            result={smartSuggestResult}
            onCopy={() => { onCopyFromMaster('smart'); setShowSuggestModal(false); }}
            onDismiss={() => setShowSuggestModal(false)}
          />
        )}
      </section>
    );
  }

  /* ─── Desktop: side‑by‑side ─── */

  return (
    <section className="two-pane" aria-label="Personal Playlist Editor">
      <header className="two-pane__topbar">
        <h1 className="two-pane__title">{activePlaylistName} ({myCount})</h1>
      </header>
      <div className="two-pane__grid">
        {pane('Master Playlist', masterChannels, masterCount, 'master')}
        <div className="two-pane__right">
          <div
            className={`two-pane__sheet two-pane__sheet--first`}
            style={activePlaylistColor ? { borderColor: activePlaylistColor, borderWidth: 2, borderStyle: 'solid', borderRadius: 20 } : undefined}
          >
            {pane(activePlaylistName, myChannels, myCount, 'mine')}
          </div>
        </div>
      </div>

      {/* Smart Suggest modal */}
      {smartSuggestResult && showSuggestModal && (
        <SmartSuggestModal
          result={smartSuggestResult}
          onCopy={() => { onCopyFromMaster('smart'); setShowSuggestModal(false); }}
          onDismiss={() => setShowSuggestModal(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .two-pane {
          background: var(--bg, #FFFFFF);
          padding: var(--space-lg, 24px) var(--page-gutter, 24px);
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
        }
        @media (max-width: 600px) {
          .two-pane {
            padding: 16px 12px;
          }
        }
        .two-pane--mobile {
          max-width: var(--page-max-width, 640px);
        }
        .two-pane__topbar {
          margin-bottom: var(--space-lg, 24px);
        }
        .two-pane__title {
          font-size: var(--font-h1, 32px);
          font-weight: 700;
          color: var(--text-primary, #1A1A1A);
          margin: 0;
        }
        .two-pane__grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg, 24px);
          align-items: start;
        }
        @media (min-width: 900px) {
          .two-pane__grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .two-pane__right {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .two-pane__sheet--first {
          outline: 3px solid var(--accent, #2563EB);
          outline-offset: 2px;
          border-radius: 20px;
        }
        .two-pane__pane {
          background: var(--bg-card, #F8F9FA);
          border-radius: var(--card-border-radius, 20px);
          padding: var(--card-padding, 20px);
        }
        .two-pane__pane-title {
          font-size: var(--font-h2, 22px);
          font-weight: 600;
          color: var(--text-primary, #1A1A1A);
          margin: 0 0 var(--space-md, 16px);
          display: flex;
          align-items: center;
          gap: var(--space-xs, 8px);
          flex-wrap: wrap;
        }
        .two-pane__pane-count {
          font-weight: 400;
          color: var(--text-secondary, #5F6368);
        }
        .two-pane__selected-badge {
          font-size: var(--font-small, 14px);
          font-weight: 500;
          color: var(--accent, #2563EB);
          background: var(--accent-soft, #EFF6FF);
          padding: 4px 14px;
          border-radius: 20px;
        }
        .two-pane__add-btn {
          width: 100%;
          margin-bottom: var(--space-xs, 8px);
        }
        .two-pane__pane-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 8px);
          max-height: 60vh;
          overflow-y: auto;
          margin-bottom: var(--space-md, 16px);
        }
        .two-pane__pane-actions {
          display: flex;
          gap: var(--space-sm, 12px);
          flex-wrap: wrap;
        }
        .two-pane__empty {
          text-align: center;
          padding: var(--space-xl, 32px);
          color: var(--text-muted, #9AA0A6);
          font-size: var(--font-base, 16px);
          border-radius: 20px;
        }
        /* ─── Category grouping ─── */
        .two-pane__cat-group {
          margin-bottom: var(--space-xs, 8px);
        }
        .two-pane__cat-header {
          font-size: var(--font-small, 14px);
          font-weight: 600;
          color: var(--accent, #2563EB);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: var(--space-xs, 8px) var(--space-sm, 12px) var(--space-xs, 8px);
          background: var(--accent-soft, #EFF6FF);
          border-radius: 8px 8px 0 0;
          margin-bottom: 2px;
        }
        .two-pane__sticky-add,
        .two-pane__sticky-copy {
          position: sticky;
          bottom: 0;
          padding: var(--space-md, 16px) 0;
          padding-bottom: calc(var(--space-md, 16px) + env(safe-area-inset-bottom, 0px));
          background: var(--bg, #FFFFFF);
        }

        /* ─── Modal ─── */
        .two-pane__modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: var(--space-lg, 24px);
        }
        .two-pane__modal {
          background: var(--bg, #FFFFFF);
          border-radius: var(--card-border-radius, 16px);
          padding: var(--space-xl, 32px);
          max-width: 480px;
          width: 100%;
        }
        .two-pane__modal--full {
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          padding: var(--space-lg, 24px);
        }
        .two-pane__modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md, 16px);
        }
        .two-pane__modal-title {
          font-size: var(--font-h2, 22px);
          font-weight: 600;
          color: var(--text-primary, #1A1A1A);
          margin: 0 0 var(--space-xs, 8px);
        }
        .two-pane__modal-conf {
          font-size: var(--font-lg, 18px);
          color: var(--text-secondary, #5F6368);
          margin: 0 0 var(--space-xs, 8px);
        }
        .two-pane__modal-note {
          font-size: var(--font-base, 16px);
          color: var(--text-muted, #9AA0A6);
          margin: 0 0 var(--space-lg, 24px);
        }
        .two-pane__modal-actions {
          display: flex;
          gap: var(--space-sm, 12px);
        }

        /* ─── Shared button styles (duplicated from MasterPlaylistView for self‑containedness) ─── */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xs, 8px);
          min-height: var(--btn-min-height, 56px);
          padding: 0 var(--btn-padding-x, 32px);
          border-radius: var(--btn-border-radius, 14px);
          font-size: 18px;
          font-weight: 600;
          font-family: var(--font-family, sans-serif);
          border: none;
          cursor: pointer;
          transition: background 150ms ease, transform 100ms ease;
          white-space: nowrap;
          text-decoration: none;
          line-height: 1;
        }
        .btn:active { transform: scale(0.97); }
        .btn:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .btn--primary {
          background: var(--accent, #2563EB);
          color: #FFFFFF;
        }
        .btn--primary:hover { background: var(--accent-hover, #1D4ED8); }
        .btn--ai {
          background: var(--accent-soft, #EFF6FF);
          color: var(--accent, #2563EB);
        }
        .btn--ai:hover { background: #DBEAFE; }
        .btn--ghost {
          background: transparent;
          color: var(--accent, #2563EB);
          font-size: var(--font-base, 16px);
          font-weight: 500;
          min-height: auto;
          padding: 0 8px;
        }
        .btn--danger {
          background: var(--danger, #DC2626);
          color: #FFFFFF;
        }
        .btn--danger:hover { background: #B91C1C; }
        .btn--full { width: 100%; }
      ` }} />
    </section>
  );
};

export default PersonalPlaylistView;
