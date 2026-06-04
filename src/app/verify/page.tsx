"use client";

import { Suspense, useState, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { login } = useAuth();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code. Try again.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      login(data.token, data.user);
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[22px] font-bold mb-4">No email provided</h1>
          <button
            className="btn btn--primary"
            onClick={() => router.push("/")}
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[440px] text-center">
        <h1 className="text-[32px] font-bold text-[#1A1A1A] mb-2">
          Check your email
        </h1>
        <p className="text-[18px] text-[#5F6368] mb-2">
          We sent a 6-digit code to
        </p>
        <p className="text-[18px] font-semibold text-[#1A1A1A] mb-8">
          {email}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 justify-center mb-8">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1} of 6`}
                className="w-[52px] h-[64px] text-[28px] font-bold text-center rounded-[12px] border-2 border-[#E5E7EB] bg-white text-[#1A1A1A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-[14px] text-[#DC2626] mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.join("").length !== 6}
            className="btn btn--primary btn--full"
            aria-label="Verify code"
          >
            {loading ? "Verifying..." : "Sign in"}
          </button>
        </form>

        <p className="text-[14px] text-[#9AA0A6] mt-6">
          The code expires in 15 minutes.
        </p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <p className="text-[18px] text-[#5F6368]">Loading...</p>
      </main>
    }>
      <VerifyForm />
    </Suspense>
  );
}
