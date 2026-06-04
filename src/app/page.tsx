"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px] text-center">
        {/* Logo / Brand */}
        <h1 className="text-[32px] md:text-[36px] font-bold text-[#1A1A1A] leading-tight mb-3">
          Your TV channels,<br />all in one link.
        </h1>
        <p className="text-[18px] text-[#5F6368] mb-8 leading-relaxed">
          No setup, no cables — just a playlist that works everywhere.
        </p>

        {/* Magic Link Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Enter your email"
            required
            className="w-full min-h-[56px] px-6 rounded-[12px] border-2 border-[#E5E7EB] text-[18px] text-[#1A1A1A] bg-white placeholder:text-[#9AA0A6] outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/20 transition-colors"
          />
          <button
            type="submit"
            disabled={sent || loading}
            className="btn btn--primary btn--full"
            aria-label="Send me the magic link"
          >
            {loading ? "Sending..." : sent ? "✉️ Check your inbox" : "Get your magic link"}
          </button>
        </form>

        {error && (
          <p className="text-[14px] text-[#DC2626] mt-3">{error}</p>
        )}

        <p className="text-[14px] text-[#9AA0A6] mt-2">
          No password. No setup. Works in any IPTV app.
        </p>

        {/* Compatibility badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {["TiviMate", "IPTV Smarters", "VLC", "Plex", "Jellyfin"].map(
            (app) => (
              <span
                key={app}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F8F9FA] text-[14px] text-[#5F6368] font-medium"
              >
                <span className="text-[#16A34A]">✓</span> {app}
              </span>
            )
          )}
        </div>

        {/* Demo CTA */}
        <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
          <p className="text-[16px] text-[#5F6368] mb-4">
            Want to see it first?
          </p>
          <Link
            href="/dashboard"
            className="btn btn--ai"
            aria-label="View demo dashboard"
          >
            View demo →
          </Link>
        </div>
      </div>
    </main>
  );
}
