"use client";

import { useState, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import NewPlaylistModal from "@/components/NewPlaylistModal";
import NewCategoryModal from "@/components/NewCategoryModal";
import AssignCategoryModal from "@/components/AssignCategoryModal";
import CopyCategoriesModal from "@/components/CopyCategoriesModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import MasterPlaylistView from "@/components/MasterPlaylistView";
import PersonalPlaylistView from "@/components/PersonalPlaylistView";
import {
  mockMasterChannels,
  mockMyChannels,
  mockAiConfidenceMap,
} from "@/lib/mock-data";

interface Playlist {
  id: string;
  name: string;
  channelIds: string[];
  color?: string;
  customCategories?: string[];
  /** channelId → category name overrides */
  categoryOverrides?: Record<string, string>;
}

const PLAYLIST_COLORS = [
  '#D2FF00', // neon green
  '#FF6B9D', // pink
  '#5BC0EB', // light blue
  '#00C9A7', // aqua green
  '#FFD166', // yellow
  '#FF8C42', // orange
  '#C084FC', // purple
  '#F472B6', // rose
];

type ViewMode = "master" | "personal";

export default function PlaylistPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [toast, setToast] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newPlaylistModalOpen, setNewPlaylistModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [copyCategoriesModalOpen, setCopyCategoriesModalOpen] = useState(false);
  const [pendingAssignIds, setPendingAssignIds] = useState<string[]>([]);

  // Multi-playlist management
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: "pl_default", name: "My Playlist", channelIds: mockMyChannels.map((c) => c.id), color: '#D2FF00', customCategories: [], categoryOverrides: {} },
  ]);
  const [activePlaylistId, setActivePlaylistId] = useState("pl_default");

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];
  const activeChannels = mockMasterChannels
    .filter((c) => activePlaylist.channelIds.includes(c.id))
    .map((c) => {
      const override = activePlaylist.categoryOverrides?.[c.id];
      return override ? { ...c, groupTitle: override, group: override } : c;
    });

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    mockMasterChannels.forEach((c) => { if (c.groupTitle) cats.add(c.groupTitle); });
    (activePlaylist.customCategories || []).forEach((c) => cats.add(c));
    return Array.from(cats).sort();
  }, [activePlaylist.customCategories]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // All playlists (for right pane display) — exclude active
  const otherPlaylists = playlists.filter((p) => p.id !== activePlaylistId);
  const otherChannelsLists = otherPlaylists.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    channels: mockMasterChannels.filter((c) => p.channelIds.includes(c.id)),
  }));

  const handleNewPlaylist = (name: string) => {
    const id = `pl_${Date.now()}`;
    setPlaylists((prev) => {
      const usedColors = new Set(prev.map((p) => p.color).filter(Boolean));
      const color = PLAYLIST_COLORS.find((c) => !usedColors.has(c)) || PLAYLIST_COLORS[prev.length % PLAYLIST_COLORS.length];
      return [...prev, { id, name, channelIds: [], color, categoryOverrides: {} }];
    });
    setActivePlaylistId(id);
    showToast(`✅ "${name}" created — add channels from Master`);
  };

  const handleCopyToPlaylist = useCallback((channelIds: string[], targetCategory?: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== activePlaylistId) return p;
        const newIds = [...new Set([...p.channelIds, ...channelIds])];
        const newOverrides = { ...(p.categoryOverrides || {}) };
        if (targetCategory) {
          channelIds.forEach((id) => { newOverrides[id] = targetCategory; });
        }
        return { ...p, channelIds: newIds, categoryOverrides: newOverrides };
      })
    );
  }, [activePlaylistId]);

  const handleRemoveFromPlaylist = useCallback((channelId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === activePlaylistId
          ? { ...p, channelIds: p.channelIds.filter((id) => id !== channelId) }
          : p
      )
    );
  }, [activePlaylistId]);

  const handleNewCategory = (name: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === activePlaylistId
          ? { ...p, customCategories: [...(p.customCategories || []), name] }
          : p
      )
    );
    showToast(`✅ Category "${name}" added to "${activePlaylist.name}"`);
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

  const handleCopyFromMaster = () => {
    const count = mockMasterChannels.length;
    showToast(`✅ ${count} channels copied to "${activePlaylist.name}"`);
  };

  // Merge mock categories with custom ones for the filter rail
  const playlistCats = activePlaylist.customCategories || [];
  const allChannels = [
    ...mockMasterChannels,
    ...(playlistCats.length > 0
      ? playlistCats.map((cat, i) => ({
          id: `custom-cat-${i}`,
          name: cat,
          groupTitle: cat,
          streamUrl: "",
          nextProgram: null,
        }))
      : []),
  ] as typeof mockMasterChannels;

  const canDelete = playlists.length > 1 && activePlaylistId !== "pl_default";

  const handleDeletePlaylist = () => {
    if (!canDelete) return;
    setPlaylists((prev) => prev.filter((p) => p.id !== activePlaylistId));
    // Switch to the first remaining playlist
    const remaining = playlists.filter((p) => p.id !== activePlaylistId);
    if (remaining.length > 0) setActivePlaylistId(remaining[0].id);
    setDeleteModalOpen(false);
    showToast(`🗑️ Playlist deleted`);
  };

  return (
    <main className="min-h-screen bg-white px-3">
      <Header
        title={activePlaylist.name}
        showBack
        backHref="/dashboard"
        onNewPlaylist={() => setNewPlaylistModalOpen(true)}
        onNewCategory={() => setCategoryModalOpen(true)}
      />

      {/* Playlist tabs bar */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#E5E7EB] overflow-x-auto">
        <button
          className={`btn rounded-full ${viewMode === "master" ? "btn--primary" : "btn--ai"}`}
          onClick={() => setViewMode("master")}
          aria-label="View Master Playlist"
        >
          Master ({mockMasterChannels.length})
        </button>
        {playlists.map((pl) => (
          <button
            key={pl.id}
            className={`whitespace-nowrap min-h-[44px] px-5 rounded-full text-[14px] font-medium border-2 transition-all ${
              pl.id === activePlaylistId
                ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                : "border-[#E5E7EB] bg-[#F8F9FA] text-[#5F6368]"
            }`}
            onClick={() => setActivePlaylistId(pl.id)}
            aria-label={`Switch to ${pl.name}`}
            style={pl.color ? { borderLeftColor: pl.color, borderLeftWidth: 4 } : undefined}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ backgroundColor: pl.color || '#9AA0A6' }}
            />
            {pl.name} ({pl.channelIds.length})
          </button>
        ))}
        {canDelete && (
          <button
            className="whitespace-nowrap min-h-[44px] w-[44px] flex items-center justify-center rounded-full text-[#DC2626] border-2 border-[#E5E7EB] bg-[#F8F9FA] hover:bg-[#FEF2F2] hover:border-[#DC2626] transition-all shrink-0"
            onClick={() => setDeleteModalOpen(true)}
            aria-label={`Delete ${activePlaylist.name}`}
            title="Delete playlist"
          >
            🗑️
          </button>
        )}
        {(activePlaylist.customCategories?.length || 0) > 0 && (
          <span className="text-[13px] text-[#16A34A] font-medium ml-2 whitespace-nowrap">
            +{activePlaylist.customCategories?.length || 0} cat
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
            handleCopyToPlaylist(ids);
            showToast(`✅ ${ids.length} channels added to "${activePlaylist.name}"`);
          }}
          onAssignCategory={(cat, ids) => handleAssignCategory(cat, ids)}
          onAddCategoriesToPlaylist={() => setCopyCategoriesModalOpen(true)}
        />
      ) : (
        <PersonalPlaylistView
          masterChannels={mockMasterChannels}
          myChannels={activeChannels}
          activePlaylistName={activePlaylist.name}
          activePlaylistColor={activePlaylist.color}
          playlistCategories={activePlaylist.customCategories || []}
          otherPlaylists={otherChannelsLists}
          aiConfidenceMap={mockAiConfidenceMap}
          smartSuggestResult={{
            channelIds: ["ch-011", "ch-012", "ch-014"],
            avgConfidence: 0.82,
          }}
          onCopyFromMaster={(mode, channelIds, targetCategory) => {
            if (mode === "all" && channelIds) {
              handleCopyToPlaylist(channelIds, targetCategory);
              const label = targetCategory ? ` into "${targetCategory}"` : '';
              showToast(`✅ ${channelIds.length} channels copied to "${activePlaylist.name}"${label}`);
            }
          }}
          onRemoveFromMyPlaylist={(channelId) => {
            handleRemoveFromPlaylist(channelId);
            const ch = mockMasterChannels.find((c) => c.id === channelId);
            showToast(`"${ch?.name ?? "Channel"}" removed from "${activePlaylist.name}"`);
          }}
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

      <NewPlaylistModal
        open={newPlaylistModalOpen}
        onClose={() => setNewPlaylistModalOpen(false)}
        onCreate={handleNewPlaylist}
      />

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title={`Delete "${activePlaylist.name}"?`}
        message={`Are you sure you want to delete "${activePlaylist.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeletePlaylist}
        onCancel={() => setDeleteModalOpen(false)}
      />

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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up { animation: slide-up 250ms ease; }
      ` }} />
    </main>
  );
}
