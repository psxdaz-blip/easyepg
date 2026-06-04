// components/AssignCategoryModal.tsx — pick a category and assign selected channels to it

"use client";

import React, { useState, useEffect } from "react";

export interface AssignCategoryModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  selectedChannelCount: number;
  onAssign: (category: string, channelIds: string[]) => void;
  selectedChannelIds: string[];
}

const AssignCategoryModal: React.FC<AssignCategoryModalProps> = ({
  open,
  onClose,
  categories,
  selectedChannelCount,
  onAssign,
  selectedChannelIds,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>("");

  useEffect(() => {
    if (open) setSelectedCat("");
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  const handleAssign = () => {
    if (!selectedCat) return;
    onAssign(selectedCat, selectedChannelIds);
    onClose();
  };

  return (
    <div
      className="acm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Assign to category"
    >
      <div className="acm-modal">
        <button className="acm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 className="acm-title">Add to Category</h2>
        <p className="acm-sub">
          Assign {selectedChannelCount} selected channel{selectedChannelCount !== 1 ? "s" : ""} to a category.
        </p>

        <div className="acm-list">
          {categories.filter((c) => c !== "All").map((cat) => (
            <button
              key={cat}
              className={`acm-option ${selectedCat === cat ? "acm-option--selected" : ""}`}
              onClick={() => setSelectedCat(cat)}
              aria-pressed={selectedCat === cat}
            >
              {cat}
            </button>
          ))}
          {categories.filter((c) => c !== "All").length === 0 && (
            <p className="acm-empty">No categories yet. Create one first.</p>
          )}
        </div>

        <div className="acm-actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            disabled={!selectedCat}
            onClick={handleAssign}
          >
            Assign to {selectedCat || "..."}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .acm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 24px;
        }
        .acm-modal {
          background: var(--bg, #FFFFFF);
          border-radius: var(--card-border-radius, 16px);
          padding: var(--space-xl, 32px);
          max-width: 440px; width: 100%; position: relative;
          max-height: 80vh; display: flex; flex-direction: column;
        }
        .acm-close {
          position: absolute; top: 16px; right: 16px;
          min-width: var(--btn-min-width, 56px); min-height: var(--btn-min-height, 56px);
          background: none; border: none; font-size: 22px; cursor: pointer;
          color: var(--text-secondary, #5F6368); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .acm-close:focus-visible { outline: 3px solid var(--focus-ring, #2563EB); outline-offset: 2px; }
        .acm-title {
          font-size: var(--font-h1, 32px); font-weight: 700;
          color: var(--text-primary, #1A1A1A); margin: 0 0 8px;
        }
        .acm-sub {
          font-size: var(--font-base, 16px); color: var(--text-secondary, #5F6368);
          margin: 0 0 24px;
        }
        .acm-list {
          display: flex; flex-direction: column; gap: 8px;
          overflow-y: auto; flex: 1; margin-bottom: 24px;
        }
        .acm-option {
          min-height: 56px; padding: 0 20px;
          border-radius: var(--btn-border-radius, 12px);
          border: 2px solid var(--border, #E5E7EB);
          background: var(--bg-card, #F8F9FA);
          font-size: 16px; font-weight: 500; color: var(--text-primary, #1A1A1A);
          cursor: pointer; text-align: left; transition: all 150ms ease;
        }
        .acm-option:hover { background: var(--bg-hover, #F0F1F3); }
        .acm-option--selected {
          border-color: var(--accent, #2563EB);
          background: var(--accent-soft, #EFF6FF);
          color: var(--accent, #2563EB);
        }
        .acm-option:focus-visible { outline: 3px solid var(--focus-ring, #2563EB); outline-offset: 2px; }
        .acm-empty {
          text-align: center; color: var(--text-muted, #9AA0A6); padding: 24px;
        }
        .acm-actions { display: flex; gap: 12px; justify-content: flex-end; }
      ` }} />
    </div>
  );
};

export default AssignCategoryModal;
