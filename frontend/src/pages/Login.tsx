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
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.status === 429 || err.code === "RATE_LIMITED") {
        setIsRateLimited(true);
        setLocalError(err.message || "Too many failed login attempts. Please wait before trying again.");
      } else {
        // Generic failure message (§5.1, §8): never reveal whether username or password was wrong
        setLocalError("Invalid credentials");
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
    <div className="flex items-center justify-center min-h-[75vh] px-4">
      <div className="bg-surface border border-white/10 rounded-card p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center mx-auto text-gold shadow-lg shadow-gold/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text tracking-wide">
            Sign in to BayoraShield
          </h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider">
            Adversarial AI Safety • Security Console
          </p>
        </div>

        {/* Error / Rate Limit Alert */}
        {localError && (
          <div
            id="login-error-banner"
            role="alert"
            className={`p-3.5 rounded-lg border text-sm flex items-start gap-2.5 ${
              isRateLimited
                ? "bg-gold/10 border-gold/40 text-gold"
                : "bg-red/10 border-red/40 text-red"
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
              className="block text-xs font-medium text-muted uppercase tracking-wider"
            >
              Operator ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
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
                className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-white/10 rounded-lg text-text text-sm placeholder-muted/60 focus:outline-none focus:border-blue transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password-input"
              className="block text-xs font-medium text-muted uppercase tracking-wider"
            >
              Passphrase
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
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
                className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-white/10 rounded-lg text-text text-sm placeholder-muted/60 focus:outline-none focus:border-blue transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isSubmitting || !username || !password}
            className="w-full py-2.5 px-4 bg-blue hover:bg-blue/90 disabled:bg-blue/40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue/20"
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
        <div className="pt-3 border-t border-white/[0.08] space-y-2">
          <div className="text-[11px] font-mono text-muted text-center uppercase tracking-wider">
            Quick Select Demo Credentials
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="demo-admin-btn"
              onClick={() => fillCredentials("admin", "admin123")}
              className="px-2 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-white/10 rounded text-[11px] font-mono text-gold transition-colors text-center"
            >
              admin
            </button>
            <button
              type="button"
              id="demo-operator-btn"
              onClick={() => fillCredentials("operator", "operator123")}
              className="px-2 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-white/10 rounded text-[11px] font-mono text-blue transition-colors text-center"
            >
              operator
            </button>
            <button
              type="button"
              id="demo-viewer-btn"
              onClick={() => fillCredentials("viewer", "viewer123")}
              className="px-2 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-white/10 rounded text-[11px] font-mono text-muted hover:text-text transition-colors text-center"
            >
              viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
