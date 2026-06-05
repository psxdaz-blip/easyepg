"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const WORDS = ["Login", "Register"];

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const goNext = useCallback(() => {
    setDirection('right');
    setWordIndex((prev) => (prev + 1) % WORDS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection('left');
    setWordIndex((prev) => (prev - 1 + WORDS.length) % WORDS.length);
  }, []);

  const slideFrom = direction === 'right' ? '30px' : '-30px';

  return (
    <main className="landing">
      {/* Carousel hero */}
      <section className="landing__hero">
        <div className="landing__carousel">
          <button className="landing__arrow landing__arrow--left" onClick={goPrev} aria-label="Previous">
            ‹
          </button>
          <div className="landing__carousel-track">
            {WORDS.map((w, i) => (
              <span
                key={w}
                className="landing__carousel-word"
                style={{
                  opacity: i === wordIndex ? 1 : 0,
                  transform: i === wordIndex ? 'translateX(0)' : `translateX(${i === wordIndex ? 0 : slideFrom})`,
                  pointerEvents: i === wordIndex ? 'auto' : 'none' as const,
                }}
              >
                {w}
              </span>
            ))}
          </div>
          <button className="landing__arrow landing__arrow--right" onClick={goNext} aria-label="Next">
            ›
          </button>
        </div>
        <p className="landing__tagline">Your TV channels, all in one link.</p>
      </section>

      <p className="landing__note">Works in any IPTV app.</p>

      <div className="landing__badges">
        {["TiviMate", "IPTV Smarters", "VLC", "Plex", "Jellyfin"].map((app) => (
          <span key={app} className="landing__badge">
            <span className="landing__check">✓</span> {app}
          </span>
        ))}
      </div>

      <div className="landing__demo">
        <p className="landing__demo-text">Want to see it first?</p>
        <Link href="/dashboard" className="landing__demo-link" aria-label="View demo dashboard">
          View demo →
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .landing {
          min-height: 100vh;
          background: #111112;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          gap: 0;
        }
        .landing__hero {
          text-align: center;
          width: 100%;
          max-width: 860px;
          margin-bottom: 32px;
        }
        .landing__carousel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          position: relative;
        }
        .landing__carousel-track {
          position: relative;
          height: 1.15em;
          width: 100%;
          max-width: 620px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .landing__carousel-word {
          position: absolute;
          font-size: clamp(72px, 18vw, 160px);
          font-weight: 900;
          color: #D2FF00;
          letter-spacing: -0.04em;
          transition: opacity 400ms ease, transform 400ms ease;
          white-space: nowrap;
          line-height: 1;
          text-shadow: 0 0 100px rgba(210,255,0,0.2);
          user-select: none;
        }
        .landing__arrow {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.35);
          font-size: 28px;
          font-weight: 300;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 250ms ease;
          line-height: 1;
        }
        .landing__arrow:hover {
          border-color: #D2FF00;
          color: #D2FF00;
          background: rgba(210,255,0,0.06);
        }
        .landing__arrow:active {
          transform: scale(0.9);
        }
        .landing__tagline {
          font-size: clamp(14px, 2vw, 18px);
          color: rgba(255,255,255,0.45);
          font-weight: 400;
          letter-spacing: 0.3px;
          margin: 0;
        }
        .landing__note {
          font-size: 13px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 0 0 28px;
        }
        .landing__badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-bottom: 0;
        }
        .landing__badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: 100px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .landing__check { color: #D2FF00; font-weight: 700; }
        .landing__demo {
          margin-top: 40px;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          width: 100%;
          max-width: 400px;
        }
        .landing__demo-text {
          font-size: 14px;
          color: rgba(255,255,255,0.3);
          margin: 0 0 14px;
        }
        .landing__demo-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 28px;
          border-radius: 100px;
          background: rgba(210,255,0,0.08);
          color: #D2FF00;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: background 200ms ease;
          border: 1px solid rgba(210,255,0,0.15);
        }
        .landing__demo-link:hover { background: rgba(210,255,0,0.15); }
      ` }} />
    </main>
  );
}
