// MasterPlaylistView.tsx — full‑width channel list with top bar, category pills, and AI controls

import React, { useState, useMemo } from 'react';
import ChannelCard, { type Channel } from './ChannelCard';

/* ─── Types ─── */

export interface MasterPlaylistViewProps {
  channels: Channel[];
  aiSuggestionsCount?: number;
  onSave: () => void;
  onShowAiSuggestions: () => void;
  onCategorySelect?: (categories: string[]) => void;
  onCopyToMyPlaylist?: (channelIds: string[]) => void;
  /** Assign selected channels to a category */
  onAssignCategory?: (category: string, channelIds: string[]) => void;
  /** User wants to add categories to their playlist */
  onAddCategoriesToPlaylist?: () => void;
  /** Mock AI confidence map: channelId → { confidence, autoApplied } */
  aiConfidenceMap?: Record<string, { confidence: number; autoApplied: boolean }>;
}

/* ─── Helpers ─── */

const ALL_CATEGORIES = 'All';

/** Extract unique groups from channels, sorted */
const extractCategories = (channels: Channel[]): string[] => {
  const groups = new Set<string>();
  channels.forEach((c) => { if (c.groupTitle || c.group) groups.add(c.groupTitle || c.group!); });
  return [ALL_CATEGORIES, ...Array.from(groups).sort()];
};

/* ─── CategoryPill Sub‑Component ─── */

const CategoryPill: React.FC<{
  label: string;
  selected: boolean;
  onSelect: (label: string) => void;
}> = ({ label, selected, onSelect }) => (
  <button
    className={`pill ${selected ? 'pill--selected' : ''}`}
    onClick={() => onSelect(label)}
    role="checkbox"
    aria-checked={selected}
    aria-label={`Filter by ${label}`}
  >
    {label}
  </button>
);

/* ─── Component ─── */

const MasterPlaylistView: React.FC<MasterPlaylistViewProps> = ({
  channels,
  aiSuggestionsCount = 0,
  onSave,
  onShowAiSuggestions,
  onCategorySelect,
  onCopyToMyPlaylist,
  onAssignCategory,
  onAddCategoriesToPlaylist,
  aiConfidenceMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => extractCategories(channels), [channels]);

  const filteredChannels = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) return channels;
    return channels.filter((c) => (c.groupTitle || c.group) === selectedCategory);
  }, [channels, selectedCategory]);

  const handleCategorySelect = (label: string) => {
    const next = label === ALL_CATEGORIES ? ALL_CATEGORIES : label;
    setSelectedCategory(next);
    onCategorySelect?.(next === ALL_CATEGORIES ? [] : [next]);
  };

  const handleCopySelected = () => {
    if (selectedIds.size > 0) {
      onCopyToMyPlaylist?.(Array.from(selectedIds));
    }
  };

  const handleSelectAllInView = () => {
    if (selectedIds.size === filteredChannels.length) {
      setSelectedIds(new Set());
    } else {
      const ids = filteredChannels.map((c) => c.id);
      setSelectedIds(new Set(ids));
    }
  };

  return (
    <section className="master-playlist" aria-label="Master Playlist">
      {/* ─── Top Bar ─── */}
      <header className="master-playlist__topbar">
        <h1 className="master-playlist__title">Master Playlist ({channels.length})</h1>
        <div className="master-playlist__actions">
          <button
            className="btn btn--primary"
            onClick={onSave}
            aria-label="Save playlist"
          >
            Save
          </button>
          <button
            className="btn btn--ai"
            onClick={onShowAiSuggestions}
            aria-label={`AI Suggestions, ${aiSuggestionsCount} items`}
          >
            🤖 {aiSuggestionsCount > 0 ? `AI (${aiSuggestionsCount})` : 'AI Suggestions'}
          </button>
        </div>
      </header>

      {/* ─── Category Pills ─── */}
      <nav className="master-playlist__categories" aria-label="Channel categories">
        {categories.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onSelect={handleCategorySelect}
          />
        ))}
      </nav>

      {/* ─── Selection toolbar ─── */}
      <div className="master-playlist__selection-bar">
        <span className="master-playlist__selection-count">
          {selectedIds.size > 0
            ? `${selectedIds.size} of ${filteredChannels.length} selected`
            : `${filteredChannels.length} channels`}
        </span>
        <div className="master-playlist__selection-actions">
          <button className="btn btn--ghost" onClick={handleSelectAllInView} aria-label="Select all visible channels">
            {selectedIds.size === filteredChannels.length ? "Deselect all" : "Select all"}
          </button>
          {selectedIds.size > 0 && (
            <>
              <button
                className="btn btn--secondary master-playlist__action-btn"
                onClick={() => onAssignCategory?.("", Array.from(selectedIds))}
                aria-label="Assign selected channels to a category"
              >
                + Category
              </button>
              <button
                className="btn btn--primary master-playlist__action-btn"
                onClick={() => {
                  onCopyToMyPlaylist?.(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                aria-label={`Copy ${selectedIds.size} selected to my playlist`}
              >
                Copy
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Channel List ─── */}
      <div className="master-playlist__list" role="list" aria-label="Channel list">
        {filteredChannels.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            aiConfidence={aiConfidenceMap?.[ch.id]?.confidence}
            aiAutoApplied={aiConfidenceMap?.[ch.id]?.autoApplied}
            onMenuOpen={(id) => console.log('Menu open:', id)}
          />
        ))}
        {filteredChannels.length === 0 && (
          <p className="master-playlist__empty">
            No channels in this category.
          </p>
        )}
      </div>

      {/* ─── Sticky bottom ─── */}
      {selectedIds.size > 0 && (
        <div className="master-playlist__sticky-bottom">
          <button
            className="btn btn--primary btn--full"
            onClick={handleCopySelected}
            aria-label={`Copy ${selectedIds.size} selected channels to my playlist`}
          >
            Copy {selectedIds.size} Selected →
          </button>
        </div>
      )}
      {selectedIds.size === 0 && onAddCategoriesToPlaylist && (
        <div className="master-playlist__sticky-bottom">
          <button
            className="btn btn--ai btn--full"
            onClick={onAddCategoriesToPlaylist}
            aria-label="Add categories to my playlist"
          >
            + Add Categories to Playlist
          </button>
        </div>
      )}

      {/* ─── Styles ─── */}
      <style>{`
        .master-playlist {
          background: var(--bg, #FFFFFF);
          padding: var(--space-lg, 24px) var(--page-gutter, 24px);
          max-width: var(--page-max-width, 640px);
          margin: 0 auto;
          min-height: 100vh;
        }
        .master-playlist__topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-md, 16px);
          margin-bottom: var(--space-lg, 24px);
          flex-wrap: wrap;
        }
        .master-playlist__title {
          font-size: var(--font-h1, 32px);
          font-weight: 700;
          color: var(--text-primary, #1A1A1A);
          margin: 0;
        }
        .master-playlist__actions {
          display: flex;
          gap: var(--space-sm, 12px);
        }
        .master-playlist__categories {
          display: flex;
          gap: var(--space-xs, 8px);
          overflow-x: auto;
          padding-bottom: var(--space-sm, 12px);
          margin-bottom: var(--space-md, 16px);
          scrollbar-width: none;
        }
        .master-playlist__categories::-webkit-scrollbar { display: none; }
        .master-playlist__selection-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm, 12px);
          flex-wrap: wrap;
          gap: var(--space-xs, 8px);
        }
        .master-playlist__selection-actions {
          display: flex;
          gap: var(--space-xs, 8px);
          align-items: center;
        }
        .master-playlist__action-btn {
          min-height: 44px;
          padding: 0 16px;
          font-size: 14px;
        }
        .master-playlist__selection-count {
          font-size: var(--font-small, 14px);
          color: var(--text-secondary, #5F6368);
        }
        .master-playlist__list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 8px);
          padding-bottom: 120px;
        }
        .master-playlist__empty {
          text-align: center;
          padding: var(--space-2xl, 48px);
          color: var(--text-muted, #9AA0A6);
          font-size: var(--font-base, 16px);
        }
        .master-playlist__sticky-bottom {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: var(--space-md, 16px) var(--page-gutter, 24px);
          padding-bottom: calc(var(--space-md, 16px) + env(safe-area-inset-bottom, 0px));
          background: var(--bg, #FFFFFF);
          border-top: 1px solid var(--border, #E5E7EB);
          z-index: 10;
        }

        /* ─── Buttons ─── */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xs, 8px);
          min-height: var(--btn-min-height, 56px);
          padding: 0 var(--btn-padding-x, 32px);
          border-radius: var(--btn-border-radius, 12px);
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
          min-height: auto;
          padding: 0 8px;
          font-size: var(--font-base, 16px);
          font-weight: 500;
        }
        .btn--full { width: 100%; }

        /* ─── Pill ─── */
        .pill {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 6px 20px;
          border-radius: 22px;
          font-size: var(--font-small, 14px);
          font-weight: 500;
          font-family: var(--font-family, sans-serif);
          background: var(--bg-card, #F8F9FA);
          color: var(--text-secondary, #5F6368);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 150ms ease, color 150ms ease;
          flex-shrink: 0;
        }
        .pill:hover { background: var(--bg-hover, #F0F1F3); }
        .pill--selected {
          background: var(--accent-soft, #EFF6FF);
          color: var(--accent, #2563EB);
        }
        .pill:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
      `}</style>
    </section>
  );
};

export default MasterPlaylistView;
