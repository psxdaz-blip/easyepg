// components/NewCategoryModal.tsx — oversized modal for creating a new channel category

"use client";

import React, { useState, useEffect, useRef } from "react";

export interface NewCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
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
      className="ncm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Create new category"
    >
      <div className="ncm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ncm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="ncm-title">New Category</h2>
        <p className="ncm-sub">
          Create a custom channel group to organise your playlist.
        </p>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. UK ENTERTAINMENT"
          aria-label="Category name"
          className="ncm-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onCreate(name.trim().toUpperCase());
              onClose();
            }
          }}
        />

        <div className="ncm-actions">
          <button
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={!name.trim()}
            onClick={() => {
              onCreate(name.trim().toUpperCase());
              onClose();
            }}
            aria-label="Create category"
          >
            Create
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ncm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 24px;
        }
        .ncm-modal {
          background: var(--bg, #FFFFFF);
          border-radius: var(--card-border-radius, 16px);
          padding: var(--space-xl, 32px);
          max-width: 420px;
          width: 100%;
          position: relative;
        }
        .ncm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          min-width: var(--btn-min-width, 56px);
          min-height: var(--btn-min-height, 56px);
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: var(--text-secondary, #5F6368);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ncm-close:focus-visible {
          outline: 3px solid var(--focus-ring, #2563EB);
          outline-offset: 2px;
        }
        .ncm-title {
          font-size: var(--font-h1, 32px);
          font-weight: 700;
          color: var(--text-primary, #1A1A1A);
          margin: 0 0 8px;
        }
        .ncm-sub {
          font-size: var(--font-base, 16px);
          color: var(--text-secondary, #5F6368);
          margin: 0 0 24px;
        }
        .ncm-input {
          width: 100%;
          min-height: 56px;
          padding: 0 20px;
          border-radius: var(--btn-border-radius, 12px);
          border: 2px solid var(--border, #E5E7EB);
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1A1A1A);
          background: var(--bg, #FFFFFF);
          outline: none;
          margin-bottom: 24px;
        }
        .ncm-input:focus {
          border-color: var(--accent, #2563EB);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .ncm-input::placeholder {
          color: var(--text-muted, #9AA0A6);
          font-weight: 400;
        }
        .ncm-actions {
          display: flex;
          gap: var(--space-sm, 12px);
          justify-content: flex-end;
        }
      ` }} />
    </div>
  );
};

export default NewCategoryModal;
