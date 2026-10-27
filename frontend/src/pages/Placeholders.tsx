import React from "react";
import { useAuthStore } from "../state/authStore";
import { ShieldAlert, ShieldCheck, Play, Flame, CheckCircle2 } from "lucide-react";

export const TopologyPage: React.FC = () => (
  <div id="page-topology" className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text">Live Topology</h1>
        <p className="text-muted text-sm">Real-time isolation boundary inspection and packet animation</p>
      </div>
      <span className="px-3 py-1 bg-surface-2 border border-white/10 rounded-full text-xs font-mono text-gold">
        SHIELD STACK
      </span>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-12 text-center text-muted min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-gold font-mono font-bold text-xl">
        ⬡
      </div>
      <h2 className="font-heading text-lg font-semibold text-text mb-1">Topology View Initialized</h2>
      <p className="text-sm max-w-md">Nodes: Red Cell, Blue Evaluator, Model Cell, Policy Broker, Ledger. Real-time stream integration activates in Milestone F4.</p>
    </div>
  </div>
);

export const EventsPage: React.FC = () => (
  <div id="page-events" className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Event Feed</h1>
      <p className="text-muted text-sm">Metadata only: payload content is never shown or stored</p>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
      <p className="text-sm">Live SSE metadata event table activates in Milestone F4.</p>
    </div>
  </div>
);

export const BreachPage: React.FC = () => (
  <div id="page-breach" className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Breach Wall</h1>
      <p className="text-muted text-sm">14 active isolation and leak prevention test cases</p>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
      <p className="text-sm">Breach card grid with flip animations activates in Milestone F5.</p>
    </div>
  </div>
);

export const ComparePage: React.FC = () => (
  <div id="page-compare" className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Baseline vs Shield</h1>
      <p className="text-muted text-sm">Side-by-side synchronized execution comparison</p>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
      <p className="text-sm">Dual topology and attack runner activates in Milestone F5.</p>
    </div>
  </div>
);

export const LedgerPage: React.FC = () => {
  const { user } = useAuthStore();
  const isOperator = user?.role === "operator" || user?.role === "admin";
  const isAdmin = user?.role === "admin" && user?.demo_controls;

  return (
    <div id="page-ledger" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Ledger Explorer</h1>
          <p className="text-muted text-sm">Cryptographically signed SHA-256 hash-chained audit log</p>
        </div>

        {/* Action Controls with Role Gating */}
        <div className="flex items-center gap-3">
          {/* Verify button: operator+ only */}
          {isOperator && (
            <button
              id="verify-ledger-button"
              className="flex items-center gap-2 px-3.5 py-2 bg-blue hover:bg-blue/90 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Chain</span>
            </button>
          )}

          {/* Tamper / Restore Controls: admin only with demo_controls */}
          {isAdmin && (
            <div id="admin-demo-controls" className="flex items-center gap-2">
              <button
                id="tamper-ledger-button"
                className="flex items-center gap-1.5 px-3 py-2 bg-red/20 hover:bg-red/30 text-red border border-red/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Simulate Tamper</span>
              </button>
              <button
                id="restore-ledger-button"
                className="flex items-center gap-1.5 px-3 py-2 bg-green/20 hover:bg-green/30 text-green border border-green/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Restore Chain</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
        <p className="text-sm">Hash chain inspector with Verify, Tamper and Restore activates in Milestone F6.</p>
      </div>
    </div>
  );
};

export const ResultsPage: React.FC = () => (
  <div id="page-results" className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Results & Metrics</h1>
      <p className="text-muted text-sm">Canary crossings, breach statistics, and latency benchmarks</p>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
      <p className="text-sm">Metrics dashboard with JSON snapshot export/load activates in Milestone F7.</p>
    </div>
  </div>
);

export const RunsPage: React.FC = () => {
  return (
    <div id="page-runs" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Run Control</h1>
          <p className="text-muted text-sm">Trigger adversarial evaluations and hostile-red escapes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="start-run-button"
            className="flex items-center gap-2 px-3.5 py-2 bg-blue hover:bg-blue/90 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Run</span>
          </button>
          <button
            id="launch-hostile-red-button"
            className="flex items-center gap-2 px-3.5 py-2 bg-red/20 hover:bg-red/30 text-red border border-red/40 rounded-lg text-xs font-semibold transition-colors"
          >
            <Flame className="w-4 h-4" />
            <span>Launch Hostile Red</span>
          </button>
        </div>
      </div>
      <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
        <p className="text-sm">Run trigger console and history table activates in Milestone F7.</p>
      </div>
    </div>
  );
};

export const ThreatModelPage: React.FC = () => (
  <div id="page-threat-model" className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Threat Model</h1>
      <p className="text-muted text-sm">Security boundaries, guarantees, and residual risk posture</p>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
      <p className="text-sm">Full 3-column security model activates in Milestone F7.</p>
    </div>
  </div>
);

export const AuditPage: React.FC = () => (
  <div id="page-audit" className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold text-text">Audit Status</h1>
      <p className="text-muted text-sm">Real-time isolation invariant verification</p>
    </div>
    <div className="bg-surface border border-white/10 rounded-card p-8 text-center text-muted">
      <p className="text-sm">Container invariant table and failure banner activates in Milestone F7.</p>
    </div>
  </div>
);
