"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import EpgMapperModal from "@/components/EpgMapperModal";
import { mockMasterChannels } from "@/lib/mock-data";

interface EpgSource {
  id: string;
  name: string;
  url: string;
  status: "loading" | "loaded" | "error";
  channelCount: number;
  entryCount: number;
  addedAt: string;
  channels?: Array<{ tvgId: string; displayName: string }>;
}

export default function EpgPage() {
  const [sources, setSources] = useState<EpgSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [mapperOpen, setMapperOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadSources = async () => {
    try {
      const res = await fetch("/api/epg/sources");
      const data = await res.json();
      setSources(data.sources);
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    loadSources();
    const interval = setInterval(loadSources, 2000); // Poll for status changes
    return () => clearInterval(interval);
  }, []);

  const handleAddSource = async () => {
    if (!newName || !newUrl) return;
    try {
      await fetch("/api/epg/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, url: newUrl }),
      });
      setNewName("");
      setNewUrl("");
      setShowAddForm(false);
      showToast("✅ EPG source added — loading...");
      setTimeout(loadSources, 500);
    } catch {
      showToast("❌ Failed to add EPG source");
    }
  };

  const openMapper = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setMapperOpen(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header
        title="EPG Manager"
        showBack
        backHref="/dashboard"
      />

      <div className="page-container">
        {/* ─── Add EPG Source ─── */}
        {!showAddForm ? (
          <button
            className="btn btn--primary btn--full mb-6"
            onClick={() => setShowAddForm(true)}
            aria-label="Add EPG source"
          >
            + Add EPG Source
          </button>
        ) : (
          <div className="card p-6 mb-6">
            <h2 className="text-[22px] font-bold text-[#1A1A1A] mb-4">New EPG Source</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="EPG name (e.g. Sky UK Guide)"
              aria-label="EPG name"
              className="w-full min-h-[56px] px-5 rounded-[12px] border-2 border-[#E5E7EB] text-[18px] mb-3 outline-none focus:border-[#2563EB]"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="XMLTV URL (https://...)"
              aria-label="XMLTV URL"
              className="w-full min-h-[56px] px-5 rounded-[12px] border-2 border-[#E5E7EB] text-[18px] mb-4 outline-none focus:border-[#2563EB]"
            />
            <div className="flex gap-3">
              <button className="btn btn--secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn btn--primary" disabled={!newName || !newUrl} onClick={handleAddSource}>
                Add & Parse
              </button>
            </div>
          </div>
        )}

        {/* ─── EPG Source List ─── */}
        {sources.length === 0 && (
          <div className="text-center py-16 text-[#9AA0A6]">
            <p className="text-[22px] font-semibold mb-2">No EPG sources yet</p>
            <p className="text-[16px]">Add an XMLTV URL to get started.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {sources.map((src) => (
            <div key={src.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[18px] font-bold text-[#1A1A1A]">{src.name}</h3>
                  <p className="text-[14px] text-[#5F6368] break-all">{src.url}</p>
                </div>
                <span className={`text-[13px] font-medium px-3 py-1 rounded-full ${
                  src.status === "loaded" ? "bg-[#EFF6FF] text-[#2563EB]" :
                  src.status === "loading" ? "bg-[#FEF3C7] text-[#D97706]" :
                  "bg-[#FEE2E2] text-[#DC2626]"
                }`}>
                  {src.status === "loaded" ? "Loaded" : src.status === "loading" ? "Loading..." : "Error"}
                </span>
              </div>

              {/* Channel preview */}
              {src.channels && src.channels.length > 0 && (
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#5F6368] mb-2">
                    {src.channelCount} channels · {src.entryCount} EPG entries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {src.channels.slice(0, 8).map((ch) => (
                      <span key={ch.tvgId} className="text-[13px] bg-[#F8F9FA] px-3 py-1.5 rounded-full text-[#5F6368]">
                        {ch.displayName}
                      </span>
                    ))}
                    {src.channels.length > 8 && (
                      <span className="text-[13px] text-[#9AA0A6] px-2 py-1.5">
                        +{src.channels.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {src.status === "loading" && (
                <div className="flex items-center gap-2 text-[13px] text-[#D97706]">
                  <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                  Parsing XMLTV data...
                </div>
              )}

              {/* Actions */}
              {src.status === "loaded" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#E5E7EB]">
                  <button
                    className="btn btn--primary"
                    style={{ minHeight: "44px", padding: "0 16px", fontSize: "14px" }}
                    onClick={() => openMapper(src.id)}
                    aria-label={`Match channels for ${src.name}`}
                  >
                    Match Channels
                  </button>
                  <button
                    className="btn btn--secondary"
                    style={{ minHeight: "44px", padding: "0 16px", fontSize: "14px" }}
                    onClick={() => {
                      showToast(`📺 ${src.name} EPG preview loaded`);
                    }}
                    aria-label="Preview EPG data"
                  >
                    Preview
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Epg Mapper Modal */}
      <EpgMapperModal
        open={mapperOpen}
        onClose={() => setMapperOpen(false)}
        sourceId={selectedSourceId || ""}
        playlistChannels={mockMasterChannels}
        onToast={showToast}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white px-6 py-4 rounded-[12px] text-[18px] shadow-lg animate-slide-up" role="alert">
          {toast}
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
