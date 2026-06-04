"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "language" | "ai-prefs" | "ready";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
];

const REGIONS = [
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
  { code: "CA", label: "🇨🇦 Canada" },
  { code: "AU", label: "🇦🇺 Australia" },
  { code: "IN", label: "🇮🇳 India" },
  { code: "IE", label: "🇮🇪 Ireland" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("US");
  const [aiAutoApply, setAiAutoApply] = useState(true);

  const handleLanguageNext = () => {
    if (language && region) setStep("ai-prefs");
  };

  const handleAiNext = () => {
    setStep("ready");
    // In production: POST /api/v1/onboarding/preferences
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[480px]">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {(["language", "ai-prefs", "ready"] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-8 bg-[#2563EB]"
                  : s === "language" || s === "ai-prefs"
                  ? "w-2 bg-[#2563EB]"
                  : "w-2 bg-[#E5E7EB]"
              }`}
            />
          ))}
        </div>

        {/* ─── Step 1: Language & Region ─── */}
        {step === "language" && (
          <section>
            <h1 className="text-[32px] font-bold text-[#1A1A1A] mb-2">
              Let&apos;s set up your EPG
            </h1>
            <p className="text-[16px] text-[#5F6368] mb-6">
              Language = channel names and EPG descriptions.
              Region = which channels appear first.
            </p>

            <label className="text-[14px] font-semibold text-[#1A1A1A] block mb-2">
              What language do you prefer?
            </label>
            <div className="flex flex-wrap gap-2 mb-6">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`min-h-[56px] px-6 rounded-[12px] text-[16px] font-medium border-2 transition-all ${
                    language === l.code
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E5E7EB] bg-[#F8F9FA] text-[#1A1A1A]"
                  }`}
                  aria-pressed={language === l.code}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <label className="text-[14px] font-semibold text-[#1A1A1A] block mb-2">
              Where are you located?
            </label>
            <div className="flex flex-wrap gap-2 mb-8">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setRegion(r.code)}
                  className={`min-h-[56px] px-6 rounded-[12px] text-[16px] font-medium border-2 transition-all ${
                    region === r.code
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E5E7EB] bg-[#F8F9FA] text-[#1A1A1A]"
                  }`}
                  aria-pressed={region === r.code}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleLanguageNext}
              className="btn btn--primary btn--full"
              aria-label="Continue"
            >
              Continue
            </button>
          </section>
        )}

        {/* ─── Step 2: AI Preferences ─── */}
        {step === "ai-prefs" && (
          <section>
            <h1 className="text-[32px] font-bold text-[#1A1A1A] mb-2">
              AI Assistance
            </h1>
            <p className="text-[16px] text-[#5F6368] mb-8">
              EasyEPG can automatically apply channel suggestions when it&apos;s
              confident enough. You can change this later.
            </p>

            <div className="card p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[18px] font-semibold text-[#1A1A1A]">
                    🤖 Auto-apply suggestions
                  </p>
                  <p className="text-[14px] text-[#5F6368] mt-1">
                    Above 75% confidence
                  </p>
                </div>
                <button
                  onClick={() => setAiAutoApply(!aiAutoApply)}
                  className={`relative w-[60px] h-[32px] rounded-full transition-colors ${
                    aiAutoApply ? "bg-[#2563EB]" : "bg-[#E5E7EB]"
                  }`}
                  role="switch"
                  aria-checked={aiAutoApply}
                  aria-label="Auto-apply AI suggestions"
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[28px] h-[28px] rounded-full bg-white shadow transition-transform ${
                      aiAutoApply ? "translate-x-[28px]" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-[13px] text-[#9AA0A6] mt-4">
                Below-threshold suggestions will still appear for manual review.
              </p>
            </div>

            <button
              onClick={handleAiNext}
              className="btn btn--primary btn--full"
              aria-label="Let's go"
            >
              Let&apos;s go →
            </button>
          </section>
        )}

        {/* ─── Step 3: Ready ─── */}
        {step === "ready" && (
          <section className="text-center">
            <div className="text-[64px] mb-4">✅</div>
            <h1 className="text-[32px] font-bold text-[#1A1A1A] mb-2">
              You&apos;re all set!
            </h1>
            <p className="text-[18px] text-[#5F6368] mb-8">
              Taking you to your dashboard…
            </p>

            <button
              onClick={handleFinish}
              className="btn btn--primary btn--full"
              aria-label="Go to dashboard"
            >
              Go to Dashboard
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
