"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { mockMasterChannels } from "@/lib/mock-data";
import { epgStore } from "@/lib/epg-store";

const EPG_COLORS = ['#D2FF00','#FF6B9D','#5BC0EB','#00C9A7','#FFD166','#FF8C42','#C084FC','#F472B6'];

interface EpgSourceData {
  id: string;
  name: string;
  url: string;
  status: "loading" | "loaded" | "error";
  channelCount: number;
  entryCount: number;
  addedAt: string;
  channels?: Array<{ tvgId: string; displayName: string }>;
}

export default function DashboardPage() {
  const [sources, setSources] = useState<EpgSourceData[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Load EPG sources ─── */
  const loadSources = async () => {
    try {
      const res = await fetch("/api/epg/sources");
      const data = await res.json();
      setSources(data.sources || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadSources();
    const interval = setInterval(loadSources, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Compute EPG coverage ─── */
  const { channelsWithEpg, channelsWithoutEpg, coveragePct, epgSourceMap } = useMemo(() => {
    const allChannels = mockMasterChannels;
    let withEpg = 0;
    let withoutEpg = 0;
    const sourceMap = new Map<string, { sourceId: string; sourceName: string }>();

    // Build lookup from loaded EPG sources
    const loadedSources = sources.filter((s) => s.status === "loaded");

    for (const ch of allChannels) {
      const tvgId = ch.tvgId || ch.id;
      // Check all loaded sources for this tvgId
      let found = false;
      for (const src of loadedSources) {
        const epgCh = src.channels?.find((ec) => ec.tvgId === tvgId);
        if (epgCh) {
          found = true;
          sourceMap.set(ch.id, { sourceId: src.id, sourceName: src.name });
          break;
        }
      }
      if (found) withEpg++;
      else withoutEpg++;
    }

    const pct = allChannels.length > 0 ? Math.round((withEpg / allChannels.length) * 100) : 0;
    return {
      channelsWithEpg: withEpg,
      channelsWithoutEpg: withoutEpg,
      coveragePct: pct,
      epgSourceMap: sourceMap,
    };
  }, [sources]);

  /* ─── Channels needing attention ─── */
  const attentionChannels = useMemo(() => {
    const loadedSources = sources.filter((s) => s.status === "loaded");
    if (loadedSources.length === 0) return [];

    return mockMasterChannels.filter((ch) => {
      const tvgId = ch.tvgId || ch.id;
      return !loadedSources.some((src) =>
        src.channels?.some((ec) => ec.tvgId === tvgId)
      );
    });
  }, [sources]);

  /* ─── Active EPG sources summary ─── */
  const loadedSources = sources.filter((s) => s.status === "loaded");
  const hasEpgData = loadedSources.length > 0;

  const totalPlaylistChannels = mockMasterChannels.length;

  return (
    <main className="dash">
      {/* ─── Top bar ─── */}
      <header className="dash__top">
        <div className="dash__top-left">
          <span className="dash__logo">easyepg</span>
          <span className="dash__logo-dot" />
        </div>
        <div className="dash__top-right">
          <Link href="/playlist" className="dash__pill dash__pill--playlist">
            📺 Playlist
          </Link>
          <Link href="/" className="dash__pill dash__pill--ghost">
            Home
          </Link>
        </div>
      </header>

      {/* ─── Summary bar ─── */}
      <div className="dash__summary">
        <div className="dash__summary-item">
          <span className="dash__summary-num">{totalPlaylistChannels}</span>
          <span className="dash__summary-label">Channels</span>
        </div>
        <div className="dash__summary-divider" />
        <div className="dash__summary-item">
          <span className="dash__summary-num dash__summary-num--green">{coveragePct}%</span>
          <span className="dash__summary-label">EPG coverage</span>
        </div>
        <div className="dash__summary-divider" />
        <div className="dash__summary-item">
          <span className={`dash__summary-num ${channelsWithoutEpg > 0 ? 'dash__summary-num--warn' : 'dash__summary-num--green'}`}>
            {channelsWithoutEpg}
          </span>
          <span className="dash__summary-label">Need EPG</span>
        </div>
        <div className="dash__summary-divider" />
        <div className="dash__summary-item">
          <span className="dash__summary-num">{loadedSources.length}</span>
          <span className="dash__summary-label">EPG sources</span>
        </div>
      </div>

      {/* ─── Sections ─── */}

      {/* 1. EPG Coverage bar */}
      <div className="dash__section">
        <h2 className="dash__section-title">Coverage</h2>
        <div className="dash__card">
          <div className="dash__bar">
            <div className="dash__bar-fill" style={{ width: `${coveragePct}%` }} />
          </div>
          <div className="dash__bar-labels">
            <span className="dash__bar-label">
              <span className="dash__dot dash__dot--green" />
              {channelsWithEpg} channels with EPG
            </span>
            <span className="dash__bar-label">
              <span className="dash__dot dash__dot--red" />
              {channelsWithoutEpg} channels missing EPG
            </span>
          </div>
        </div>
      </div>

      {/* 2. Channels needing attention */}
      <div className="dash__section">
        <div className="dash__section-header">
          <h2 className="dash__section-title">
            {!hasEpgData ? '⚠️ No EPG sources configured' :
             attentionChannels.length > 0 ? `⚠️ ${attentionChannels.length} need attention` : '✅ All good'}
          </h2>
          {hasEpgData && attentionChannels.length > 0 && (
            <Link href="/playlist" className="dash__pill dash__pill--primary">
              Fix in Playlist
            </Link>
          )}
        </div>
        {!hasEpgData ? (
          <div className="dash__card dash__card--centered">
            <p className="dash__empty-text">Add an XMLTV EPG source first.</p>
            <p className="dash__empty-hint">EPG data will show which channels need attention.</p>
          </div>
        ) : attentionChannels.length > 0 ? (
          <div className="dash__card">
            <p className="dash__card-sub">
              These channels in your master playlist don&apos;t have EPG data yet.
            </p>
            <div className="dash__channel-list">
              {attentionChannels.slice(0, 10).map((ch) => (
                <div key={ch.id} className="dash__channel-row">
                  <div className="dash__channel-info">
                    <span className="dash__channel-name">{ch.name}</span>
                    <span className="dash__channel-cat">{ch.groupTitle}</span>
                  </div>
                  <span className="dash__channel-status dash__channel-status--missing">
                    No EPG
                  </span>
                </div>
              ))}
              {attentionChannels.length > 10 && (
                <p className="dash__more-text">+{attentionChannels.length - 10} more</p>
              )}
            </div>
          </div>
        ) : (
          <div className="dash__card dash__card--centered">
            <p className="dash__ok-text">Every channel has EPG data assigned.</p>
          </div>
        )}
      </div>

      {/* 3. Active EPG Sources */}
      <div className="dash__section">
        <h2 className="dash__section-title">
          📡 EPG Sources
          {loadedSources.length === 0 && <span className="dash__badge-warn">No sources loaded</span>}
        </h2>

        {loadedSources.length > 0 ? (
          <div className="dash__sources">
            {loadedSources.map((src, idx) => {
              const color = EPG_COLORS[idx % EPG_COLORS.length];
              const matchedChs = mockMasterChannels.filter((ch) =>
                src.channels?.some((ec) => ec.tvgId === (ch.tvgId || ch.id))
              );
              return (
                <div key={src.id} className="dash__card" style={{ borderLeftColor: color, borderLeftWidth: 3, borderLeftStyle: 'solid' }}>
                  <div className="dash__source-head">
                    <div className="dash__source-title-row">
                      <span className="dash__src-dot" style={{ background: color }} />
                      <div>
                        <h3 className="dash__source-name">{src.name}</h3>
                        <p className="dash__source-meta">
                          {matchedChs.length} channels matched · {src.entryCount} EPG entries
                        </p>
                      </div>
                    </div>
                    <span className="dash__status-badge dash__status-badge--active">
                      Active
                    </span>
                  </div>
                  {matchedChs.length > 0 && (
                    <div className="dash__matched-chips">
                      {matchedChs.slice(0, 8).map((ch) => (
                        <span key={ch.id} className="dash__chip" title={`EPG: ${src.name}`}>
                          <span className="dash__chip-dot" style={{ background: color }} />
                          {ch.name}
                        </span>
                      ))}
                      {matchedChs.length > 8 && (
                        <span className="dash__chip-more">+{matchedChs.length - 8}</span>
                      )}
                    </div>
                  )}
                  {matchedChs.length === 0 && (
                    <p className="dash__no-match">No playlist channels matched to this source.</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dash__card dash__card--centered">
            <p className="dash__empty-text">Add an XMLTV EPG source to get started.</p>
            <p className="dash__empty-hint">Go to Settings to configure your first EPG source.</p>
          </div>
        )}
      </div>

      {/* 4. Quick actions */}
      <div className="dash__section">
        <h2 className="dash__section-title">Quick Actions</h2>
        <div className="dash__actions">
          <Link href="/playlist" className="dash__action-card">
            <span className="dash__action-icon">📺</span>
            <span className="dash__action-label">Edit Playlist</span>
          </Link>
          <a href="/settings" className="dash__action-card">
            <span className="dash__action-icon">📡</span>
            <span className="dash__action-label">EPG Settings</span>
          </a>
          <a href="/settings" className="dash__action-card">
            <span className="dash__action-icon">🌐</span>
            <span className="dash__action-label">Domain Setup</span>
          </a>
          <button className="dash__action-card">
            <span className="dash__action-icon">🔗</span>
            <span className="dash__action-label">Copy Link</span>
          </button>
        </div>
      </div>

      {/* ─── Toast ─── */}
      {toast && (
        <div className="dash__toast" role="alert">{toast}</div>
      )}

      {/* ─── Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dash {
          background: #0C0C0D;
          min-height: 100vh;
          color: #E4E4E7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px 24px 100px;
        }

        /* ─── Top bar ─── */
        .dash__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .dash__top-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dash__logo {
          font-size: 20px;
          font-weight: 700;
          color: #D2FF00;
          letter-spacing: -0.3px;
        }
        .dash__logo-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #D2FF00;
          animation: dash-pulse 2s ease-in-out infinite;
        }
        .dash__top-right {
          display: flex;
          gap: 6px;
        }
        .dash__pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 150ms ease;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          line-height: 1;
        }
        .dash__pill--primary { background: #D2FF00; color: #0C0C0D; }
        .dash__pill--primary:hover { background: #BCE600; }
        .dash__pill--playlist { background: rgba(210,255,0,0.1); color: #D2FF00; border: 1px solid rgba(210,255,0,0.2); }
        .dash__pill--playlist:hover { background: rgba(210,255,0,0.18); }
        .dash__pill--ghost { background: transparent; color: rgba(255,255,255,0.4); }
        .dash__pill--ghost:hover { color: rgba(255,255,255,0.7); }

        /* ─── Summary bar ─── */
        .dash__summary {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 14px 8px;
          margin-bottom: 16px;
        }
        .dash__summary-item {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dash__summary-num {
          font-size: 20px;
          font-weight: 700;
          color: #E4E4E7;
        }
        .dash__summary-num--green { color: #22C55E; }
        .dash__summary-num--warn { color: #F59E0B; }
        .dash__summary-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-weight: 500;
        }
        .dash__summary-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        /* ─── Section ─── */
        .dash__section { margin-bottom: 20px; max-width: 960px; }
        .dash__section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .dash__section-title {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dash__badge-warn {
          font-size: 11px;
          font-weight: 500;
          background: rgba(245,158,11,0.1);
          color: #F59E0B;
          padding: 2px 10px;
          border-radius: 20px;
        }

        /* ─── Card ─── */
        .dash__card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
        }
        .dash__card--centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 20px;
        }
        .dash__card-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin: 0 0 14px;
        }

        /* ─── Coverage bar ─── */
        .dash__bar {
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          margin-bottom: 10px;
        }
        .dash__bar-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #22C55E, #D2FF00);
          transition: width 400ms ease;
        }
        .dash__bar-labels {
          display: flex;
          justify-content: space-between;
        }
        .dash__bar-label {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dash__dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .dash__dot--green { background: #22C55E; }
        .dash__dot--red { background: #EF4444; }

        /* ─── Channel list (attention) ─── */
        .dash__channel-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dash__channel-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          transition: background 150ms ease;
        }
        .dash__channel-row:hover { background: rgba(255,255,255,0.04); }
        .dash__channel-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .dash__channel-name {
          font-size: 14px;
          font-weight: 500;
          color: #E4E4E7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dash__channel-cat {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
        }
        .dash__channel-status {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .dash__channel-status--missing {
          background: rgba(239,68,68,0.1);
          color: #EF4444;
        }
        .dash__more-text {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          text-align: center;
          padding: 8px 0 0;
          margin: 0;
        }
        .dash__ok-text {
          font-size: 14px;
          color: #22C55E;
          margin: 0;
          font-weight: 500;
        }
        .dash__empty-text {
          font-size: 15px;
          color: rgba(255,255,255,0.4);
          margin: 0 0 4px;
        }
        .dash__empty-hint {
          font-size: 13px;
          color: rgba(255,255,255,0.2);
          margin: 0;
        }

        /* ─── EPG Sources ─── */
        .dash__sources { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 10px; }
        .dash__source-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .dash__source-title-row { display: flex; align-items: center; gap: 10px; }
        .dash__src-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 6px rgba(255,255,255,0.1); }
        .dash__chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; display: inline-block; vertical-align: middle; margin-right: 4px; }
        .dash__source-name {
          font-size: 16px;
          font-weight: 600;
          color: #E4E4E7;
          margin: 0;
        }
        .dash__source-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin: 2px 0 0;
        }
        .dash__status-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 12px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .dash__status-badge--active { background: rgba(34,197,94,0.1); color: #22C55E; }
        .dash__matched-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .dash__chip {
          font-size: 11px;
          background: rgba(255,255,255,0.04);
          padding: 3px 10px;
          border-radius: 20px;
          color: rgba(255,255,255,0.45);
        }
        .dash__chip-more {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          padding: 3px 6px;
        }
        .dash__no-match {
          font-size: 13px;
          color: rgba(255,255,255,0.2);
          margin: 0;
        }

        /* ─── Quick actions ─── */
        .dash__actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px;
        }
        .dash__action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 18px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          text-decoration: none;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .dash__action-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(210,255,0,0.15);
        }
        .dash__action-icon { font-size: 24px; line-height: 1; }
        .dash__action-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
        }

        /* ─── Toast ─── */
        .dash__toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #D2FF00;
          color: #0C0C0D;
          font-weight: 600;
          font-size: 14px;
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(210,255,0,0.2);
          z-index: 100;
          animation: dash-slide 250ms ease;
        }
        @keyframes dash-slide {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes dash-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      ` }} />
    </main>
  );
}
