import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/Login";
import { RequireRole } from "./components/RoleGuard";
import { TopologyPage } from "./pages/Topology";
import { EventsPage } from "./pages/Events";
import { VaultraHeroPage } from "./pages/VaultraHero";
import {
  BreachPage,
  ComparePage,
  LedgerPage,
  ResultsPage,
  RunsPage,
  ThreatModelPage,
  AuditPage,
} from "./pages/Placeholders";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
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
        path: "vaultra",
        element: <VaultraHeroPage />,
      },
    ],
  },
]);
