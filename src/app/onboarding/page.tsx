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

  const handleAiNext = async () => {
    try {
      const token = sessionStorage.getItem("easyepg_token");
      if (token) {
        await fetch("/api/onboarding/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            language, region,
            aiThreshold: 0.75, aiAutoApply,
          }),
        });
      }
    } catch { /* silent */ }
    setStep("ready");
  };

  const handleFinish = () => router.push("/dashboard");

  return (
    <main className="onb">
      {/* ─── Step indicator ─── */}
      <div className="onb__steps">
        {(["language", "ai-prefs", "ready"] as Step[]).map((s) => (
          <div key={s} className={`onb__step ${step === s ? "onb__step--active" : ""}`} />
        ))}
      </div>

      {/* ─── Step 1: Language & Region ─── */}
      {step === "language" && (
        <section className="onb__content">
          <h1 className="onb__title">Let&apos;s set up your EPG</h1>
          <p className="onb__sub">
            Language = channel names and EPG descriptions.
            Region = which channels appear first.
          </p>

          <p className="onb__label">What language do you prefer?</p>
          <div className="onb__grid">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`onb__pill ${language === l.code ? "onb__pill--active" : ""}`}
                aria-pressed={language === l.code}
              >
                {l.label}
              </button>
            ))}
          </div>

          <p className="onb__label">Where are you located?</p>
          <div className="onb__grid">
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => setRegion(r.code)}
                className={`onb__pill ${region === r.code ? "onb__pill--active" : ""}`}
                aria-pressed={region === r.code}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button onClick={handleLanguageNext} className="onb__btn onb__btn--primary onb__btn--full">
            Continue
          </button>
        </section>
      )}

      {/* ─── Step 2: AI Preferences ─── */}
      {step === "ai-prefs" && (
        <section className="onb__content">
          <h1 className="onb__title">AI Assistance</h1>
          <p className="onb__sub">
            EasyEPG can automatically apply channel suggestions when it&apos;s
            confident enough. You can change this later.
          </p>

          <div className="onb__card">
            <div className="onb__toggle-row">
              <div>
                <p className="onb__toggle-title">🤖 Auto-apply suggestions</p>
                <p className="onb__toggle-sub">Above 75% confidence</p>
              </div>
              <button
                onClick={() => setAiAutoApply(!aiAutoApply)}
                className={`onb__switch ${aiAutoApply ? "onb__switch--on" : ""}`}
                role="switch"
                aria-checked={aiAutoApply}
                aria-label="Auto-apply AI suggestions"
              >
                <span className="onb__switch-knob" />
              </button>
            </div>
            <p className="onb__hint">
              Below-threshold suggestions will still appear for manual review.
            </p>
          </div>

          <button onClick={handleAiNext} className="onb__btn onb__btn--primary onb__btn--full">
            Let&apos;s go →
          </button>
        </section>
      )}

      {/* ─── Step 3: Ready ─── */}
      {step === "ready" && (
        <section className="onb__content onb__content--center">
          <div className="onb__check">✅</div>
          <h1 className="onb__title">You&apos;re all set!</h1>
          <p className="onb__sub">Taking you to your dashboard…</p>
          <button onClick={handleFinish} className="onb__btn onb__btn--primary onb__btn--full">
            Go to Dashboard
          </button>
        </section>
      )}

      {/* ─── Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .onb {
          background: #0C0C0D;
          min-height: 100vh;
          color: #E4E4E7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 40px 24px;
        }
        .onb__steps { display: flex; gap: 8px; margin-bottom: 40px; }
        .onb__step {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          transition: all 300ms ease;
        }
        .onb__step--active {
          width: 36px; border-radius: 4px;
          background: #D2FF00;
        }
        .onb__content {
          width: 100%; max-width: 520px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 16px;
        }
        .onb__content--center { align-items: center; text-align: center; }
        .onb__title { font-size: 28px; font-weight: 700; color: #FFFFFF; margin: 0; }
        .onb__sub { font-size: 15px; color: rgba(255,255,255,0.35); margin: 0; line-height: 1.5; }
        .onb__label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.5); margin: 8px 0 0; }
        .onb__grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .onb__pill {
          min-height: 48px; padding: 0 20px; border-radius: 12px;
          font-size: 15px; font-weight: 500; border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5);
          cursor: pointer; transition: all 150ms ease;
        }
        .onb__pill:hover { border-color: rgba(255,255,255,0.15); color: #E4E4E7; }
        .onb__pill--active {
          border-color: #D2FF00; background: rgba(210,255,0,0.08);
          color: #D2FF00;
        }
        .onb__btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 52px; padding: 0 24px; border-radius: 14px;
          font-size: 17px; font-weight: 600; border: none; cursor: pointer;
          text-decoration: none; transition: all 150ms ease;
          margin-top: 8px; line-height: 1;
        }
        .onb__btn:active { transform: scale(0.97); }
        .onb__btn--primary { background: #D2FF00; color: #0C0C0D; }
        .onb__btn--primary:hover { background: #BCE600; }
        .onb__btn--full { width: 100%; }
        .onb__card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px;
        }
        .onb__toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .onb__toggle-title { font-size: 16px; font-weight: 600; color: #E4E4E7; margin: 0; }
        .onb__toggle-sub { font-size: 13px; color: rgba(255,255,255,0.3); margin: 2px 0 0; }
        .onb__switch {
          flex-shrink: 0; width: 52px; height: 28px; border-radius: 14px;
          border: none; background: rgba(255,255,255,0.1); cursor: pointer;
          position: relative; transition: background 200ms ease; padding: 0;
        }
        .onb__switch--on { background: #D2FF00; }
        .onb__switch-knob {
          position: absolute; top: 3px; left: 3px;
          width: 22px; height: 22px; border-radius: 50%;
          background: #0C0C0D; transition: transform 200ms ease;
        }
        .onb__switch--on .onb__switch-knob { transform: translateX(24px); background: #0C0C0D; }
        .onb__hint { font-size: 13px; color: rgba(255,255,255,0.25); margin: 12px 0 0; }
        .onb__check { font-size: 56px; line-height: 1; margin-bottom: 8px; }
      ` }} />
    </main>
  );
}
