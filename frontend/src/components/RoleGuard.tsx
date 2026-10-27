import React, { useEffect } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { ShieldX, Loader2 } from "lucide-react";

interface RequireRoleProps {
  children: React.ReactNode;
  minRole?: "viewer" | "operator" | "admin";
}

const roleLevels: Record<string, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export const RequireRole: React.FC<RequireRoleProps> = ({
  children,
  minRole = "viewer",
}) => {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Attempt to load session if not already loaded
    if (!isAuthenticated && isLoading) {
      fetchMe();
    }
  }, [isAuthenticated, isLoading, fetchMe]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-muted text-sm font-mono">Verifying authorization token...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userLevel = roleLevels[user.role] || 0;
  const requiredLevel = roleLevels[minRole] || 1;

  if (userLevel < requiredLevel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="bg-surface border border-red/30 rounded-card p-8 max-w-lg w-full text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-red/10 border border-red/40 flex items-center justify-center mx-auto text-red">
            <ShieldX className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-text">Access Denied (403)</h2>
            <p className="text-muted text-sm mt-1">
              Your account role <span className="font-mono text-gold font-semibold uppercase">{user.role}</span> does not have sufficient clearance to access this screen.
            </p>
            <p className="text-xs text-muted/70 mt-2 font-mono">
              Requires minimum role: <span className="uppercase text-red font-semibold">{minRole}</span>
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-surface-2 hover:bg-surface-2/80 text-text rounded text-sm font-medium border border-white/10 transition-colors"
            >
              Return to Live Topology
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
