"use client";

import { useState } from "react";
import { ArrowRight, Bike, CheckCircle2, KeyRound, Lock, ShieldCheck, Sparkles, User, UserCheck } from "lucide-react";

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

    // If empty, allow using the placeholder credentials
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
    <div className="login-page-container">
      <div className="login-card-backdrop">
        <div className="login-header-section">
          <div className="login-brand-logo">
            <Bike size={32} />
          </div>
          <h1 className="login-app-title">Namma Smooth Roads</h1>
          <p className="login-app-tagline">
            Bengaluru Urban & Rural Districts Two-Wheeler Route & Surface Intelligence
          </p>
        </div>

        {/* Mandated Guest Access Banner */}
        <div className="guest-mandate-card">
          <div className="guest-badge-header">
            <span className="mandate-tag">
              <Sparkles size={12} /> Instant Access Mandate
            </span>
            <span className="anonymous-tag">
              <ShieldCheck size={12} /> 100% Anonymous
            </span>
          </div>
          <h2 className="guest-card-title">Explore as a Guest User</h2>
          <p className="guest-card-desc">
            No registration or personal data required. Instantly compare routes, search 100+ Bangalore localities & roads, submit condition reports, and detect bumps.
          </p>
          <button type="button" className="guest-primary-button" onClick={handleGuestLogin}>
            <span>Continue as Guest User</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="login-divider">
          <span>OR SIGN IN WITH CREDENTIALS</span>
        </div>

        {/* Placeholder Login Form */}
        <form className="credential-form" onSubmit={handleCredentialSubmit}>
          <div className="form-info-note">
            <KeyRound size={15} />
            <span>
              Credentials mode is currently in placeholder preview. You can use the placeholder values or click below to autofill.
            </span>
          </div>

          <div className="form-field-group">
            <label className="field-label">Email or Rider ID</label>
            <div className="field-input-box">
              <User size={16} />
              <input
                type="text"
                className="login-text-input"
                placeholder={`e.g. ${placeholderEmail}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label className="field-label">Password</label>
            <div className="field-input-box">
              <Lock size={16} />
              <input
                type="password"
                className="login-text-input"
                placeholder="e.g. ••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {loginError && <div className="login-error-msg">{loginError}</div>}

          <div className="login-button-row">
            <button type="submit" className="signin-submit-btn">
              <UserCheck size={16} />
              <span>Sign In (Placeholder)</span>
            </button>
            <button type="button" className="autofill-btn" onClick={handleFillPlaceholder} title="Fill demo values">
              Autofill Demo
            </button>
          </div>
        </form>

        <div className="login-footer-highlights">
          <div>
            <CheckCircle2 size={13} /> OpenStreetMap & OSRM
          </div>
          <div>
            <CheckCircle2 size={13} /> Bengaluru Urban & Rural
          </div>
          <div>
            <CheckCircle2 size={13} /> iPhone Motion Sensing
          </div>
        </div>
      </div>
    </div>
  );
}
