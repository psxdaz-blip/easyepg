"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EpgSourceData {
  id: string; name: string; url: string;
  status: "loading" | "loaded" | "error";
  channelCount: number; entryCount: number; addedAt: string;
  channels?: Array<{ tvgId: string; displayName: string }>;
}

type Step = "source" | "epg" | "done";

const EPG_COLORS = ['#D2FF00','#FF6B9D','#5BC0EB','#00C9A7','#FFD166','#FF8C42','#C084FC','#F472B6'];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [toast, setToast] = useState<string | null>(null);

  /* Source playlist state */
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourcePlaylists, setSourcePlaylists] = useState<Array<{ id: string; name: string; url: string; channelCount: number }>>([]);

  /* EPG state */
  const [epgSources, setEpgSources] = useState<EpgSourceData[]>([]);
  const [newEpgName, setNewEpgName] = useState("");
  const [newEpgUrl, setNewEpgUrl] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  /* Load existing EPG sources */
  const loadEpg = async () => {
    try { const r = await fetch("/api/epg/sources"); const d = await r.json(); setEpgSources(d.sources || []); } catch {}
  };
  useEffect(() => { loadEpg(); const i = setInterval(loadEpg, 3000); return () => clearInterval(i); }, []);

  /* Load existing source playlists */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("easyepg_source_playlists");
      if (saved) setSourcePlaylists(JSON.parse(saved));
    } catch {}
  }, []);

  const savePlaylists = (list: typeof sourcePlaylists) => {
    setSourcePlaylists(list);
    localStorage.setItem("easyepg_source_playlists", JSON.stringify(list));
  };

  const handleAddSource = () => {
    if (!sourceUrl) return;
    const id = `src_${Date.now()}`;
    const name = sourceName || `Playlist ${sourcePlaylists.length + 1}`;
    savePlaylists([...sourcePlaylists, { id, name, url: sourceUrl, channelCount: 68 }]);
    setSourceUrl("");
    setSourceName("");
    showToast(`✅ "${name}" added`);
  };

  const handleRemoveSource = (id: string) => {
    savePlaylists(sourcePlaylists.filter((s) => s.id !== id));
  };

  const handleAddEpg = async () => {
    if (!newEpgName || !newEpgUrl) return;
    try {
      await fetch("/api/epg/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEpgName, url: newEpgUrl }),
      });
      setNewEpgName("");
      setNewEpgUrl("");
      showToast("✅ EPG source added");
      setTimeout(loadEpg, 500);
    } catch { showToast("❌ Failed to add EPG source"); }
  };

  const handleRemoveEpg = async (id: string) => {
    try { await fetch(`/api/epg/sources?id=${id}`, { method: "DELETE" }); loadEpg(); } catch {}
  };

  const hasSources = sourcePlaylists.length > 0;
  const hasEpg = epgSources.some((s) => s.status === "loaded");
  const loadedEpg = epgSources.filter((s) => s.status === "loaded");

  return (
    <main className="setup">
      {/* ─── Top ─── */}
      <header className="setup__top">
        <span className="setup__logo">easyepg</span>
        <Link href="/dashboard" className="setup__pill">Skip →</Link>
      </header>

      {/* ─── Steps indicator ─── */}
      <div className="setup__steps">
        {(["source", "epg", "done"] as Step[]).map((s) => (
          <div key={s} className={`setup__step ${step === s ? "setup__step--active" : ""}
            ${(s === "epg" && hasSources) || (s === "done" && hasSources && hasEpg) ? "setup__step--done" : ""}`} />
        ))}
      </div>

      {/* ═══════════ STEP 1: ADD SOURCE PLAYLIST ═══════════ */}
      {step === "source" && (
        <div className="setup__content">
          <h1 className="setup__title">Add your playlist</h1>
          <p className="setup__sub">Paste an M3U URL to import your channels.</p>

          <div className="setup__card">
            <input
              type="url" value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="M3U URL (https://...)"
              className="setup__input"
            />
            <input
              type="text" value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Name (e.g. My IPTV Provider)"
              className="setup__input"
            />
            <button className="setup__btn setup__btn--primary" disabled={!sourceUrl} onClick={handleAddSource}>
              + Add Playlist
            </button>
          </div>

          {/* Source list */}
          {sourcePlaylists.length > 0 && (
            <div className="setup__list">
              <p className="setup__list-label">Your playlists</p>
              {sourcePlaylists.map((sp, idx) => (
                <div key={sp.id} className="setup__list-item" style={{ borderLeftColor: EPG_COLORS[idx % EPG_COLORS.length], borderLeftWidth: 3, borderLeftStyle: 'solid' }}>
                  <div>
                    <p className="setup__item-name">{sp.name}</p>
                    <p className="setup__item-meta">{sp.channelCount} channels</p>
                  </div>
                  <button className="setup__btn-icon" onClick={() => handleRemoveSource(sp.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {sourcePlaylists.length > 0 && (
            <button className="setup__btn setup__btn--primary setup__btn--full" onClick={() => setStep("epg")}>
              Next: Add EPG →
            </button>
          )}
        </div>
      )}

      {/* ═══════════ STEP 2: ADD EPG ═══════════ */}
      {step === "epg" && (
        <div className="setup__content">
          <h1 className="setup__title">Add EPG guide data</h1>
          <p className="setup__sub">Add an XMLTV URL so your channels show program info.</p>

          <div className="setup__card">
            <input
              type="text" value={newEpgName}
              onChange={(e) => setNewEpgName(e.target.value)}
              placeholder="Name (e.g. Sky UK Guide)"
              className="setup__input"
            />
            <input
              type="url" value={newEpgUrl}
              onChange={(e) => setNewEpgUrl(e.target.value)}
              placeholder="XMLTV URL (https://...)"
              className="setup__input"
            />
            <button className="setup__btn setup__btn--primary" disabled={!newEpgName || !newEpgUrl} onClick={handleAddEpg}>
              + Add EPG
            </button>
          </div>

          {/* EPG list */}
          {epgSources.length > 0 && (
            <div className="setup__list">
              <p className="setup__list-label">EPG sources</p>
              {epgSources.map((src, idx) => (
                <div key={src.id} className="setup__list-item">
                  <div>
                    <p className="setup__item-name">{src.name}</p>
                    <p className="setup__item-meta">{src.channelCount} channels · {src.entryCount} entries</p>
                  </div>
                  <div className="setup__list-actions">
                    <span className={`setup__badge setup__badge--${src.status}`}>
                      {src.status === "loaded" ? "Active" : src.status === "loading" ? "Loading" : "Error"}
                    </span>
                    <button className="setup__btn-icon" onClick={() => handleRemoveEpg(src.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasEpg && (
            <button className="setup__btn setup__btn--primary setup__btn--full" onClick={() => setStep("done")}>
              Next: Edit Playlist →
            </button>
          )}
        </div>
      )}

      {/* ═══════════ STEP 3: DONE ═══════════ */}
      {step === "done" && (
        <div className="setup__content setup__content--center">
          <div className="setup__check">🎉</div>
          <h1 className="setup__title">You&apos;re all set!</h1>
          <p className="setup__sub">
            {sourcePlaylists.length} source playlist{sourcePlaylists.length > 1 ? 's' : ''} · {loadedEpg.length} EPG source{loadedEpg.length > 1 ? 's' : ''}
          </p>
          <p className="setup__hint">Start arranging your channels in the playlist editor.</p>
          <Link href="/playlist" className="setup__btn setup__btn--primary setup__btn--full">
            Open Playlist Editor →
          </Link>
          <Link href="/dashboard" className="setup__btn setup__btn--ghost setup__btn--full">
            Go to Dashboard
          </Link>
          <button className="setup__btn setup__btn--secondary setup__btn--full" onClick={() => { setStep("source"); }}>
            + Add another source or EPG
          </button>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && <div className="setup__toast" role="alert">{toast}</div>}

      <style dangerouslySetInnerHTML={{ __html: `
        .setup {
          background: #0C0C0D; min-height: 100vh;
          color: #E4E4E7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px 24px 100px;
        }
        .setup__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .setup__logo { font-size: 20px; font-weight: 700; color: #D2FF00; letter-spacing: -0.3px; }
        .setup__pill {
          display: inline-flex; align-items: center; min-height: 34px; padding: 0 14px;
          border-radius: 20px; font-size: 13px; font-weight: 600; text-decoration: none;
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); transition: all 150ms;
        }
        .setup__pill:hover { color: #E4E4E7; background: rgba(255,255,255,0.08); }
        .setup__steps { display: flex; gap: 8px; margin-bottom: 32px; justify-content: center; }
        .setup__step { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.1); transition: all 300ms; }
        .setup__step--active { width: 36px; border-radius: 4px; background: #D2FF00; }
        .setup__step--done { background: #22C55E; }
        .setup__content { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
        .setup__content--center { align-items: center; text-align: center; }
        .setup__title { font-size: 26px; font-weight: 700; color: #FFFFFF; margin: 0; }
        .setup__sub { font-size: 15px; color: rgba(255,255,255,0.35); margin: 0; line-height: 1.5; }
        .setup__hint { font-size: 14px; color: rgba(255,255,255,0.2); margin: 0; }
        .setup__check { font-size: 56px; line-height: 1; margin-bottom: 8px; }
        .setup__card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
        }
        .setup__input {
          width: 100%; min-height: 48px; padding: 0 14px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: #E4E4E7; font-size: 15px; outline: none; transition: border-color 150ms;
        }
        .setup__input:focus { border-color: #D2FF00; }
        .setup__input::placeholder { color: rgba(255,255,255,0.2); }
        .setup__btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          min-height: 48px; padding: 0 20px; border-radius: 12px; font-size: 15px;
          font-weight: 600; border: none; cursor: pointer; text-decoration: none;
          transition: all 150ms ease; white-space: nowrap; line-height: 1;
        }
        .setup__btn:active { transform: scale(0.97); }
        .setup__btn--primary { background: #D2FF00; color: #0C0C0D; }
        .setup__btn--primary:hover { background: #BCE600; }
        .setup__btn--primary:disabled { opacity: 0.4; cursor: default; transform: none; }
        .setup__btn--secondary { background: rgba(255,255,255,0.08); color: #E4E4E7; border: 1px solid rgba(255,255,255,0.1); }
        .setup__btn--secondary:hover { background: rgba(255,255,255,0.12); }
        .setup__btn--ghost { background: transparent; color: rgba(255,255,255,0.4); min-height: auto; padding: 0 8px; }
        .setup__btn--ghost:hover { color: rgba(255,255,255,0.7); }
        .setup__btn--full { width: 100%; }
        .setup__btn-icon {
          width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer;
          background: transparent; color: rgba(255,255,255,0.2); font-size: 14px;
          display: flex; align-items: center; justify-content: center; transition: all 150ms; flex-shrink: 0;
        }
        .setup__btn-icon:hover { background: rgba(239,68,68,0.1); color: #EF4444; }
        .setup__list { display: flex; flex-direction: column; gap: 8px; }
        .setup__list-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.3); margin: 0; }
        .setup__list-item {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px 16px;
        }
        .setup__list-actions { display: flex; align-items: center; gap: 8px; }
        .setup__item-name { font-size: 15px; font-weight: 500; color: #E4E4E7; margin: 0; }
        .setup__item-meta { font-size: 12px; color: rgba(255,255,255,0.3); margin: 2px 0 0; }
        .setup__badge {
          font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; white-space: nowrap;
        }
        .setup__badge--loaded { background: rgba(34,197,94,0.1); color: #22C55E; }
        .setup__badge--loading { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .setup__badge--error { background: rgba(239,68,68,0.1); color: #EF4444; }
        .setup__toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: #D2FF00; color: #0C0C0D; font-weight: 600; font-size: 14px;
          padding: 12px 20px; border-radius: 12px;
          box-shadow: 0 4px 24px rgba(210,255,0,0.2); z-index: 100;
          animation: setup-slide 250ms ease;
        }
        @keyframes setup-slide { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      ` }} />
    </main>
  );
}
