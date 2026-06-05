// components/NewPlaylistModal.tsx — oversized prompt for creating a new playlist

"use client";

import React, { useState, useEffect, useRef } from "react";

export interface NewPlaylistModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const NewPlaylistModal: React.FC<NewPlaylistModalProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="npm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="New playlist"
    >
      <div className="npm-modal">
        <button className="npm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="npm-title">New Playlist</h2>
        <p className="npm-sub">Give your playlist a name.</p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My UK Channels"
          aria-label="Playlist name"
          className="npm-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onCreate(name.trim());
              onClose();
            }
          }}
        />
        <div className="npm-actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            disabled={!name.trim()}
            onClick={() => {
              onCreate(name.trim());
              onClose();
            }}
          >
            Create
          </button>
        </div>
      </div>
      <style>{`
        .npm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 24px;
        }
        .npm-modal {
          background: var(--bg, #FFFFFF);
          border-radius: var(--card-border-radius, 16px);
          padding: var(--space-xl, 32px);
          max-width: 420px; width: 100%; position: relative;
        }
        .npm-close {
          position: absolute; top: 16px; right: 16px;
          min-width: var(--btn-min-width, 56px); min-height: var(--btn-min-height, 56px);
          background: none; border: none; font-size: 22px; cursor: pointer;
          color: var(--text-secondary, #5F6368); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .npm-close:focus-visible { outline: 3px solid var(--focus-ring, #2563EB); outline-offset: 2px; }
        .npm-title {
          font-size: var(--font-h1, 32px); font-weight: 700;
          color: var(--text-primary, #1A1A1A); margin: 0 0 8px;
        }
        .npm-sub {
          font-size: var(--font-base, 16px); color: var(--text-secondary, #5F6368);
          margin: 0 0 24px;
        }
        .npm-input {
          width: 100%; min-height: 56px; padding: 0 20px;
          border-radius: var(--btn-border-radius, 12px);
          border: 2px solid var(--border, #E5E7EB);
          font-size: 18px; font-weight: 600; color: var(--text-primary, #1A1A1A);
          background: var(--bg, #FFFFFF); outline: none; margin-bottom: 24px;
        }
        .npm-input:focus { border-color: var(--accent, #2563EB); }
        .npm-input::placeholder { color: var(--text-muted, #9AA0A6); font-weight: 400; }
        .npm-actions { display: flex; gap: var(--space-sm, 12px); justify-content: flex-end; }
      `}</style>
    </div>
  );
};

export default NewPlaylistModal;
