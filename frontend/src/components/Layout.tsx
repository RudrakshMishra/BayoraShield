import React, { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Activity,
  Layers,
  GitCompare,
  ScrollText,
  BarChart3,
  PlayCircle,
  FileCheck2,
  Lock,
  LogIn,
  LogOut,
  Cpu,
  Terminal,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../state/authStore";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "viewer" | "operator" | "admin";
}

const navItems: NavItem[] = [
  { name: "Live Topology", path: "/", icon: Activity, minRole: "viewer" },
  { name: "Event Feed", path: "/events", icon: Layers, minRole: "viewer" },
  { name: "Breach Wall", path: "/breach", icon: ShieldAlert, minRole: "viewer" },
  { name: "Baseline vs Shield", path: "/compare", icon: GitCompare, minRole: "viewer" },
  { name: "Ledger Explorer", path: "/ledger", icon: ScrollText, minRole: "viewer" },
  { name: "Results & Metrics", path: "/results", icon: BarChart3, minRole: "viewer" },
  { name: "Run Control", path: "/runs", icon: PlayCircle, minRole: "operator" },
  { name: "Threat Model", path: "/threat-model", icon: Lock, minRole: "viewer" },
  { name: "Audit Status", path: "/audit", icon: FileCheck2, minRole: "viewer" },
  { name: "Vaultra Hero", path: "/vaultra", icon: Sparkles, minRole: "viewer" },
];

const roleLevels: Record<string, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";
  const apiMode = import.meta.env.VITE_API_MODE || "mock";

  const { user, isAuthenticated, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userLevel = user ? roleLevels[user.role] || 0 : 0;

  return (
    <div className="min-h-screen flex bg-bg text-text">
      {/* Left Sidebar */}
      {!isLoginPage && (
        <aside
          id="app-sidebar"
          className="w-64 flex-shrink-0 border-r border-white/[0.08] bg-surface/80 backdrop-blur flex flex-col justify-between p-4"
        >
          <div className="space-y-6">
            {/* Branding Header */}
            <div className="flex items-center space-x-3 px-2 py-1">
              <div className="w-9 h-9 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
                <Cpu className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="font-heading font-bold text-base tracking-wide text-text flex items-center gap-1.5">
                  BayoraShield
                </div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted">
                  Track 04 • Isolation
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const reqLevel = roleLevels[item.minRole || "viewer"] || 1;
                // Conveniently show only accessible nav links if authenticated
                const isPermitted = !user || userLevel >= reqLevel;

                if (!isPermitted) return null;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    id={`nav-${item.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border",
                        isActive
                          ? "bg-surface-2 text-text border-white/10 shadow-sm"
                          : "text-muted hover:text-text hover:bg-surface-2/50 border-transparent"
                      )
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer in Sidebar */}
          <div className="border-t border-white/[0.08] pt-4 px-2 space-y-2">
            <div className="text-[11px] font-mono text-muted flex items-center justify-between">
              <span>SANDBOX STATUS</span>
              <span className="text-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                SECURE
              </span>
            </div>
            <div className="text-[10px] text-muted/80">
              Payload-free metadata inspection console
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header
          id="app-topbar"
          className="h-14 border-b border-white/[0.08] bg-surface/50 backdrop-blur px-6 flex items-center justify-between flex-shrink-0"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gold" />
              <span className="text-xs font-mono text-muted uppercase">Engine:</span>
              <span className="text-xs font-mono text-text">Policy Broker v1.4.0</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <span>Run:</span>
              <span className="text-gold font-semibold">IDLE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Vaultra Hero Showcase */}
            <NavLink
              to="/vaultra"
              id="vaultra-hero-topbar-link"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 hover:from-pink-500/20 hover:to-blue-500/20 text-pink-300 border-pink-500/30 transition-all shadow-sm"
              title="Explore Vaultra Crypto Finance Hero"
            >
              <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
              <span>Vaultra</span>
            </NavLink>

            {/* Mode Badge */}
            <div
              id="mode-badge"
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border",
                apiMode === "mock"
                  ? "bg-gold/10 text-gold border-gold/30"
                  : "bg-green/10 text-green border-green/30"
              )}
            >
              {apiMode.toUpperCase()} MODE
            </div>

            {/* User Session Bar */}
            {isLoginPage ? (
              <NavLink
                to="/"
                className="text-xs text-muted hover:text-text font-medium flex items-center gap-1"
              >
                Back to Dashboard
              </NavLink>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div
                  id="user-profile-badge"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-2 border border-white/10 text-xs font-mono"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue" />
                  <span className="text-text font-semibold">{user.username}</span>
                  <span
                    id="user-role-badge"
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] font-bold uppercase",
                      user.role === "admin"
                        ? "bg-gold/20 text-gold border border-gold/40"
                        : user.role === "operator"
                        ? "bg-blue/20 text-blue border border-blue/40"
                        : "bg-muted/20 text-muted border border-muted/40"
                    )}
                  >
                    {user.role}
                  </span>
                </div>

                <button
                  id="logout-button"
                  onClick={handleLogout}
                  title="Sign out and close SSE streams"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-red/20 hover:text-red hover:border-red/40 text-xs font-medium text-muted border border-white/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                id="login-nav-link"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-2/80 text-xs font-medium text-text border border-white/10 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-muted" />
                <span>Sign In</span>
              </NavLink>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
