// components/CopyCategoriesModal.tsx — pick categories to copy from Master to My Playlist

"use client";

import React, { useState, useEffect } from "react";

export interface CopyCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  onCopy: (categories: string[]) => void;
}

const CopyCategoriesModal: React.FC<CopyCategoriesModalProps> = ({
  open,
  onClose,
  categories,
  onCopy,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  const toggle = (cat: string) => {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelected(next);
  };

  const handleCopy = () => {
    onCopy(Array.from(selected));
    onClose();
  };

  const filtered = categories.filter((c) => c !== "All");

  return (
    <div
      className="ccm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Copy categories to playlist"
    >
      <div className="ccm-modal">
        <button className="ccm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="ccm-title">Add Categories to Playlist</h2>
        <p className="ccm-sub">
          Select which channel categories to copy into your playlist.
        </p>

        <div className="ccm-list">
          {filtered.map((cat) => (
            <button
              key={cat}
              className={`ccm-option ${selected.has(cat) ? "ccm-option--selected" : ""}`}
              onClick={() => toggle(cat)}
              role="checkbox"
              aria-checked={selected.has(cat)}
            >
              <span className={`ccm-checkbox ${selected.has(cat) ? "ccm-checkbox--checked" : ""}`}>
                {selected.has(cat) ? "✓" : ""}
              </span>
              <span className="ccm-label">{cat}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="ccm-empty">No categories available.</p>
          )}
        </div>

        <div className="ccm-actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            disabled={selected.size === 0}
            onClick={handleCopy}
          >
            Add {selected.size > 0 ? `${selected.size} categor${selected.size > 1 ? "ies" : "y"}` : ""} to Playlist
          </button>
        </div>
      </div>

      <style>{`
        .ccm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 24px;
        }
        .ccm-modal {
          background: var(--bg, #FFFFFF);
          border-radius: var(--card-border-radius, 16px);
          padding: var(--space-xl, 32px);
          max-width: 460px; width: 100%; position: relative;
          max-height: 80vh; display: flex; flex-direction: column;
        }
        .ccm-close {
          position: absolute; top: 16px; right: 16px;
          min-width: var(--btn-min-width, 56px); min-height: var(--btn-min-height, 56px);
          background: none; border: none; font-size: 22px; cursor: pointer;
          color: var(--text-secondary, #5F6368); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .ccm-close:focus-visible { outline: 3px solid var(--focus-ring, #2563EB); outline-offset: 2px; }
        .ccm-title {
          font-size: var(--font-h1, 32px); font-weight: 700;
          color: var(--text-primary, #1A1A1A); margin: 0 0 8px;
        }
        .ccm-sub {
          font-size: var(--font-base, 16px); color: var(--text-secondary, #5F6368);
          margin: 0 0 24px;
        }
        .ccm-list {
          display: flex; flex-direction: column; gap: 8px;
          overflow-y: auto; flex: 1; margin-bottom: 24px;
        }
        .ccm-option {
          display: flex; align-items: center; gap: 16px;
          min-height: 60px; padding: 0 20px;
          border-radius: var(--btn-border-radius, 12px);
          border: 2px solid var(--border, #E5E7EB);
          background: var(--bg-card, #F8F9FA);
          cursor: pointer; text-align: left; transition: all 150ms ease;
        }
        .ccm-option:hover { background: var(--bg-hover, #F0F1F3); }
        .ccm-option--selected {
          border-color: var(--accent, #2563EB);
          background: var(--accent-soft, #EFF6FF);
        }
        .ccm-option:focus-visible { outline: 3px solid var(--focus-ring, #2563EB); outline-offset: 2px; }
        .ccm-checkbox {
          width: 28px; height: 28px; border-radius: 6px;
          border: 2px solid var(--border, #E5E7EB);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; flex-shrink: 0;
          transition: all 150ms ease;
          background: var(--bg, #FFFFFF);
        }
        .ccm-checkbox--checked {
          background: var(--accent, #2563EB);
          border-color: var(--accent, #2563EB);
          color: #FFFFFF;
        }
        .ccm-label {
          font-size: 16px; font-weight: 500; color: var(--text-primary, #1A1A1A);
        }
        .ccm-empty {
          text-align: center; color: var(--text-muted, #9AA0A6); padding: 24px;
        }
        .ccm-actions { display: flex; gap: 12px; justify-content: flex-end; }
      `}</style>
    </div>
  );
};

export default CopyCategoriesModal;
