"use client";

import { useState } from "react";
import { ArrowRight, Bike, CheckCircle2, KeyRound, Lock, ShieldCheck, Sparkles, User, UserCheck } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";

export type AuthUser = {
  name: string;
  role: "guest" | "commuter";
  email?: string;
};

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const placeholderEmail = "commuter@namma-roads.in";
  const placeholderPass = "smoothroads2026";

  function handleGuestLogin() {
    const guestUser: AuthUser = {
      name: "Guest Rider",
      role: "guest",
    };
    onLoginSuccess(guestUser);
  }

  function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    const effectiveEmail = email.trim() || placeholderEmail;
    const effectivePass = password.trim() || placeholderPass;

    if (effectivePass.length < 4) {
      setLoginError("Please enter a valid password (or use placeholder credentials).");
      return;
    }

    const authUser: AuthUser = {
      name: effectiveEmail.split("@")[0] || "Commuter",
      role: "commuter",
      email: effectiveEmail,
    };
    onLoginSuccess(authUser);
  }

  function handleFillPlaceholder() {
    setEmail(placeholderEmail);
    setPassword(placeholderPass);
    setLoginError("");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background text-on-surface overflow-hidden">
      {/* Background Cyber Mesh Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />

      {/* Top Bar with Stitch Theme Switcher */}
      <div className="absolute top-5 right-6 z-20">
        <ThemeSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-surface-container-low/90 backdrop-blur-3xl border border-outline-variant/40 shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex flex-col gap-5">
        {/* Header Section */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container shadow-[0_0_24px_rgba(48,209,88,0.45)] flex items-center justify-center mb-3">
            <Bike size={28} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-kpi text-2xl font-bold tracking-tight text-on-surface">
              Namma Smooth Roads
            </h1>
            <span className="font-label-eyebrow text-label-eyebrow uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest">
              PRO
            </span>
          </div>
          <p className="font-body-subtle text-body-subtle text-outline mt-1 max-w-sm">
            Bengaluru Urban & Rural Districts Two-Wheeler Route & Surface Intelligence
          </p>
        </div>

        {/* Mandated Guest Access Banner */}
        <div className="p-5 rounded-2xl bg-surface-container/70 border border-primary/30 shadow-[0_4px_20px_rgba(48,209,88,0.12)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-eyebrow text-label-eyebrow uppercase px-2 py-0.5 rounded-full bg-primary-container/20 text-primary flex items-center gap-1">
              <Sparkles size={11} />
              <span>Instant Access</span>
            </span>
            <span className="font-caption-meta text-caption-meta text-outline flex items-center gap-1 font-code-telemetry">
              <ShieldCheck size={13} className="text-primary" />
              <span>100% Anonymous</span>
            </span>
          </div>

          <div>
            <h2 className="font-title-section text-title-section text-on-surface font-semibold">
              Explore as Guest Rider
            </h2>
            <p className="font-body-subtle text-body-subtle text-outline mt-1">
              No registration or phone number required. Instantly compare smoothest routes across 77 locations, pin road reports, and contribute ride signals.
            </p>
          </div>

          <button
            type="button"
            className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-ui-action text-ui-action flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(48,209,88,0.35)] hover:brightness-105 active:scale-[0.98] transition-all"
            onClick={handleGuestLogin}
          >
            <span>Continue as Guest User</span>
            <ArrowRight size={17} />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center text-center text-outline text-[11px] font-semibold tracking-wider uppercase my-0">
          <div className="flex-1 border-b border-outline-variant/40" />
          <span className="px-3">or credentials preview</span>
          <div className="flex-1 border-b border-outline-variant/40" />
        </div>

        {/* Placeholder Login Form */}
        <form className="flex flex-col gap-3.5" onSubmit={handleCredentialSubmit}>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/30 text-xs text-outline">
            <KeyRound size={15} className="text-tertiary flex-shrink-0 mt-0.5" />
            <span>
              Credentials mode is in preview. You can use demo credentials or click Autofill below.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-eyebrow text-label-eyebrow text-outline uppercase">
              Email or Rider ID
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-container/80 border border-outline-variant/50 focus-within:border-primary transition-all">
              <User size={15} className="text-outline flex-shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent border-0 p-0 text-on-surface font-body-medium text-body-medium placeholder:text-outline outline-none"
                placeholder={`e.g. ${placeholderEmail}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-eyebrow text-label-eyebrow text-outline uppercase">
              Password
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-container/80 border border-outline-variant/50 focus-within:border-primary transition-all">
              <Lock size={15} className="text-outline flex-shrink-0" />
              <input
                type="password"
                className="w-full bg-transparent border-0 p-0 text-on-surface font-body-medium text-body-medium placeholder:text-outline outline-none"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {loginError && (
            <div className="p-2.5 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs font-medium">
              {loginError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="submit"
              className="py-2.5 px-3 rounded-xl border border-primary/40 bg-primary-container/15 text-primary hover:bg-primary-container/25 font-ui-action text-ui-action flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck size={15} />
              <span>Sign In (Demo)</span>
            </button>
            <button
              type="button"
              className="py-2.5 px-3 rounded-xl border border-outline-variant/60 bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-ui-action text-ui-action transition-all"
              onClick={handleFillPlaceholder}
              title="Fill demo values"
            >
              Autofill Demo
            </button>
          </div>
        </form>

        {/* Footer Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-outline-variant/30 text-outline font-code-telemetry text-[11px]">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-primary" /> OpenStreetMap & OSRM
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-primary" /> Bengaluru Urban & Rural
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-primary" /> Foreground Sensing
          </span>
        </div>
      </div>
    </div>
  );
}
