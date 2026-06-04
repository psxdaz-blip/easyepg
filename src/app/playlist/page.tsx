"use client";

import { useState } from "react";
import Link from "next/link";
import MasterPlaylistView from "@/components/MasterPlaylistView";
import PersonalPlaylistView from "@/components/PersonalPlaylistView";
import {
  mockMasterChannels,
  mockMyChannels,
  mockAiConfidenceMap,
} from "@/lib/mock-data";

type ViewMode = "master" | "personal";

export default function PlaylistPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleCopyFromMaster = (
    mode: "all" | "category" | "smart",
    _categories?: string[]
  ) => {
    const count =
      mode === "all"
        ? mockMasterChannels.length
        : mode === "smart"
        ? 12
        : 8;
    showToast(`✅ ${count} channels copied to My Playlist`);
  };

  const handleRemoveFromMyPlaylist = (channelId: string) => {
    const ch = mockMyChannels.find((c) => c.id === channelId);
    showToast(`"${ch?.name ?? "Channel"}" removed`);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Top navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="btn btn--ghost"
            aria-label="Back to dashboard"
          >
            ← Back
          </Link>
          <span className="text-[22px] font-bold text-[#1A1A1A]">
            My Playlist
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn ${viewMode === "master" ? "btn--primary" : "btn--ai"}`}
            onClick={() => setViewMode("master")}
            aria-label="View Master Playlist"
          >
            Master ({mockMasterChannels.length})
          </button>
          <button
            className={`btn ${viewMode === "personal" ? "btn--primary" : "btn--ai"}`}
            onClick={() => setViewMode("personal")}
            aria-label="View My Playlist"
          >
            My List ({mockMyChannels.length})
          </button>
        </div>
      </header>

      {/* Content */}
      {viewMode === "master" ? (
        <MasterPlaylistView
          channels={mockMasterChannels}
          aiSuggestionsCount={3}
          aiConfidenceMap={mockAiConfidenceMap}
          onSave={() => showToast("✅ Playlist saved")}
          onShowAiSuggestions={() => showToast("⚡ AI suggestions panel opened")}
          onCopyToMyPlaylist={(ids) => {
            handleCopyFromMaster("all");
          }}
        />
      ) : (
        <PersonalPlaylistView
          masterChannels={mockMasterChannels}
          myChannels={mockMyChannels}
          aiConfidenceMap={mockAiConfidenceMap}
          smartSuggestResult={{
            channelIds: ["ch-011", "ch-012", "ch-014"],
            avgConfidence: 0.82,
          }}
          onCopyFromMaster={handleCopyFromMaster}
          onRemoveFromMyPlaylist={handleRemoveFromMyPlaylist}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#1A1A1A] text-white px-6 py-4 rounded-[12px] text-[18px] shadow-lg animate-slide-up"
          role="alert"
          aria-live="polite"
        >
          <span>{toast}</span>
          <button
            className="text-[#2563EB] font-semibold text-[16px] bg-none border-none cursor-pointer"
            onClick={() => setToast(null)}
            aria-label="Undo"
          >
            Undo
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up { animation: slide-up 250ms ease; }
      `}</style>
    </main>
  );
}
