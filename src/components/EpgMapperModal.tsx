// components/EpgMapperModal.tsx — Match playlist channels to EPG channels

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { epgStore } from "@/lib/epg-store";
import type { Channel } from "./ChannelCard";

export interface EpgMapperModalProps {
  open: boolean;
  onClose: () => void;
  sourceId: string;
  playlistChannels: Channel[];
  onToast: (msg: string) => void;
}

const EpgMapperModal: React.FC<EpgMapperModalProps> = ({
  open,
  onClose,
  sourceId,
  playlistChannels,
  onToast,
}) => {
  const [search, setSearch] = useState("");
  const [mapped, setMapped] = useState<Map<string, string>>(new Map());
  const [autoApplied, setAutoApplied] = useState(false);

  const epgChannels = useMemo(() => epgStore.getChannels(sourceId), [sourceId]);

  useEffect(() => {
    if (open) {
      setMapped(new Map(epgStore.getAllMappings()));
      setAutoApplied(false);
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filteredPlaylist = useMemo(
    () =>
      playlistChannels.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.tvgId || "").toLowerCase().includes(search.toLowerCase())
      ),
    [playlistChannels, search]
  );

  const filteredEpg = useMemo(
    () =>
      epgChannels.filter(
        (c) =>
          c.displayName.toLowerCase().includes(search.toLowerCase()) ||
          c.tvgId.toLowerCase().includes(search.toLowerCase())
      ),
    [epgChannels, search]
  );

  const handleAutoMatch = () => {
    const newMapped = new Map(mapped);
    let count = 0;
    for (const pl of playlistChannels) {
      if (newMapped.has(pl.id)) continue;
      // Try to find EPG channel with matching tvgId or name
      const match = epgChannels.find(
        (epg) =>
          epg.tvgId === pl.tvgId ||
          epg.displayName.toLowerCase().includes(pl.name.toLowerCase().split(" ")[0].toLowerCase())
      );
      if (match) {
        newMapped.set(pl.id, match.tvgId);
        epgStore.setMapping(pl.id, match.tvgId);
        count++;
      }
    }
    setMapped(newMapped);
    setAutoApplied(true);
    onToast(`✅ Auto-matched ${count} channels`);
  };

  const handleToggleMapping = (channelId: string, tvgId: string) => {
    const newMapped = new Map(mapped);
    if (newMapped.has(channelId) && newMapped.get(channelId) === tvgId) {
      newMapped.delete(channelId);
      epgStore.removeMapping(channelId);
    } else {
      newMapped.set(channelId, tvgId);
      epgStore.setMapping(channelId, tvgId);
    }
    setMapped(newMapped);
  };

  if (!open) return null;

  return (
    <div
      className="emm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Match channels to EPG"
    >
      <div className="emm-modal">
        <div className="emm-header">
          <h2 className="emm-title">Match Channels to EPG</h2>
          <button className="emm-close" onClick={onClose}>✕</button>
        </div>

        <p className="emm-sub">
          {epgChannels.length} EPG channels loaded. Link your playlist channels to EPG data for accurate TV schedules.
        </p>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          aria-label="Search channels"
          className="emm-search"
        />

        {/* Auto-match button */}
        <button className="btn btn--ai btn--full emm-auto-btn" onClick={handleAutoMatch}>
          {autoApplied ? "✅ Auto-match complete" : "⚡ Auto-match by name/ID"}
        </button>

        {/* Two-column mapper */}
        <div className="emm-grid">
          {/* Playlist channels */}
          <div className="emm-col">
            <h3 className="emm-col-title">Playlist Channels ({filteredPlaylist.length})</h3>
            <div className="emm-list">
              {filteredPlaylist.map((pl) => {
                const mappedTvg = mapped.get(pl.id);
                return (
                  <div key={pl.id} className={`emm-item ${mappedTvg ? "emm-item--mapped" : ""}`}>
                    <div className="emm-item-info">
                      <span className="emm-item-name">{pl.name}</span>
                      <span className="emm-item-id">{pl.tvgId || "no tvg-id"}</span>
                    </div>
                    <span className="emm-item-status">
                      {mappedTvg ? "✓" : "—"}
                    </span>
                  </div>
                );
              })}
              {filteredPlaylist.length === 0 && (
                <p className="emm-empty">No matching channels</p>
              )}
            </div>
          </div>

          {/* EPG channels */}
          <div className="emm-col">
            <h3 className="emm-col-title">EPG Channels ({filteredEpg.length})</h3>
            <div className="emm-list">
              {filteredEpg.map((epg) => {
                const isMapped = Array.from(mapped.values()).includes(epg.tvgId);
                return (
                  <button
                    key={epg.tvgId}
                    className={`emm-item emm-item--clickable ${isMapped ? "emm-item--used" : ""}`}
                    onClick={() => {
                      // Find first unmapped playlist channel and map it
                      const unmapped = playlistChannels.find(
                        (pl) => !mapped.has(pl.id)
                      );
                      if (unmapped) handleToggleMapping(unmapped.id, epg.tvgId);
                    }}
                    aria-label={`Map to EPG channel ${epg.displayName}`}
                  >
                    <div className="emm-item-info">
                      <span className="emm-item-name">{epg.displayName}</span>
                      <span className="emm-item-id">{epg.tvgId}</span>
                    </div>
                    <span className="emm-item-status">
                      {isMapped ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
              {filteredEpg.length === 0 && (
                <p className="emm-empty">No matching EPG channels</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="emm-footer">
          <p className="emm-summary">
            {Array.from(mapped.keys()).length} of {playlistChannels.length} channels mapped
          </p>
          <div className="emm-footer-actions">
            <button className="btn btn--ghost" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>

      <style>{`
        .emm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 24px;
        }
        .emm-modal {
          background: var(--bg, #FFFFFF);
          border-radius: var(--card-border-radius, 16px);
          max-width: 800px; width: 100%; max-height: 85vh;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .emm-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-xl, 32px) var(--space-xl, 32px) 0;
        }
        .emm-title {
          font-size: var(--font-h1, 32px); font-weight: 700;
          color: var(--text-primary, #1A1A1A); margin: 0;
        }
        .emm-close {
          min-width: var(--btn-min-width, 56px); min-height: var(--btn-min-height, 56px);
          background: none; border: none; font-size: 22px; cursor: pointer;
          color: var(--text-secondary, #5F6368); border-radius: 8px;
        }
        .emm-sub {
          font-size: var(--font-base, 16px); color: var(--text-secondary, #5F6368);
          margin: 8px var(--space-xl, 32px) var(--space-md, 16px);
        }
        .emm-search {
          margin: 0 var(--space-xl, 32px) var(--space-md, 16px);
          min-height: 52px; padding: 0 20px; border-radius: var(--btn-border-radius, 12px);
          border: 2px solid var(--border, #E5E7EB); font-size: 16px; outline: none;
        }
        .emm-search:focus { border-color: var(--accent, #2563EB); }
        .emm-auto-btn {
          margin: 0 var(--space-xl, 32px) var(--space-md, 16px);
          min-height: 48px; font-size: 15px;
        }
        .emm-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md, 16px);
          padding: 0 var(--space-xl, 32px);
          flex: 1; overflow: hidden;
        }
        .emm-col {
          display: flex; flex-direction: column; overflow: hidden;
        }
        .emm-col-title {
          font-size: var(--font-small, 14px); font-weight: 600;
          color: var(--text-secondary, #5F6368);
          margin: 0 0 var(--space-xs, 8px); flex-shrink: 0;
        }
        .emm-list {
          display: flex; flex-direction: column; gap: 4px;
          overflow-y: auto; flex: 1;
          border: 1px solid var(--border, #E5E7EB);
          border-radius: var(--btn-border-radius, 12px);
          padding: var(--space-xs, 8px);
        }
        .emm-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; border-radius: 8px;
          min-height: 44px;
        }
        .emm-item--clickable {
          cursor: pointer; background: none; border: none; width: 100%; text-align: left;
        }
        .emm-item--clickable:hover { background: var(--bg-hover, #F0F1F3); }
        .emm-item--mapped { background: var(--accent-soft, #EFF6FF); }
        .emm-item--used { background: #F0FDF4; }
        .emm-item-info { display: flex; flex-direction: column; min-width: 0; }
        .emm-item-name { font-size: 14px; font-weight: 500; color: var(--text-primary, #1A1A1A); }
        .emm-item-id { font-size: 12px; color: var(--text-muted, #9AA0A6); }
        .emm-item-status {
          font-size: 14px; font-weight: 700; flex-shrink: 0;
          width: 24px; text-align: center;
          color: var(--accent, #2563EB);
        }
        .emm-empty { text-align: center; padding: 24px; color: var(--text-muted, #9AA0A6); font-size: 14px; }
        .emm-footer {
          padding: var(--space-md, 16px) var(--space-xl, 32px);
          border-top: 1px solid var(--border, #E5E7EB);
          display: flex; align-items: center; justify-content: space-between;
        }
        .emm-summary { font-size: 14px; color: var(--text-secondary, #5F6368); margin: 0; }
        .emm-footer-actions { display: flex; gap: 8px; }
      `}</style>
    </div>
  );
};

export default EpgMapperModal;
