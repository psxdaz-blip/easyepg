// components/Header.tsx — EasyEPG global navigation header

"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface HeaderProps {
  /** Current page title shown in center */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  backHref?: string;
  /** Called when "New Playlist" is clicked */
  onNewPlaylist?: () => void;
  /** Called when "New Category" is clicked */
  onNewCategory?: () => void;
  /** Hide the action buttons (for pages where they don't apply) */
  hideActions?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack,
  backHref = "/dashboard",
  onNewPlaylist,
  onNewCategory,
  hideActions = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header__left">
        {showBack && (
          <Link
            href={backHref}
            className="btn btn--ghost header__back"
            aria-label="Back"
          >
            ←
          </Link>
        )}
        <Link href="/dashboard" className="header__logo" aria-label="EasyEPG home">
          easyepg
        </Link>
      </div>

      {title && <h1 className="header__title">{title}</h1>}

      <div className="header__right">
        {/* Desktop nav links */}
        <nav className="header__nav">
          <Link href="/playlist" className="header__nav-link">Playlist</Link>
          <Link href="/epg" className="header__nav-link">EPG</Link>
          <Link href="/settings" className="header__nav-link">Settings</Link>
        </nav>

        {!hideActions && (
          <>
            {/* Desktop buttons */}
            <div className="header__desktop-actions">
              <button
                className="btn btn--primary header__btn"
                onClick={onNewPlaylist}
                aria-label="Create new playlist"
              >
                + New Playlist
              </button>
              <button
                className="btn btn--secondary header__btn"
                onClick={onNewCategory}
                aria-label="Create new category"
              >
                + New Category
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="header__hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span className={`header__hamburger-line ${menuOpen ? "header__hamburger-line--open" : ""}`} />
              <span className={`header__hamburger-line ${menuOpen ? "header__hamburger-line--open" : ""}`} />
              <span className={`header__hamburger-line ${menuOpen ? "header__hamburger-line--open" : ""}`} />
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && !hideActions && (
        <div className="header__mobile-menu" role="menu">
          <Link href="/playlist" className="header__mobile-link" role="menuitem" onClick={() => setMenuOpen(false)}>
            Playlist
          </Link>
          <Link href="/epg" className="header__mobile-link" role="menuitem" onClick={() => setMenuOpen(false)}>
            EPG
          </Link>
          <Link href="/settings" className="header__mobile-link" role="menuitem" onClick={() => setMenuOpen(false)}>
            Settings
          </Link>
          <hr className="header__mobile-divider" />
          <button
            className="btn btn--primary btn--full header__mobile-btn"
            onClick={() => { onNewPlaylist?.(); setMenuOpen(false); }}
            role="menuitem"
          >
            + New Playlist
          </button>
          <button
            className="btn btn--secondary btn--full header__mobile-btn"
            onClick={() => { onNewCategory?.(); setMenuOpen(false); }}
            role="menuitem"
          >
            + New Category
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px var(--page-gutter, 24px);
          border-bottom: 1px solid var(--border, #E5E7EB);
          background: var(--bg, #FFFFFF);
          position: relative;
          min-height: 64px;
        }
        .header__left {
          display: flex;
          align-items: center;
          gap: var(--space-sm, 12px);
        }
        .header__back {
          min-width: 44px;
          min-height: 44px;
          padding: 0 12px;
          font-size: 20px;
        }
        .header__logo {
          font-size: var(--font-h2, 22px);
          font-weight: 700;
          color: var(--text-primary, #1A1A1A);
          text-decoration: none;
        }
        .header__title {
          font-size: var(--font-base, 16px);
          font-weight: 600;
          color: var(--text-secondary, #5F6368);
          margin: 0;
          text-align: center;
          flex: 1;
        }
        .header__right {
          display: flex;
          align-items: center;
          gap: var(--space-sm, 12px);
        }
        .header__nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .header__nav-link {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #5F6368);
          text-decoration: none;
          transition: background 150ms ease, color 150ms ease;
        }
        .header__nav-link:hover {
          background: var(--accent-soft, #EFF6FF);
          color: var(--accent, #2563EB);
        }
        .header__desktop-actions {
          display: flex;
          gap: var(--space-xs, 8px);
        }
        .header__btn {
          min-height: 44px;
          padding: 0 20px;
          font-size: 15px;
          white-space: nowrap;
        }
        .header__hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          min-width: var(--btn-min-width, 56px);
          min-height: var(--btn-min-height, 56px);
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 8px;
        }
        .header__hamburger:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .header__hamburger-line {
          display: block;
          width: 24px;
          height: 2.5px;
          background: var(--text-primary, #1A1A1A);
          border-radius: 2px;
          transition: transform 200ms ease, opacity 200ms ease;
        }
        .header__hamburger-line--open:nth-child(1) {
          transform: translateY(7.5px) rotate(45deg);
        }
        .header__hamburger-line--open:nth-child(2) {
          opacity: 0;
        }
        .header__hamburger-line--open:nth-child(3) {
          transform: translateY(-7.5px) rotate(-45deg);
        }
        .header__mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg, #FFFFFF);
          border-bottom: 1px solid var(--border, #E5E7EB);
          padding: var(--space-md, 16px) var(--page-gutter, 24px);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm, 12px);
          z-index: 50;
          box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }
        .header__mobile-btn {
          min-height: 52px;
        }
        .header__mobile-link {
          display: block;
          padding: 12px 0;
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #1A1A1A);
          text-decoration: none;
          border-radius: 8px;
          transition: color 150ms ease;
        }
        .header__mobile-link:hover {
          color: var(--accent, #2563EB);
        }
        .header__mobile-divider {
          border: none;
          border-top: 1px solid var(--border, #E5E7EB);
          margin: 4px 0;
        }
        @media (max-width: 768px) {
          .header__desktop-actions {
            display: none;
          }
          .header__nav {
            display: none;
          }
          .header__hamburger {
            display: flex;
          }
        }
      ` }} />
    </header>
  );
};

export default Header;
