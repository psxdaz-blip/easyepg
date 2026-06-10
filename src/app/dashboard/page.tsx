"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Tab = "overview" | "epg" | "settings";

/* ─── EPG types ─── */
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

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [hasPlaylist] = useState(true);

  /* ─── EPG state ─── */
  const [sources, setSources] = useState<EpgSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  /* ─── Settings state ─── */
  const [domain, setDomain] = useState("");
  const [dnsStatus, setDnsStatus] = useState<"idle" | "polling" | "verified" | "failed">("idle");
  const [copied, setCopied] = useState(false);
  const [aiThreshold, setAiThreshold] = useState(75);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── EPG handlers ─── */
  const loadSources = async () => {
    try {
      const res = await fetch("/api/epg/sources");
      const data = await res.json();
      setSources(data.sources);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (tab === "epg") {
      loadSources();
      const interval = setInterval(loadSources, 3000);
      return () => clearInterval(interval);
    }
  }, [tab]);

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

  /* ─── Settings handlers ─── */
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
      if (Math.random() > 0.6) {
        setDnsStatus("verified");
      } else {
        setDnsStatus("polling");
        setTimeout(() => setDnsStatus("verified"), 3000);
      }
    }, 3000);
  };

  return (
    <main className="dash">
      {/* ─── Top bar ─── */}
      <header className="dash__header">
        <span className="dash__logo">easyepg</span>
        <div className="dash__header-right">
          <Link href="/playlist" className="dash__btn dash__btn--playlist">
            Playlist
          </Link>
          <Link href="/" className="dash__btn dash__btn--ghost">
            Home
          </Link>
        </div>
      </header>

      {/* ─── Tab bar ─── */}
      <div className="dash__tabs" role="tablist">
        {(["overview", "epg", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`dash__tab${tab === t ? " dash__tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "overview" && "📊 Overview"}
            {t === "epg" && "📡 EPG"}
            {t === "settings" && "⚙️ Settings"}
          </button>
        ))}
      </div>

      {/* ──────────────────────── OVERVIEW TAB ──────────────────────── */}
      {tab === "overview" && (
        <div className="dash__content">
          {/* Hero */}
          <div className="dash__hero">
            <h1 className="dash__hero-title">Welcome back</h1>
            <p className="dash__hero-sub">dazzy@email.com</p>
            <div className="dash__hero-actions">
              <Link href="/playlist" className="dash__btn dash__btn--primary">
                Edit My Playlist →
              </Link>
              <button className="dash__btn dash__btn--secondary">
                🔗 Copy playlist link
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="dash__stats">
            <div className="dash__stat">
              <span className="dash__stat-value">45</span>
              <span className="dash__stat-label">channels in playlist</span>
            </div>
            <div className="dash__stat">
              <span className="dash__stat-value">95%</span>
              <span className="dash__stat-label">EPG coverage</span>
            </div>
            <div className="dash__stat">
              <span className="dash__stat-value dash__stat-value--warn">⚡ 12</span>
              <span className="dash__stat-label">AI suggestions</span>
            </div>
            <div className="dash__stat">
              <span className="dash__stat-value dash__stat-value--muted">🌐</span>
              <span className="dash__stat-label">domain not set</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="dash__section-label">Quick Actions</div>
          <div className="dash__quick-grid">
            <button className="dash__quick-card" onClick={() => setTab("epg")}>
              <span className="dash__quick-icon">📡</span>
              <span className="dash__quick-title">EPG Sources</span>
              <span className="dash__quick-desc">Manage your XMLTV guides</span>
            </button>
            <button className="dash__quick-card" onClick={() => setTab("settings")}>
              <span className="dash__quick-icon">🌐</span>
              <span className="dash__quick-title">Custom Domain</span>
              <span className="dash__quick-desc">Set up your own URL</span>
            </button>
            <Link href="/playlist" className="dash__quick-card">
              <span className="dash__quick-icon">📺</span>
              <span className="dash__quick-title">Playlist</span>
              <span className="dash__quick-desc">Arrange your channels</span>
            </Link>
            <button className="dash__quick-card">
              <span className="dash__quick-icon">🤖</span>
              <span className="dash__quick-title">AI Suggestions</span>
              <span className="dash__quick-desc">Smart channel matching</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────── EPG TAB ──────────────────────── */}
      {tab === "epg" && (
        <div className="dash__content">
          <div className="dash__section-header">
            <h2 className="dash__section-title">📡 EPG Sources</h2>
            {!showAddForm && (
              <button className="dash__btn dash__btn--primary dash__btn--sm" onClick={() => setShowAddForm(true)}>
                + Add Source
              </button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="dash__card dash__card--form">
              <h3 className="dash__card-title">New EPG Source</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="EPG name (e.g. Sky UK Guide)"
                className="dash__input"
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="XMLTV URL (https://...)"
                className="dash__input"
              />
              <div className="dash__btn-row">
                <button className="dash__btn dash__btn--ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="dash__btn dash__btn--primary" disabled={!newName || !newUrl} onClick={handleAddSource}>
                  Add & Parse
                </button>
              </div>
            </div>
          )}

          {/* Source list */}
          {sources.length === 0 && !showAddForm && (
            <div className="dash__empty">
              <p className="dash__empty-title">No EPG sources yet</p>
              <p className="dash__empty-desc">Add an XMLTV URL to get started.</p>
            </div>
          )}

          <div className="dash__source-list">
            {sources.map((src) => (
              <div key={src.id} className="dash__card">
                <div className="dash__source-header">
                  <div>
                    <h3 className="dash__card-title">{src.name}</h3>
                    <p className="dash__source-url">{src.url}</p>
                  </div>
                  <span className={`dash__badge dash__badge--${src.status}`}>
                    {src.status === "loaded" ? "Loaded" : src.status === "loading" ? "Loading..." : "Error"}
                  </span>
                </div>

                {src.channels && src.channels.length > 0 && (
                  <div className="dash__source-channels">
                    <p className="dash__source-meta">{src.channelCount} channels · {src.entryCount} EPG entries</p>
                    <div className="dash__chip-row">
                      {src.channels.slice(0, 8).map((ch) => (
                        <span key={ch.tvgId} className="dash__chip">{ch.displayName}</span>
                      ))}
                      {src.channels.length > 8 && <span className="dash__chip-more">+{src.channels.length - 8} more</span>}
                    </div>
                  </div>
                )}

                {src.status === "loading" && (
                  <div className="dash__loading-line">
                    <span className="dash__pulse" /> Parsing XMLTV data...
                  </div>
                )}

                {src.status === "loaded" && (
                  <div className="dash__source-actions">
                    <button className="dash__btn dash__btn--primary dash__btn--sm">Match Channels</button>
                    <button className="dash__btn dash__btn--secondary dash__btn--sm">Preview</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────── SETTINGS TAB ──────────────────────── */}
      {tab === "settings" && (
        <div className="dash__content">
          {/* Branding & Domain */}
          <div className="dash__card">
            <h2 className="dash__card-title">🎨 Branding & Domain</h2>

            <p className="dash__field-label">Your playlist link</p>
            <div className="dash__copy-row">
              <code className="dash__code">https://demo.easyepg.tv/playlist.m3u</code>
              <button className="dash__btn dash__btn--secondary dash__btn--sm" onClick={() => {
                navigator.clipboard.writeText("https://demo.easyepg.tv/playlist.m3u");
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}>
                {copied ? "✅" : "Copy"}
              </button>
            </div>

            <hr className="dash__divider" />

            <p className="dash__field-label">Your own domain</p>
            <p className="dash__field-hint">Use your own domain name for your playlist URL.</p>

            <input
              type="text"
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setDnsStatus("idle"); }}
              placeholder="tv.yourname.com"
              className="dash__input"
            />

            <p className="dash__field-label">1. Add this DNS record:</p>
            <div className="dash__copy-row">
              <code className="dash__code dash__code--dark">{cnameLine}</code>
              <button className="dash__btn dash__btn--secondary dash__btn--sm" onClick={handleCopyCname}>
                {copied ? "✅" : "Copy"}
              </button>
            </div>

            <p className="dash__field-label">2. Verify your domain:</p>
            <button
              className="dash__btn dash__btn--primary dash__btn--full"
              onClick={handleVerify}
              disabled={!domain || dnsStatus === "polling" || dnsStatus === "verified"}
            >
              {dnsStatus === "idle" && "Verify domain"}
              {dnsStatus === "polling" && "⏳ Checking DNS..."}
              {dnsStatus === "verified" && "✅ Domain verified!"}
              {dnsStatus === "failed" && "❌ Verification failed — try again"}
            </button>

            {dnsStatus === "polling" && (
              <div className="dash__status-line dash__status-line--warn">
                <span className="dash__pulse" /> Waiting for DNS…
              </div>
            )}
            {dnsStatus === "verified" && (
              <div className="dash__status-line dash__status-line--ok">
                ✅ {domain} verified. SSL active.
              </div>
            )}
          </div>

          {/* AI Settings */}
          <div className="dash__card">
            <h2 className="dash__card-title">🤖 AI Settings</h2>
            <p className="dash__field-hint">
              Confidence threshold for auto-applying AI suggestions.
              Current: <strong>{aiThreshold}%</strong>
            </p>
            <div className="dash__slider-row">
              <span className="dash__slider-label">50%</span>
              <input
                type="range"
                min="50"
                max="99"
                value={aiThreshold}
                onChange={(e) => setAiThreshold(Number(e.target.value))}
                className="dash__slider"
              />
              <span className="dash__slider-label">99%</span>
            </div>
            <p className="dash__field-hint dash__field-hint--sm">
              Suggestions above this threshold are applied automatically.
              Below this, they wait for your review.
            </p>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div className="dash__toast" role="alert">
          {toast}
        </div>
      )}

      {/* ─── Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dash {
          background: #111112;
          min-height: 100vh;
          color: #E4E4E7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px 16px 80px;
          max-width: 720px;
          margin: 0 auto;
        }
        .dash__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .dash__logo {
          font-size: 22px;
          font-weight: 700;
          color: #D2FF00;
          letter-spacing: -0.3px;
        }
        .dash__header-right {
          display: flex;
          gap: 8px;
        }
        .dash__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 48px;
          padding: 0 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 150ms ease;
          white-space: nowrap;
          line-height: 1;
        }
        .dash__btn:active { transform: scale(0.97); }
        .dash__btn--primary { background: #D2FF00; color: #111112; }
        .dash__btn--primary:hover { background: #BCE600; }
        .dash__btn--primary:disabled { opacity: 0.4; cursor: default; transform: none; }
        .dash__btn--secondary { background: rgba(255,255,255,0.08); color: #E4E4E7; border: 1px solid rgba(255,255,255,0.1); }
        .dash__btn--secondary:hover { background: rgba(255,255,255,0.12); }
        .dash__btn--ghost { background: transparent; color: rgba(255,255,255,0.5); min-height: auto; padding: 0 8px; font-weight: 500; }
        .dash__btn--ghost:hover { color: #E4E4E7; }
        .dash__btn--playlist { background: rgba(210,255,0,0.1); color: #D2FF00; border: 1px solid rgba(210,255,0,0.2); }
        .dash__btn--playlist:hover { background: rgba(210,255,0,0.18); }
        .dash__btn--sm { min-height: 40px; padding: 0 14px; font-size: 14px; }
        .dash__btn--full { width: 100%; }
        .dash__tabs {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .dash__tab {
          flex: 1;
          min-height: 44px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.4);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 200ms ease;
        }
        .dash__tab--active { background: #1A1A1C; color: #D2FF00; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .dash__tab:hover:not(.dash__tab--active) { color: rgba(255,255,255,0.7); }
        .dash__content { display: flex; flex-direction: column; gap: 20px; }
        .dash__hero {
          background: linear-gradient(135deg, #1A1A1C 0%, #111112 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 28px 24px;
          text-align: center;
        }
        .dash__hero-title { font-size: 28px; font-weight: 700; color: #FFFFFF; margin: 0 0 4px; }
        .dash__hero-sub { font-size: 15px; color: rgba(255,255,255,0.35); margin: 0 0 24px; }
        .dash__hero-actions { display: flex; flex-direction: column; gap: 10px; }
        .dash__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dash__stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dash__stat-value { font-size: 28px; font-weight: 700; color: #D2FF00; }
        .dash__stat-value--warn { color: #F59E0B; }
        .dash__stat-value--muted { color: rgba(255,255,255,0.3); font-size: 24px; }
        .dash__stat-label { font-size: 13px; color: rgba(255,255,255,0.35); }
        .dash__section-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }
        .dash__quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dash__quick-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 150ms ease;
          text-decoration: none;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .dash__quick-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(210,255,0,0.2); }
        .dash__quick-icon { font-size: 28px; line-height: 1; }
        .dash__quick-title { font-size: 15px; font-weight: 600; color: #E4E4E7; }
        .dash__quick-desc { font-size: 12px; color: rgba(255,255,255,0.3); }
        .dash__card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
        }
        .dash__card--form { display: flex; flex-direction: column; gap: 12px; }
        .dash__card-title { font-size: 18px; font-weight: 600; color: #FFFFFF; margin: 0 0 12px; }
        .dash__section-header { display: flex; align-items: center; justify-content: space-between; }
        .dash__section-title { font-size: 18px; font-weight: 600; color: #FFFFFF; margin: 0; }
        .dash__input {
          width: 100%; min-height: 48px; padding: 0 16px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: #E4E4E7; font-size: 16px; outline: none; transition: border-color 150ms ease;
        }
        .dash__input:focus { border-color: #D2FF00; }
        .dash__input::placeholder { color: rgba(255,255,255,0.2); }
        .dash__copy-row { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
        .dash__code {
          flex: 1; min-height: 44px; display: flex; align-items: center; padding: 0 14px;
          border-radius: 10px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); font-size: 14px;
          font-family: "SF Mono", "Fira Code", monospace; color: rgba(255,255,255,0.6); overflow-x: auto;
        }
        .dash__code--dark { background: #000000; color: #D2FF00; border-color: rgba(210,255,0,0.15); }
        .dash__divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 16px 0; }
        .dash__field-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.6); margin: 0 0 8px; }
        .dash__field-hint { font-size: 14px; color: rgba(255,255,255,0.3); margin: 0 0 12px; }
        .dash__field-hint--sm { font-size: 13px; margin-top: 8px; }
        .dash__slider-row { display: flex; align-items: center; gap: 12px; }
        .dash__slider-label { font-size: 13px; color: rgba(255,255,255,0.3); flex-shrink: 0; }
        .dash__slider {
          flex: 1; height: 6px; border-radius: 3px; appearance: none; background: rgba(255,255,255,0.1);
          outline: none; accent-color: #D2FF00;
        }
        .dash__slider::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #D2FF00; cursor: pointer; box-shadow: 0 0 8px rgba(210,255,0,0.3); }
        .dash__status-line { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-top: 12px; }
        .dash__status-line--warn { color: #F59E0B; }
        .dash__status-line--ok { color: #22C55E; }
        .dash__pulse { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #F59E0B; animation: dash-pulse 1.2s ease-in-out infinite; }
        @keyframes dash-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        .dash__source-list { display: flex; flex-direction: column; gap: 12px; }
        .dash__source-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .dash__source-url { font-size: 13px; color: rgba(255,255,255,0.3); word-break: break-all; margin: 2px 0 0; }
        .dash__badge { font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .dash__badge--loaded { background: rgba(210,255,0,0.1); color: #D2FF00; }
        .dash__badge--loading { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .dash__badge--error { background: rgba(239,68,68,0.1); color: #EF4444; }
        .dash__source-channels { margin-top: 12px; }
        .dash__source-meta { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0 0 8px; font-weight: 500; }
        .dash__chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .dash__chip { font-size: 12px; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; color: rgba(255,255,255,0.5); }
        .dash__chip-more { font-size: 12px; color: rgba(255,255,255,0.2); padding: 4px 8px; }
        .dash__loading-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #F59E0B; margin-top: 12px; }
        .dash__source-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .dash__btn-row { display: flex; gap: 10px; }
        .dash__empty { text-align: center; padding: 40px 20px; }
        .dash__empty-title { font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.4); margin: 0 0 6px; }
        .dash__empty-desc { font-size: 14px; color: rgba(255,255,255,0.2); margin: 0; }
        .dash__toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: #D2FF00; color: #111112; font-weight: 600; font-size: 15px;
          padding: 14px 24px; border-radius: 12px;
          box-shadow: 0 4px 24px rgba(210,255,0,0.25); z-index: 100;
          animation: dash-toast-in 250ms ease;
        }
        @keyframes dash-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      ` }} />
    </main>
  );
}
