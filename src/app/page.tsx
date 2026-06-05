"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
      setTimeout(() => router.push(`/verify?email=${encodeURIComponent(email)}`), 1200);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing">
      <div className="landing__glow" aria-hidden="true" />
      <div className="landing__glow landing__glow--2" aria-hidden="true" />

      <nav className="landing__nav">
        <span className="landing__logo">easyepg</span>
        <Link href="/dashboard" className="landing__nav-link">View demo →</Link>
      </nav>

      <section className="landing__hero">
        <div className="landing__carousel">
          <button type="button" className="landing__arrow" onClick={() => setWordIndex(0)} aria-label="Previous">‹</button>
          <div className="landing__track">
            <span className="landing__word" style={{ opacity: wordIndex === 0 ? 1 : 0 }}>Login</span>
            <span className="landing__word" style={{ opacity: wordIndex === 1 ? 1 : 0 }}>Register</span>
          </div>
          <button type="button" className="landing__arrow" onClick={() => setWordIndex(1)} aria-label="Next">›</button>
        </div>
              >
                {w}
              </span>
            ))}
          </div>
          <button type="button" className="landing__arrow" onClick={goNext} aria-label="Next">›</button>
        </div>

        <form onSubmit={handleSubmit} className="landing__form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Enter your email"
            required
            className="landing__input"
          />
          <button
            type="submit"
            disabled={sent || loading}
            className="landing__submit"
          >
            {loading ? "Sending..." : sent ? "✉️ Check your inbox" : "Continue"}
          </button>
        </form>

        {error && <p className="landing__error">{error}</p>}

        <div className="landing__apps">
          {["TiviMate", "IPTV Smarters", "VLC", "Plex", "Jellyfin"].map((app) => (
            <span key={app} className="landing__app">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#D2FF00"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              {app}
            </span>
          ))}
        </div>
      </section>

      <style>{`
        .landing {
          min-height: 100vh;
          background: #111112;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
        }
        .landing__glow {
          position: fixed;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(210,255,0,0.06) 0%, transparent 70%);
          top: -300px;
          right: -250px;
          pointer-events: none;
        }
        .landing__glow--2 {
          width: 500px;
          height: 500px;
          bottom: -150px;
          left: -150px;
          top: auto;
          right: auto;
        }
        .landing__nav {
          width: 100%;
          max-width: 500px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
        }
        .landing__logo {
          font-size: 20px;
          font-weight: 700;
          color: #D2FF00;
        }
        .landing__nav-link {
          padding: 10px 20px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background 200ms, color 200ms;
        }
        .landing__nav-link:hover { background: rgba(210,255,0,0.08); color: #D2FF00; }
        .landing__hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 1;
        }
        .landing__carousel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 48px;
          width: 100%;
          max-width: 500px;
        }
        .landing__track {
          position: relative;
          height: 1.2em;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .landing__word {
          position: absolute;
          font-size: clamp(64px, 15vw, 120px);
          font-weight: 900;
          color: #D2FF00;
          letter-spacing: -0.04em;
          transition: opacity 300ms ease;
          white-space: nowrap;
          line-height: 1;
          text-shadow: 0 0 120px rgba(210,255,0,0.1);
          user-select: none;
        }
        .landing__arrow {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.3);
          font-size: 28px;
          font-weight: 300;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 200ms, color 200ms, background 200ms;
          line-height: 1;
          user-select: none;
        }
        .landing__arrow:hover { border-color: #D2FF00; color: #D2FF00; background: rgba(210,255,0,0.08); }
        .landing__form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          margin-bottom: 24px;
        }
        .landing__input {
          width: 100%;
          min-height: 56px;
          padding: 0 20px;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: border-color 200ms;
          box-sizing: border-box;
        }
        .landing__input::placeholder { color: rgba(255,255,255,0.25); }
        .landing__input:focus { border-color: #D2FF00; }
        .landing__submit {
          width: 100%;
          min-height: 56px;
          border-radius: 14px;
          border: none;
          background: #D2FF00;
          color: #111112;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 200ms, box-shadow 200ms;
        }
        .landing__submit:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(210,255,0,0.2); }
        .landing__submit:active { transform: scale(0.97); }
        .landing__submit:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
        .landing__error { font-size: 13px; color: #FF6B6B; margin: -8px 0 16px; }
        .landing__apps {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .landing__app {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: 100px;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.35);
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.05);
        }
        @media (max-width: 640px) {
          .landing { padding: 16px; }
          .landing__track { width: 180px; }
          .landing__carousel { gap: 4px; }
          .landing__arrow { width: 48px; height: 48px; font-size: 24px; }
        }
      `}</style>
    </main>
  );
}
