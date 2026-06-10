"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EpgMapperModal from "@/components/EpgMapperModal";
import { mockMasterChannels } from "@/lib/mock-data";

interface EpgSource {
  id: string;
  name: string;
  url: string;
  status: "loading" | "loaded" | "error";
  channelCount: number;
  entryCount: number;
  addedAt: string;
  channels?: Array<{ tvgId: string; displayName: string }>;
}

export default function EpgPage() {
  const [sources, setSources] = useState<EpgSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [mapperOpen, setMapperOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadSources = async () => {
    try {
      const res = await fetch("/api/epg/sources");
      const data = await res.json();
      setSources(data.sources || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadSources();
    const interval = setInterval(loadSources, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSource = async () => {
    if (!newName || !newUrl) return;
    try {
      await fetch("/api/epg/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, url: newUrl }),
      });
      setNewName("");
      setNewUrl("");
      setShowAddForm(false);
      showToast("✅ EPG source added");
      setTimeout(loadSources, 500);
    } catch {
      showToast("❌ Failed to add EPG source");
    }
  };

  const handleRemoveSource = async (id: string) => {
    try {
      await fetch(`/api/epg/sources?id=${id}`, { method: "DELETE" });
      showToast("🗑️ Source removed");
      loadSources();
    } catch {
      showToast("❌ Failed to remove source");
    }
  };

  const openMapper = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setMapperOpen(true);
  };

  const loadedSrcs = sources.filter((s) => s.status === "loaded");

  return (
    <main className="epg">
      {/* ─── Top ─── */}
      <header className="epg__top">
        <Link href="/dashboard" className="epg__back">← Dashboard</Link>
        <div className="epg__top-right">
          <Link href="/playlist" className="epg__pill epg__pill--playlist">📺 Playlist</Link>
        </div>
      </header>

      <div className="epg__head">
        <h1 className="epg__title">EPG Manager</h1>
        {!showAddForm && (
          <button className="epg__btn epg__btn--primary epg__btn--sm" onClick={() => setShowAddForm(true)}>
            + Add Source
          </button>
        )}
      </div>

      {/* ─── Add form ─── */}
      {showAddForm && (
        <div className="epg__card epg__card--form">
          <h2 className="epg__card-title">New EPG Source</h2>
          <input
            type="text" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (e.g. Sky UK Guide)"
            className="epg__input"
          />
          <input
            type="url" value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="XMLTV URL (https://...)"
            className="epg__input"
          />
          <div className="epg__row">
            <button className="epg__btn epg__btn--ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button className="epg__btn epg__btn--primary" disabled={!newName || !newUrl} onClick={handleAddSource}>
              Add & Parse
            </button>
          </div>
        </div>
      )}

      {/* ─── Source list ─── */}
      {sources.length === 0 && !showAddForm && (
        <div className="epg__empty">
          <p className="epg__empty-title">No EPG sources yet</p>
          <p className="epg__empty-hint">Add an XMLTV URL to get started.</p>
        </div>
      )}

      <div className="epg__list">
        {sources.map((src) => (
          <div key={src.id} className="epg__card">
            <div className="epg__src-head">
              <div>
                <h3 className="epg__card-title">{src.name}</h3>
                <p className="epg__src-url">{src.url}</p>
              </div>
              <div className="epg__src-actions">
                <span className={`epg__badge epg__badge--${src.status}`}>
                  {src.status === "loaded" ? "Loaded" : src.status === "loading" ? "Loading..." : "Error"}
                </span>
                <button className="epg__btn-icon" onClick={() => handleRemoveSource(src.id)} aria-label={`Remove ${src.name}`}>
                  ✕
                </button>
              </div>
            </div>

            {src.channels && src.channels.length > 0 && (
              <div className="epg__src-chips">
                <p className="epg__src-meta">{src.channelCount} channels · {src.entryCount} entries</p>
                <div className="epg__chip-row">
                  {src.channels.slice(0, 10).map((ch) => (
                    <span key={ch.tvgId} className="epg__chip">{ch.displayName}</span>
                  ))}
                  {src.channels.length > 10 && <span className="epg__chip-more">+{src.channels.length - 10}</span>}
                </div>
              </div>
            )}

            {src.status === "loading" && (
              <div className="epg__status epg__status--warn">
                <span className="epg__pulse" /> Parsing XMLTV…
              </div>
            )}

            {src.status === "loaded" && (
              <div className="epg__src-actions-bar">
                <button className="epg__btn epg__btn--primary epg__btn--sm" onClick={() => openMapper(src.id)}>
                  Match Channels
                </button>
                <button className="epg__btn epg__btn--secondary epg__btn--sm" onClick={() => showToast(`📺 ${src.name} preview loaded`)}>
                  Preview
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Summary ─── */}
      {loadedSrcs.length > 0 && (
        <div className="epg__summary">
          <span className="epg__summary-dot" />
          {loadedSrcs.length} active · {loadedSrcs.reduce((a, s) => a + (s.channelCount || 0), 0)} channels
        </div>
      )}

      {/* ─── Mapper modal ─── */}
      <EpgMapperModal
        open={mapperOpen}
        onClose={() => setMapperOpen(false)}
        sourceId={selectedSourceId || ""}
        playlistChannels={mockMasterChannels}
        onToast={showToast}
      />

      {/* ─── Toast ─── */}
      {toast && <div className="epg__toast" role="alert">{toast}</div>}

      {/* ─── Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .epg {
          background: #0C0C0D;
          min-height: 100vh;
          color: #E4E4E7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 16px 12px 100px;
          max-width: 680px;
          margin: 0 auto;
        }
        .epg__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .epg__back { font-size: 14px; color: rgba(255,255,255,0.3); text-decoration: none; font-weight: 500; transition: color 150ms; }
        .epg__back:hover { color: rgba(255,255,255,0.6); }
        .epg__top-right { display: flex; gap: 6px; }
        .epg__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .epg__title { font-size: 24px; font-weight: 700; color: #FFFFFF; margin: 0; }
        .epg__card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; }
        .epg__card--form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .epg__card-title { font-size: 16px; font-weight: 600; color: #FFFFFF; margin: 0 0 4px; }
        .epg__btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          min-height: 44px; padding: 0 18px; border-radius: 12px; font-size: 14px;
          font-weight: 600; border: none; cursor: pointer; text-decoration: none;
          transition: all 150ms ease; white-space: nowrap; line-height: 1;
        }
        .epg__btn:active { transform: scale(0.97); }
        .epg__btn--primary { background: #D2FF00; color: #0C0C0D; }
        .epg__btn--primary:hover { background: #BCE600; }
        .epg__btn--primary:disabled { opacity: 0.4; cursor: default; transform: none; }
        .epg__btn--secondary { background: rgba(255,255,255,0.08); color: #E4E4E7; border: 1px solid rgba(255,255,255,0.1); }
        .epg__btn--secondary:hover { background: rgba(255,255,255,0.12); }
        .epg__btn--ghost { background: transparent; color: rgba(255,255,255,0.4); min-height: auto; padding: 0 8px; }
        .epg__btn--ghost:hover { color: rgba(255,255,255,0.7); }
        .epg__btn--sm { min-height: 36px; padding: 0 14px; font-size: 13px; }
        .epg__btn-icon {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: transparent; color: rgba(255,255,255,0.2); cursor: pointer;
          font-size: 14px; display: flex; align-items: center; justify-content: center;
          transition: all 150ms; flex-shrink: 0;
        }
        .epg__btn-icon:hover { background: rgba(239,68,68,0.1); color: #EF4444; }
        .epg__pill {
          display: inline-flex; align-items: center; gap: 4px; min-height: 34px;
          padding: 0 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: all 150ms ease; white-space: nowrap; line-height: 1;
        }
        .epg__pill--playlist { background: rgba(210,255,0,0.1); color: #D2FF00; border: 1px solid rgba(210,255,0,0.2); }
        .epg__pill--playlist:hover { background: rgba(210,255,0,0.18); }
        .epg__input {
          width: 100%; min-height: 44px; padding: 0 14px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: #E4E4E7; font-size: 15px; outline: none; transition: border-color 150ms;
        }
        .epg__input:focus { border-color: #D2FF00; }
        .epg__input::placeholder { color: rgba(255,255,255,0.2); }
        .epg__row { display: flex; gap: 10px; }
        .epg__list { display: flex; flex-direction: column; gap: 10px; }
        .epg__src-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .epg__src-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .epg__src-url { font-size: 12px; color: rgba(255,255,255,0.25); word-break: break-all; margin: 0; }
        .epg__badge {
          font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap;
        }
        .epg__badge--loaded { background: rgba(34,197,94,0.1); color: #22C55E; }
        .epg__badge--loading { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .epg__badge--error { background: rgba(239,68,68,0.1); color: #EF4444; }
        .epg__src-chips { margin-top: 10px; }
        .epg__src-meta { font-size: 12px; color: rgba(255,255,255,0.3); margin: 0 0 6px; }
        .epg__chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
        .epg__chip { font-size: 11px; background: rgba(255,255,255,0.04); padding: 3px 10px; border-radius: 20px; color: rgba(255,255,255,0.45); }
        .epg__chip-more { font-size: 11px; color: rgba(255,255,255,0.2); padding: 3px 6px; }
        .epg__src-actions-bar { display: flex; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }
        .epg__status { display: flex; align-items: center; gap: 6px; font-size: 13px; margin-top: 10px; }
        .epg__status--warn { color: #F59E0B; }
        .epg__pulse { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #F59E0B; animation: epg-pulse 1.2s ease-in-out infinite; }
        @keyframes epg-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .epg__summary { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 12px; }
        .epg__summary-dot { width: 6px; height: 6px; border-radius: 50%; background: #22C55E; flex-shrink: 0; }
        .epg__empty { text-align: center; padding: 48px 20px; }
        .epg__empty-title { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.3); margin: 0 0 4px; }
        .epg__empty-hint { font-size: 13px; color: rgba(255,255,255,0.2); margin: 0; }
        .epg__toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: #D2FF00; color: #0C0C0D; font-weight: 600; font-size: 14px;
          padding: 12px 20px; border-radius: 12px;
          box-shadow: 0 4px 24px rgba(210,255,0,0.2); z-index: 100;
          animation: epg-slide 250ms ease;
        }
        @keyframes epg-slide { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      ` }} />
    </main>
  );
}
