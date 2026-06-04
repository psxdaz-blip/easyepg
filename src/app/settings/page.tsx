"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<"idle" | "polling" | "verified" | "failed">("idle");
  const [copied, setCopied] = useState(false);

  const cnameLine = domain
    ? `${domain}  CNAME  custom.easyepg.tv`
    : "yourdomain.com  CNAME  custom.easyepg.tv";

  const handleCopyCname = () => {
    navigator.clipboard.writeText(cnameLine).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleVerify = () => {
    if (!domain) return;
    setStatus("polling");
    // Simulate polling — in production calls Worker endpoint
    setTimeout(() => {
      // Mock: 40% chance of success after 3s
      if (Math.random() > 0.6) {
        setStatus("verified");
      } else {
        setStatus("polling");
        // Retry after 3 more seconds
        setTimeout(() => setStatus("verified"), 3000);
      }
    }, 3000);
  };

  return (
    <main className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="btn btn--ghost" aria-label="Back">
          ← Back
        </Link>
        <h1 className="text-[32px] font-bold text-[#1A1A1A] m-0">
          Settings
        </h1>
      </div>

      {/* ─── Branding & Domain Card ─── */}
      <div className="card p-6 sm:p-8 mb-6">
        <h2 className="text-[22px] font-bold text-[#1A1A1A] mb-6">
          🎨 Branding & Domain
        </h2>

        {/* Default playlist link */}
        <p className="text-[14px] font-semibold text-[#5F6368] mb-1">
          Your playlist link
        </p>
        <div className="flex items-center gap-3 mb-6">
          <code className="flex-1 min-h-[56px] flex items-center px-4 rounded-[12px] bg-[#F8F9FA] border border-[#E5E7EB] text-[16px] text-[#1A1A1A] overflow-x-auto">
            https://demo.easyepg.tv/playlist.m3u
          </code>
          <button
            className="btn btn--secondary min-w-[56px]"
            onClick={() => {
              navigator.clipboard.writeText("https://demo.easyepg.tv/playlist.m3u");
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            aria-label="Copy playlist link"
          >
            {copied ? "✅" : "Copy"}
          </button>
        </div>

        <hr className="border-[#E5E7EB] mb-6" />

        {/* Custom domain */}
        <p className="text-[14px] font-semibold text-[#5F6368] mb-1">
          Your own domain
        </p>
        <p className="text-[14px] text-[#9AA0A6] mb-4">
          Use your own domain name for your playlist URL.
        </p>

        <input
          type="text"
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value);
            setStatus("idle");
          }}
          placeholder="tv.yourname.com"
          aria-label="Enter your custom domain"
          className="w-full min-h-[56px] px-5 rounded-[12px] border-2 border-[#E5E7EB] text-[18px] text-[#1A1A1A] bg-white placeholder:text-[#9AA0A6] outline-none focus:border-[#2563EB] mb-4"
        />

        {/* CNAME instruction */}
        <p className="text-[14px] font-semibold text-[#5F6368] mb-2">
          1. Add this DNS record:
        </p>
        <div className="flex items-center gap-3 mb-6">
          <code className="flex-1 min-h-[56px] flex items-center px-4 rounded-[12px] bg-[#1A1A1A] text-[#FFFFFF] text-[15px] font-mono overflow-x-auto select-all">
            {cnameLine}
          </code>
          <button
            className="btn btn--secondary min-w-[56px]"
            onClick={handleCopyCname}
            aria-label="Copy CNAME line"
          >
            {copied ? "✅" : "Copy"}
          </button>
        </div>

        {/* Verify button */}
        <p className="text-[14px] font-semibold text-[#5F6368] mb-2">
          2. Verify your domain:
        </p>
        <button
          className="btn btn--primary btn--full mb-4"
          onClick={handleVerify}
          disabled={!domain || status === "polling" || status === "verified"}
          aria-label={`Verify domain ${domain || ""}`}
        >
          {status === "idle" && "Verify domain"}
          {status === "polling" && "⏳ Checking DNS..."}
          {status === "verified" && "✅ Domain verified!"}
          {status === "failed" && "❌ Verification failed — try again"}
        </button>

        {/* Status */}
        {status === "polling" && (
          <div className="flex items-center gap-2 text-[14px] text-[#D97706]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
            Waiting for DNS… Last checked: a few seconds ago
          </div>
        )}
        {status === "verified" && (
          <div className="flex items-center gap-2 text-[14px] text-[#16A34A]">
            <span>✅</span>
            <span>{domain} verified. SSL active.</span>
          </div>
        )}
      </div>

      {/* ─── AI Settings Card ─── */}
      <div className="card p-6 sm:p-8 mb-6">
        <h2 className="text-[22px] font-bold text-[#1A1A1A] mb-4">
          🤖 AI Settings
        </h2>
        <p className="text-[16px] text-[#5F6368] mb-4">
          Confidence threshold for auto-applying AI suggestions.
          Current: <strong>75%</strong>
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-[#5F6368]">50%</span>
          <input
            type="range"
            min="50"
            max="99"
            defaultValue={75}
            className="flex-1 h-2 rounded-full accent-[#2563EB]"
            aria-label="AI confidence threshold"
          />
          <span className="text-[14px] text-[#5F6368]">99%</span>
        </div>
        <p className="text-[13px] text-[#9AA0A6] mt-3">
          Suggestions above this threshold are applied automatically.
          Below this threshold, they wait for your review.
        </p>
      </div>
    </main>
  );
}
