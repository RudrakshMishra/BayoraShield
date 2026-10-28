import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { ShieldCheck, AlertCircle, Clock, Loader2, KeyRound, User as UserIcon } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isSubmitting) return;

    setIsSubmitting(true);
    setLocalError(null);
    setIsRateLimited(false);

    try {
      await login(username, password);
      const target = from === "/login" || from === "/" ? "/topology" : from;
      navigate(target, { replace: true });
    } catch (err: any) {
      if (err.status === 429 || err.code === "RATE_LIMITED") {
        setIsRateLimited(true);
        setLocalError(err.message || "Too many failed login attempts. Please wait before trying again.");
      } else {
        setLocalError(err.message || "Invalid credentials");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setLocalError(null);
  };

  return (
    <div className="flex items-center justify-center min-h-[78vh] px-4 relative">
      {/* Outer ambient glow behind login card */}
      <div className="relative max-w-md w-full">
        <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-2xl opacity-75 -z-10" />

        <div className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-[1.75rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] space-y-6">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-pink-400/30 flex items-center justify-center mx-auto text-pink-300 shadow-[0_0_24px_rgba(244,114,182,0.25)]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="gradient-headline font-heading text-2xl font-bold tracking-tight">
              Sign in to Bayora Shield
            </h1>
            <p className="text-muted text-xs font-mono uppercase tracking-[0.18em]">
              Adversarial AI Safety • Security Console
            </p>
          </div>

          {/* Error / Rate Limit Alert */}
          {localError && (
            <div
              id="login-error-banner"
              role="alert"
              className={`p-3.5 rounded-xl border text-sm flex items-start gap-2.5 backdrop-blur-md ${
                isRateLimited
                  ? "bg-gold/15 border-gold/40 text-gold shadow-[0_0_16px_rgba(245,158,11,0.2)]"
                  : "bg-red/15 border-red/40 text-red shadow-[0_0_16px_rgba(244,63,94,0.2)]"
              }`}
            >
              {isRateLimited ? (
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-medium text-xs leading-relaxed">{localError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <label
                htmlFor="username-input"
                className="block text-xs font-mono text-muted uppercase tracking-wider"
              >
                Operator ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  name="username"
                  type="text"
                  autoComplete="off"
                  required
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. operator"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-text text-sm placeholder-muted/50 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/40 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password-input"
                className="block text-xs font-mono text-muted uppercase tracking-wider"
              >
                Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  autoComplete="off"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-text text-sm placeholder-muted/50 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/40 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(244,114,182,0.35)] hover:shadow-[0_0_36px_rgba(244,114,182,0.5)] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <span>Authenticate Session</span>
              )}
            </button>
          </form>

          {/* Demo Fast-Switch Buttons */}
          <div className="pt-4 border-t border-white/[0.1] space-y-2.5">
            <div className="text-[11px] font-mono text-muted text-center uppercase tracking-wider">
              Quick Select Demo Credentials
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => fillCredentials("admin", "admin123")}
                className="px-2.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-gold/30 rounded-xl text-[11px] font-mono text-gold transition-all text-center shadow-sm"
              >
                admin
              </button>
              <button
                type="button"
                id="demo-operator-btn"
                onClick={() => fillCredentials("operator", "operator123")}
                className="px-2.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-blue/30 rounded-xl text-[11px] font-mono text-blue transition-all text-center shadow-sm"
              >
                operator
              </button>
              <button
                type="button"
                id="demo-viewer-btn"
                onClick={() => fillCredentials("viewer", "viewer123")}
                className="px-2.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 rounded-xl text-[11px] font-mono text-muted hover:text-white transition-all text-center shadow-sm"
              >
                viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
