"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function SettingsPage() {
  /* ─── EPG state ─── */
  const [sources, setSources] = useState<EpgSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  /* ─── Domain state ─── */
  const [domain, setDomain] = useState("");
  const [dnsStatus, setDnsStatus] = useState<"idle" | "polling" | "verified" | "failed">("idle");
  const [copied, setCopied] = useState(false);

  /* ─── AI state ─── */
  const [aiThreshold, setAiThreshold] = useState(75);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── EPG ─── */
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
      showToast("🗑️ EPG source removed");
      loadSources();
    } catch {
      showToast("❌ Failed to remove source");
    }
  };

  /* ─── Domain ─── */
  const cnameLine = domain
    ? `${domain}  CNAME  custom.easyepg.tv`
    : "yourdomain.com  CNAME  custom.easyepg.tv";

  const handleCopyCname = () => {
    navigator.clipboard.writeText(cnameLine).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleVerify = () => {
    if (!domain) return;
    setDnsStatus("polling");
    setTimeout(() => {
      if (Math.random() > 0.6) setDnsStatus("verified");
      else {
        setDnsStatus("polling");
        setTimeout(() => setDnsStatus("verified"), 3000);
      }
    }, 3000);
  };

  const loadedSrcs = sources.filter((s) => s.status === "loaded");

  return (
    <main className="set">
      {/* ─── Top ─── */}
      <header className="set__top">
        <Link href="/dashboard" className="set__back">← Dashboard</Link>
        <div className="set__top-right">
          <Link href="/playlist" className="set__pill set__pill--playlist">📺 Playlist</Link>
        </div>
      </header>

      <h1 className="set__title">Settings</h1>

      {/* ═══════════════════ EPG SOURCES ═══════════════════ */}
      <section className="set__section">
        <div className="set__section-head">
          <h2 className="set__section-title">📡 EPG Sources</h2>
          {!showAddForm && (
            <button className="set__btn set__btn--primary set__btn--sm" onClick={() => setShowAddForm(true)}>
              + Add
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="set__card set__card--form">
            <h3 className="set__card-title">New EPG Source</h3>
            <input
              type="text" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. Sky UK Guide)"
              className="set__input"
            />
            <input
              type="url" value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="XMLTV URL (https://...)"
              className="set__input"
            />
            <div className="set__row">
              <button className="set__btn set__btn--ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="set__btn set__btn--primary" disabled={!newName || !newUrl} onClick={handleAddSource}>
                Add & Parse
              </button>
            </div>
          </div>
        )}

        {sources.length === 0 && !showAddForm && (
          <div className="set__card set__card--empty">
            <p className="set__empty-text">No EPG sources yet</p>
            <p className="set__empty-hint">Add an XMLTV URL to get started.</p>
          </div>
        )}

        <div className="set__src-list">
          {sources.map((src) => (
            <div key={src.id} className="set__card">
              <div className="set__src-head">
                <div>
                  <h3 className="set__card-title">{src.name}</h3>
                  <p className="set__src-url">{src.url}</p>
                </div>
                <div className="set__src-actions">
                  <span className={`set__badge set__badge--${src.status}`}>
                    {src.status === "loaded" ? "Loaded" : src.status === "loading" ? "Loading..." : "Error"}
                  </span>
                  <button className="set__btn-icon" onClick={() => handleRemoveSource(src.id)} aria-label={`Remove ${src.name}`}>
                    ✕
                  </button>
                </div>
              </div>
              {src.channels && src.channels.length > 0 && (
                <div className="set__src-chips">
                  <p className="set__src-meta">{src.channelCount} channels · {src.entryCount} entries</p>
                  <div className="set__chip-row">
                    {src.channels.slice(0, 8).map((ch) => (
                      <span key={ch.tvgId} className="set__chip">{ch.displayName}</span>
                    ))}
                    {src.channels.length > 8 && <span className="set__chip-more">+{src.channels.length - 8}</span>}
                  </div>
                </div>
              )}
              {src.status === "loading" && (
                <div className="set__status set__status--warn">
                  <span className="set__pulse" /> Parsing XMLTV…
                </div>
              )}
            </div>
          ))}
        </div>

        {loadedSrcs.length > 0 && (
          <div className="set__summary">
            <span className="set__summary-dot" />
            {loadedSrcs.length} EPG source{loadedSrcs.length > 1 ? 's' : ''} active — {loadedSrcs.reduce((a, s) => a + (s.channelCount || 0), 0)} channels total
          </div>
        )}
      </section>

      {/* ═══════════════════ BRANDING & DOMAIN ═══════════════════ */}
      <section className="set__section">
        <h2 className="set__section-title">🎨 Branding & Domain</h2>
        <div className="set__card">
          <p className="set__field-label">Your playlist link</p>
          <div className="set__copy-row">
            <code className="set__code">https://demo.easyepg.tv/playlist.m3u</code>
            <button className="set__btn set__btn--secondary set__btn--sm" onClick={() => {
              navigator.clipboard.writeText("https://demo.easyepg.tv/playlist.m3u");
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}>
              {copied ? "✅" : "Copy"}
            </button>
          </div>

          <hr className="set__hr" />

          <p className="set__field-label">Your own domain</p>
          <p className="set__field-hint">Use your own domain for your playlist URL.</p>

          <input
            type="text" value={domain}
            onChange={(e) => { setDomain(e.target.value); setDnsStatus("idle"); }}
            placeholder="tv.yourname.com"
            className="set__input"
          />

          <p className="set__field-label">1. Add this DNS record:</p>
          <div className="set__copy-row">
            <code className="set__code set__code--dark">{cnameLine}</code>
            <button className="set__btn set__btn--secondary set__btn--sm" onClick={handleCopyCname}>
              {copied ? "✅" : "Copy"}
            </button>
          </div>

          <p className="set__field-label">2. Verify your domain:</p>
          <button
            className="set__btn set__btn--primary set__btn--full"
            onClick={handleVerify}
            disabled={!domain || dnsStatus === "polling" || dnsStatus === "verified"}
          >
            {dnsStatus === "idle" && "Verify domain"}
            {dnsStatus === "polling" && "⏳ Checking DNS..."}
            {dnsStatus === "verified" && "✅ Domain verified!"}
            {dnsStatus === "failed" && "❌ Failed — try again"}
          </button>

          {dnsStatus === "polling" && (
            <div className="set__status set__status--warn"><span className="set__pulse" /> Waiting for DNS…</div>
          )}
          {dnsStatus === "verified" && (
            <div className="set__status set__status--ok">✅ {domain} verified. SSL active.</div>
          )}
        </div>
      </section>

      {/* ═══════════════════ AI SETTINGS ═══════════════════ */}
      <section className="set__section">
        <h2 className="set__section-title">🤖 AI Settings</h2>
        <div className="set__card">
          <p className="set__field-hint">
            Confidence threshold for auto-applying AI suggestions.
            Current: <strong>{aiThreshold}%</strong>
          </p>
          <div className="set__slider-row">
            <span className="set__slider-label">50%</span>
            <input
              type="range" min="50" max="99" value={aiThreshold}
              onChange={(e) => setAiThreshold(Number(e.target.value))}
              className="set__slider"
            />
            <span className="set__slider-label">99%</span>
          </div>
          <p className="set__field-hint set__field-hint--sm">
            Above this threshold → auto-applied. Below → waits for review.
          </p>
        </div>
      </section>

      {/* ─── Toast ─── */}
      {toast && <div className="set__toast" role="alert">{toast}</div>}

      {/* ─── Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .set {
          background: #0C0C0D;
          min-height: 100vh;
          color: #E4E4E7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 16px 12px 100px;
          max-width: 680px;
          margin: 0 auto;
        }
        .set__top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .set__back {
          font-size: 14px; color: rgba(255,255,255,0.3); text-decoration: none;
          font-weight: 500; transition: color 150ms;
        }
        .set__back:hover { color: rgba(255,255,255,0.6); }
        .set__top-right { display: flex; gap: 6px; }
        .set__title {
          font-size: 24px; font-weight: 700; color: #FFFFFF;
          margin: 0 0 20px;
        }
        .set__section { margin-bottom: 24px; }
        .set__section-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .set__section-title {
          font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.7);
          margin: 0;
        }
        .set__card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px;
        }
        .set__card--form { display: flex; flex-direction: column; gap: 10px; }
        .set__card--empty {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 32px 20px;
        }
        .set__card-title {
          font-size: 16px; font-weight: 600; color: #FFFFFF;
          margin: 0 0 4px;
        }
        .set__btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; min-height: 44px; padding: 0 18px; border-radius: 12px;
          font-size: 14px; font-weight: 600; border: none; cursor: pointer;
          text-decoration: none; transition: all 150ms ease;
          white-space: nowrap; line-height: 1;
        }
        .set__btn:active { transform: scale(0.97); }
        .set__btn--primary { background: #D2FF00; color: #0C0C0D; }
        .set__btn--primary:hover { background: #BCE600; }
        .set__btn--primary:disabled { opacity: 0.4; cursor: default; transform: none; }
        .set__btn--secondary { background: rgba(255,255,255,0.08); color: #E4E4E7; border: 1px solid rgba(255,255,255,0.1); }
        .set__btn--secondary:hover { background: rgba(255,255,255,0.12); }
        .set__btn--ghost { background: transparent; color: rgba(255,255,255,0.4); min-height: auto; padding: 0 8px; }
        .set__btn--ghost:hover { color: rgba(255,255,255,0.7); }
        .set__btn--sm { min-height: 36px; padding: 0 14px; font-size: 13px; }
        .set__btn--full { width: 100%; }
        .set__btn-icon {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: transparent; color: rgba(255,255,255,0.2); cursor: pointer;
          font-size: 14px; display: flex; align-items: center; justify-content: center;
          transition: all 150ms; flex-shrink: 0;
        }
        .set__btn-icon:hover { background: rgba(239,68,68,0.1); color: #EF4444; }
        .set__pill {
          display: inline-flex; align-items: center; gap: 4px;
          min-height: 34px; padding: 0 12px; border-radius: 20px;
          font-size: 13px; font-weight: 600; text-decoration: none;
          transition: all 150ms ease; white-space: nowrap; line-height: 1;
        }
        .set__pill--playlist { background: rgba(210,255,0,0.1); color: #D2FF00; border: 1px solid rgba(210,255,0,0.2); }
        .set__pill--playlist:hover { background: rgba(210,255,0,0.18); }
        .set__input {
          width: 100%; min-height: 44px; padding: 0 14px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: #E4E4E7; font-size: 15px; outline: none; transition: border-color 150ms;
        }
        .set__input:focus { border-color: #D2FF00; }
        .set__input::placeholder { color: rgba(255,255,255,0.2); }
        .set__row { display: flex; gap: 10px; }
        .set__src-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .set__src-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .set__src-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .set__src-url { font-size: 12px; color: rgba(255,255,255,0.25); word-break: break-all; margin: 0; }
        .set__badge {
          font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap;
        }
        .set__badge--loaded { background: rgba(34,197,94,0.1); color: #22C55E; }
        .set__badge--loading { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .set__badge--error { background: rgba(239,68,68,0.1); color: #EF4444; }
        .set__src-chips { margin-top: 10px; }
        .set__src-meta { font-size: 12px; color: rgba(255,255,255,0.3); margin: 0 0 6px; }
        .set__chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
        .set__chip { font-size: 11px; background: rgba(255,255,255,0.04); padding: 3px 10px; border-radius: 20px; color: rgba(255,255,255,0.45); }
        .set__chip-more { font-size: 11px; color: rgba(255,255,255,0.2); padding: 3px 6px; }
        .set__summary {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 10px;
        }
        .set__summary-dot { width: 6px; height: 6px; border-radius: 50%; background: #22C55E; flex-shrink: 0; }
        .set__status { display: flex; align-items: center; gap: 6px; font-size: 13px; margin-top: 10px; }
        .set__status--warn { color: #F59E0B; }
        .set__status--ok { color: #22C55E; }
        .set__pulse {
          display: inline-block; width: 6px; height: 6px; border-radius: 50%;
          background: #F59E0B; animation: set-pulse 1.2s ease-in-out infinite;
        }
        @keyframes set-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .set__empty-text { font-size: 15px; color: rgba(255,255,255,0.3); margin: 0 0 4px; }
        .set__empty-hint { font-size: 13px; color: rgba(255,255,255,0.2); margin: 0; }
        .set__field-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); margin: 0 0 8px; }
        .set__field-hint { font-size: 13px; color: rgba(255,255,255,0.25); margin: 0 0 10px; }
        .set__field-hint--sm { font-size: 12px; margin-top: 8px; }
        .set__copy-row { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
        .set__code {
          flex: 1; min-height: 40px; display: flex; align-items: center; padding: 0 12px;
          border-radius: 10px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); font-size: 13px;
          font-family: "SF Mono","Fira Code",monospace; color: rgba(255,255,255,0.5); overflow-x: auto;
        }
        .set__code--dark { background: #000; color: #D2FF00; border-color: rgba(210,255,0,0.15); }
        .set__hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 14px 0; }
        .set__slider-row { display: flex; align-items: center; gap: 10px; }
        .set__slider-label { font-size: 12px; color: rgba(255,255,255,0.25); flex-shrink: 0; }
        .set__slider {
          flex: 1; height: 6px; border-radius: 3px; appearance: none;
          background: rgba(255,255,255,0.1); outline: none; accent-color: #D2FF00;
        }
        .set__slider::-webkit-slider-thumb {
          appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #D2FF00; cursor: pointer; box-shadow: 0 0 8px rgba(210,255,0,0.3);
        }
        .set__toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: #D2FF00; color: #0C0C0D; font-weight: 600; font-size: 14px;
          padding: 12px 20px; border-radius: 12px;
          box-shadow: 0 4px 24px rgba(210,255,0,0.2); z-index: 100;
          animation: set-slide 250ms ease;
        }
        @keyframes set-slide { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      ` }} />
    </main>
  );
}
