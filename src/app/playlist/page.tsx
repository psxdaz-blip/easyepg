"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import NewCategoryModal from "@/components/NewCategoryModal";
import AssignCategoryModal from "@/components/AssignCategoryModal";
import CopyCategoriesModal from "@/components/CopyCategoriesModal";
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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [copyCategoriesModalOpen, setCopyCategoriesModalOpen] = useState(false);
  const [pendingAssignIds, setPendingAssignIds] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    mockMasterChannels.forEach((c) => { if (c.groupTitle) cats.add(c.groupTitle); });
    customCategories.forEach((c) => cats.add(c));
    return Array.from(cats).sort();
  }, [customCategories]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleNewPlaylist = () => {
    showToast("✅ New playlist created — add channels from the Master list");
  };

  const handleNewCategory = (name: string) => {
    setCustomCategories((prev) => [...prev, name]);
    showToast(`✅ Category "${name}" created`);
  };

  const handleAssignCategory = (category: string, channelIds: string[]) => {
    setPendingAssignIds(channelIds);
    setAssignModalOpen(true);
  };

  const handleCategoryAssigned = (category: string, channelIds: string[]) => {
    showToast(`✅ ${channelIds.length} channels assigned to "${category}"`);
  };

  const handleCopyByCategory = (categories: string[]) => {
    const count = mockMasterChannels.filter((c) => c.groupTitle && categories.includes(c.groupTitle)).length;
    showToast(`✅ ${count} channels copied from ${categories.length} categor${categories.length > 1 ? "ies" : "y"}`);
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

  // Merge mock categories with custom ones for the filter rail
  const allChannels = [
    ...mockMasterChannels,
    ...(customCategories.length > 0
      ? customCategories.map((cat, i) => ({
          id: `custom-cat-${i}`,
          name: cat,
          groupTitle: cat,
          streamUrl: "",
          nextProgram: null,
        }))
      : []),
  ] as typeof mockMasterChannels;

  return (
    <main className="min-h-screen bg-white">
      <Header
        title="My Playlist"
        showBack
        backHref="/dashboard"
        onNewPlaylist={handleNewPlaylist}
        onNewCategory={() => setCategoryModalOpen(true)}
      />

      {/* View toggle */}
      <div className="flex gap-2 px-6 py-3 border-b border-[#E5E7EB]">
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
        {customCategories.length > 0 && (
          <span className="text-[14px] text-[#16A34A] self-center ml-2 font-medium">
            +{customCategories.length} custom
          </span>
        )}
      </div>

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
          onAssignCategory={(cat, ids) => handleAssignCategory(cat, ids)}
          onAddCategoriesToPlaylist={() => setCopyCategoriesModalOpen(true)}
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

      <NewCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={handleNewCategory}
      />

      <AssignCategoryModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        categories={allCategories}
        selectedChannelCount={pendingAssignIds.length}
        selectedChannelIds={pendingAssignIds}
        onAssign={handleCategoryAssigned}
      />

      <CopyCategoriesModal
        open={copyCategoriesModalOpen}
        onClose={() => setCopyCategoriesModalOpen(false)}
        categories={allCategories}
        onCopy={handleCopyByCategory}
      />

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
