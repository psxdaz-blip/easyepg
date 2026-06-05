"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const WORDS = ["Login", "Register"];

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const goNext = useCallback(() => {
    setDirection("right");
    setWordIndex((prev) => (prev + 1) % WORDS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection("left");
    setWordIndex((prev) => (prev - 1 + WORDS.length) % WORDS.length);
  }, []);

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
          <button className="landing__arrow" onClick={goPrev} aria-label="Previous">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="landing__track">
            {WORDS.map((w, i) => (
              <span
                key={w}
                className="landing__word"
                style={{
                  opacity: i === wordIndex ? 1 : 0,
                  transform: i === wordIndex ? "translateX(0) rotate(0)" : `translateX(${direction === "right" ? "80px" : "-80px"}) rotate(${direction === "right" ? "8deg" : "-8deg"})`,
                  filter: i === wordIndex ? "blur(0)" : "blur(10px)",
                }}
              >
                {w}
              </span>
            ))}
          </div>
          <button className="landing__arrow" onClick={goNext} aria-label="Next">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <p className="landing__tagline">Your TV channels, all in one link.</p>

        <div className="landing__apps">
          {["TiviMate", "IPTV Smarters", "VLC", "Plex", "Jellyfin"].map((app) => (
            <span key={app} className="landing__app">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#D2FF00"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              {app}
            </span>
          ))}
        </div>

        <p className="landing__note">Works in any IPTV app · No setup required</p>

        <Link href="/dashboard" className="landing__cta">
          Get started
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
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
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(210,255,0,0.07) 0%, transparent 70%);
          top: -250px;
          right: -200px;
          pointer-events: none;
        }
        .landing__glow--2 {
          width: 500px;
          height: 500px;
          bottom: -150px;
          left: -150px;
          top: auto;
          right: auto;
          background: radial-gradient(circle, rgba(210,255,0,0.04) 0%, transparent 70%);
        }
        .landing__nav {
          width: 100%;
          max-width: 1100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
        }
        .landing__logo {
          font-size: 20px;
          font-weight: 700;
          color: #D2FF00;
          letter-spacing: -0.5px;
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
          max-width: 900px;
          position: relative;
          z-index: 1;
        }
        .landing__carousel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .landing__track {
          position: relative;
          height: 1.3em;
          width: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .landing__word {
          position: absolute;
          font-size: clamp(80px, 18vw, 150px);
          font-weight: 900;
          color: #D2FF00;
          letter-spacing: -0.05em;
          transition: opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), transform 450ms cubic-bezier(0.22, 1, 0.36, 1), filter 450ms ease;
          white-space: nowrap;
          line-height: 1;
          text-shadow: 0 0 150px rgba(210,255,0,0.12);
          user-select: none;
        }
        .landing__arrow {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 250ms;
        }
        .landing__arrow:hover { border-color: rgba(210,255,0,0.3); color: #D2FF00; background: rgba(210,255,0,0.05); }
        .landing__arrow:active { transform: scale(0.9); }
        .landing__tagline {
          font-size: clamp(15px, 2vw, 19px);
          color: rgba(255,255,255,0.35);
          font-weight: 400;
          margin: 0 0 32px;
          letter-spacing: 0.2px;
          line-height: 1.4;
        }
        .landing__apps {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
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
        .landing__note {
          font-size: 12px;
          color: rgba(255,255,255,0.18);
          margin: 0 0 28px;
          letter-spacing: 0.3px;
        }
        .landing__cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 40px;
          border-radius: 14px;
          background: #D2FF00;
          color: #111112;
          font-size: 17px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 200ms, box-shadow 200ms;
        }
        .landing__cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(210,255,0,0.25); }
        .landing__cta:active { transform: scale(0.97); }
        @media (max-width: 640px) {
          .landing { padding: 16px; }
          .landing__track { width: 200px; }
          .landing__arrow { width: 40px; height: 40px; }
          .landing__cta { width: 100%; justify-content: center; }
        }
      `}</style>
    </main>
  );
}
