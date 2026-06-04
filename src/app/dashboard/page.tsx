"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [hasPlaylist] = useState(false);

  return (
    <main className="page-container">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-[22px] font-bold text-[#1A1A1A]">easyepg</span>
        <div className="flex gap-3">
          <Link href="/" className="btn btn--ghost" aria-label="Home">
            Home
          </Link>
          <button className="btn btn--ghost" aria-label="Settings" disabled>
            ⚙️
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="card p-8 mb-8 text-center">
        <p className="text-[18px] text-[#5F6368] mb-1">
          Welcome back!
        </p>
        <p className="text-[14px] text-[#9AA0A6] mb-6">
          dazzy@email.com
        </p>

        {!hasPlaylist ? (
          <>
            <p className="text-[16px] text-[#5F6368] mb-6">
              You don&apos;t have a playlist yet. It takes one tap.
            </p>
            <Link
              href="/playlist"
              className="btn btn--primary btn--full"
              aria-label="Create My Playlist"
            >
              Create My Playlist
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/playlist"
              className="btn btn--primary btn--full mb-3"
              aria-label="Edit My Playlist"
            >
              Edit My Playlist →
            </Link>
            <button className="btn btn--ai btn--full" aria-label="Copy playlist link">
              🔗 Copy playlist link
            </button>
          </>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="text-[28px] font-bold text-[#1A1A1A]">45</p>
          <p className="text-[14px] text-[#5F6368]">channels in playlist</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[28px] font-bold text-[#1A1A1A]">95%</p>
          <p className="text-[14px] text-[#5F6368]">EPG coverage</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[28px] font-bold text-[#D97706]">⚡ 12</p>
          <p className="text-[14px] text-[#5F6368]">AI suggestions</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[28px] font-bold text-[#5F6368]">🌐</p>
          <p className="text-[14px] text-[#5F6368]">domain not set</p>
        </div>
      </div>
    </main>
  );
}
