import React, { useEffect } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useAuthStore } from "./state/authStore";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/Login";
import { RequireRole } from "./components/RoleGuard";
import { TopologyPage } from "./pages/Topology";
import { EventsPage } from "./pages/Events";
import { LandingPage } from "./pages/LandingPage";
import {
  BreachPage,
  ComparePage,
  LedgerPage,
  ResultsPage,
  RunsPage,
  ThreatModelPage,
  AuditPage,
} from "./pages/Placeholders";

// Wrapper component that presents the 10-slide BayoraShield Landing Page as the public
// landing page before login, and Live Topology once authenticated.
const LandingOrTopology: React.FC = () => {
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && isLoading) {
      fetchMe();
    }
  }, [isAuthenticated, isLoading, fetchMe]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
        <p className="text-muted text-sm font-mono">Verifying authorization token...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <TopologyPage />;
  }

  return <LandingPage />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <LandingOrTopology />,
      },
      {
        path: "topology",
        element: (
          <RequireRole minRole="viewer">
            <TopologyPage />
          </RequireRole>
        ),
      },
      {
        path: "events",
        element: (
          <RequireRole minRole="viewer">
            <EventsPage />
          </RequireRole>
        ),
      },
      {
        path: "breach",
        element: (
          <RequireRole minRole="viewer">
            <BreachPage />
          </RequireRole>
        ),
      },
      {
        path: "compare",
        element: (
          <RequireRole minRole="viewer">
            <ComparePage />
          </RequireRole>
        ),
      },
      {
        path: "ledger",
        element: (
          <RequireRole minRole="viewer">
            <LedgerPage />
          </RequireRole>
        ),
      },
      {
        path: "results",
        element: (
          <RequireRole minRole="viewer">
            <ResultsPage />
          </RequireRole>
        ),
      },
      {
        path: "runs",
        element: (
          <RequireRole minRole="operator">
            <RunsPage />
          </RequireRole>
        ),
      },
      {
        path: "threat-model",
        element: (
          <RequireRole minRole="viewer">
            <ThreatModelPage />
          </RequireRole>
        ),
      },
      {
        path: "audit",
        element: (
          <RequireRole minRole="viewer">
            <AuditPage />
          </RequireRole>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "landing",
        element: <LandingPage />,
      },
      {
        path: "vaultra",
        element: <LandingPage />,
      },
    ],
  },
]);
