import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  Activity,
  X,
  Server,
  Database,
} from "lucide-react";
import { useEventStore } from "../state/eventStore";
import { cn } from "../lib/utils";
import type { ActorT } from "../api/schemas";

interface NodeConfig {
  id: ActorT;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  borderColor: string;
  bgColor: string;
  position: { x: number; y: number }; // percentage coordinates in SVG/Canvas (0 to 100)
  isolationSpecs: {
    network: string;
    mounts: string;
    capabilities: string;
    seccomp: string;
  };
}

const NODES: Record<ActorT, NodeConfig> = {
  model: {
    id: "model",
    label: "Model Cell",
    sublabel: "Client LLM under test",
    icon: Cpu,
    color: "#9AA7B8",
    borderColor: "rgba(154, 167, 184, 0.4)",
    bgColor: "rgba(107, 122, 140, 0.15)",
    position: { x: 50, y: 13 },
    isolationSpecs: {
      network: "No external ingress/egress; broker socket only",
      mounts: "ro rootfs; tmpfs /tmp (noexec, nosuid)",
      capabilities: "CAP_DROP_ALL",
      seccomp: "strict default; system calls filtered",
    },
  },
  red: {
    id: "red",
    label: "Red Cell",
    sublabel: "Adversarial attack harness",
    icon: ShieldAlert,
    color: "#E5484D",
    borderColor: "rgba(229, 72, 77, 0.5)",
    bgColor: "rgba(229, 72, 77, 0.15)",
    position: { x: 13, y: 50 },
    isolationSpecs: {
      network: "Isolated bridge; internet blocked; broker proxy only",
      mounts: "ro rootfs; no persistent host volume",
      capabilities: "CAP_DROP_ALL",
      seccomp: "strict default; socket calls intercepted",
    },
  },
  broker: {
    id: "broker",
    label: "Policy Broker",
    sublabel: "Sealed mediation gateway",
    icon: Server,
    color: "#E8A33D",
    borderColor: "rgba(232, 163, 61, 0.5)",
    bgColor: "rgba(232, 163, 61, 0.15)",
    position: { x: 50, y: 50 },
    isolationSpecs: {
      network: "Internal overlay mesh only; TLS mutual auth",
      mounts: "ro rootfs; write-only append socket to ledger",
      capabilities: "NET_BIND_SERVICE only",
      seccomp: "strict mediation ruleset",
    },
  },
  blue: {
    id: "blue",
    label: "Blue Evaluator",
    sublabel: "Defensive judge & classifier",
    icon: ShieldCheck,
    color: "#2F6FED",
    borderColor: "rgba(47, 111, 237, 0.5)",
    bgColor: "rgba(47, 111, 237, 0.15)",
    position: { x: 87, y: 50 },
    isolationSpecs: {
      network: "Isolated; sealed evaluator socket to broker only",
      mounts: "ro rootfs; model weights unreadable",
      capabilities: "CAP_DROP_ALL",
      seccomp: "strict default",
    },
  },
  ledger: {
    id: "ledger",
    label: "Ledger",
    sublabel: "Signed SHA-256 hash chain",
    icon: Database,
    color: "#E8A33D",
    borderColor: "rgba(232, 163, 61, 0.4)",
    bgColor: "rgba(232, 163, 61, 0.12)",
    position: { x: 50, y: 87 },
    isolationSpecs: {
      network: "Write-only ingress from broker; no egress",
      mounts: "append-only audit storage volume",
      capabilities: "CAP_DROP_ALL",
      seccomp: "strict append-only syscalls",
    },
  },
  operator: {
    id: "operator",
    label: "Operator",
    sublabel: "Run controller",
    icon: Activity,
    color: "#0E7C86",
    borderColor: "rgba(14, 124, 134, 0.4)",
    bgColor: "rgba(14, 124, 134, 0.15)",
    position: { x: 50, y: 50 },
    isolationSpecs: {
      network: "Authenticated session",
      mounts: "n/a",
      capabilities: "role-gated",
      seccomp: "n/a",
    },
  },
};

export const TopologyPage: React.FC = () => {
  const {
    stack,
    isConnected,
    nodeStats,
    activePackets,
    events,
    connect,
    setStack,
    removePacket,
  } = useEventStore();

  const [selectedNode, setSelectedNode] = useState<ActorT | null>(null);

  useEffect(() => {
    connect();
  }, [connect]);

  // Clean up completed packets after 1800ms
  useEffect(() => {
    if (activePackets.length === 0) return;
    const now = Date.now();
    const expired = activePackets.filter((p) => now - p.timestamp > 1800);
    expired.forEach((p) => removePacket(p.id));
  }, [activePackets, removePacket]);

  // Filter recent events for selected node inspector
  const inspectorEvents = useMemo(() => {
    if (!selectedNode) return [];
    return events
      .filter((e) => e.actor === selectedNode || e.boundary.includes(selectedNode))
      .slice(0, 10);
  }, [events, selectedNode]);

  // Node position helper
  const getNodePos = (id: string) => {
    if (id === "red") return NODES.red.position;
    if (id === "blue") return NODES.blue.position;
    if (id === "model") return NODES.model.position;
    if (id === "ledger") return NODES.ledger.position;
    return NODES.broker.position;
  };

  return (
    <div id="page-topology" className="space-y-6">
      {/* Top Title & Stack Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="gradient-headline font-heading text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-gold" />
            Live Topology
          </h1>
          <p className="text-muted text-xs font-mono uppercase tracking-[0.16em] mt-1">
            Real-time isolation boundary inspection & packet flow
          </p>
        </div>

        {/* Stack Toggle Button Group */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.04] backdrop-blur-xl p-1 rounded-full border border-white/15 shadow-sm">
            <button
              id="stack-toggle-shield"
              onClick={() => setStack("shield")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all",
                stack === "shield"
                  ? "bg-gold text-bg shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "text-muted hover:text-white"
              )}
            >
              SHIELD STACK
            </button>
            <button
              id="stack-toggle-baseline"
              onClick={() => setStack("baseline")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all",
                stack === "baseline"
                  ? "bg-red text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  : "text-muted hover:text-white"
              )}
            >
              BASELINE STACK
            </button>
          </div>

          <div
            id="topology-live-badge"
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono border backdrop-blur-md shadow-sm",
              isConnected
                ? "bg-green/10 text-green border-green/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                : "bg-red/10 text-red border-red/30"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green animate-pulse" : "bg-red"
              )}
            />
            <span>{isConnected ? "LIVE STREAM" : "OFFLINE"}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative bg-white/[0.02] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-10 overflow-hidden min-h-[760px] flex items-center justify-center shadow-[0_24px_60px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)]">
        {/* Subtle radial ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.07)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_13%_50%,rgba(244,63,94,0.06)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_87%_50%,rgba(56,189,248,0.06)_0%,transparent_50%)] pointer-events-none" />

        {/* SVG Network Connections & Radar Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1100 700"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="topoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="linkGradBrokerRed" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E5484D" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="linkGradBrokerBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2F6FED" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="linkGradBrokerModel" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9AA7B8" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="linkGradBrokerLedger" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E8A33D" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Radar Perimeter Grid Rings around Broker (550, 350) */}
          <circle cx="550" cy="350" r="390" fill="none" stroke="rgba(192, 132, 252, 0.07)" strokeWidth="1" strokeDasharray="6 12" />
          <circle cx="550" cy="350" r="260" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="550" cy="350" r="135" fill="none" stroke="rgba(232, 163, 61, 0.12)" strokeWidth="1" strokeDasharray="3 6" />

          {/* Radar Crosshairs */}
          <line x1="80" y1="350" x2="1020" y2="350" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="550" y1="50" x2="550" y2="650" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Broker to Red link (Solid) */}
          <line
            x1="422"
            y1="350"
            x2="255"
            y2="350"
            stroke="url(#linkGradBrokerRed)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#topoGlow)"
          />

          {/* Broker to Blue link (Solid) */}
          <line
            x1="678"
            y1="350"
            x2="845"
            y2="350"
            stroke="url(#linkGradBrokerBlue)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#topoGlow)"
          />

          {/* Broker to Model link (Solid) */}
          <line
            x1="550"
            y1="286"
            x2="550"
            y2="147"
            stroke="url(#linkGradBrokerModel)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#topoGlow)"
          />

          {/* Broker to Ledger link (Dashed, write-only) */}
          <line
            x1="550"
            y1="414"
            x2="550"
            y2="553"
            stroke="url(#linkGradBrokerLedger)"
            strokeWidth="3"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          <g transform="translate(565, 480)">
            <rect x="-4" y="-10" width="76" height="18" rx="4" fill="#0d1117" opacity="0.9" stroke="rgba(232, 163, 61, 0.4)" strokeWidth="0.8" />
            <text
              x="34"
              y="3"
              textAnchor="middle"
              fill="#E8A33D"
              fontSize="10"
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing="0.08em"
              fontWeight="600"
            >
              WRITE-ONLY
            </text>
          </g>

          {/* Forbidden Red-to-Blue direct link corridor */}
          <line
            id="forbidden-cell-link"
            x1="180"
            y1="215"
            x2="920"
            y2="215"
            stroke="#E5484D"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            opacity="0.45"
          />
          {/* Barrier badge in the center */}
          <g transform="translate(550, 215)">
            <rect
              x="-130"
              y="-16"
              width="260"
              height="32"
              rx="16"
              fill="#14060a"
              stroke="#E5484D"
              strokeWidth="1.2"
              filter="url(#topoGlow)"
            />
            {/* Cross symbol */}
            <circle cx="-100" cy="0" r="8" fill="#2d0810" stroke="#E5484D" strokeWidth="1.2" />
            <line x1="-104" y1="-4" x2="-96" y2="4" stroke="#E5484D" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-96" y1="-4" x2="-104" y2="4" stroke="#E5484D" strokeWidth="1.8" strokeLinecap="round" />
            <text
              x="8"
              y="4"
              textAnchor="middle"
              fill="#E5484D"
              fontSize="11"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="600"
              letterSpacing="0.04em"
            >
              No direct cell-to-cell links
            </text>
          </g>
        </svg>

        {/* Animated Packets Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {activePackets.map((pkt) => {
            const srcPos = getNodePos(pkt.source);
            const tgtPos = getNodePos(pkt.target);
            const isBlocked = pkt.outcome === "blocked" || pkt.outcome === "denied";

            // If allowed, travel 0% -> 100%. If blocked, stop midway (45%)
            return (
              <div
                key={pkt.id}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out flex items-center justify-center",
                  isBlocked ? "animate-pulse" : ""
                )}
                style={{
                  left: isBlocked
                    ? `${srcPos.x + (tgtPos.x - srcPos.x) * 0.45}%`
                    : `${tgtPos.x}%`,
                  top: isBlocked
                    ? `${srcPos.y + (tgtPos.y - srcPos.y) * 0.45}%`
                    : `${tgtPos.y}%`,
                }}
              >
                {isBlocked ? (
                  <div
                    data-testid="blocked-boundary-lock"
                    id="blocked-boundary-lock"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red/90 text-white font-mono text-[10px] font-bold shadow-lg shadow-red/50 border border-white/30 backdrop-blur-md"
                  >
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>BLOCKED AT BOUNDARY</span>
                  </div>
                ) : (
                  <div
                    data-testid="allowed-packet"
                    className="w-3.5 h-3.5 rounded-full bg-green shadow-md shadow-green/60 border border-white/50 animate-ping"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Interactive Node Cards */}
        <div className="relative w-full h-[660px] max-w-6xl mx-auto">
          {/* 1. Model Cell (Top) */}
          <div
            id="node-model"
            onClick={() => setSelectedNode("model")}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-56 p-4 rounded-2xl border backdrop-blur-2xl cursor-pointer transition-all duration-300 select-none shadow-[0_10px_35px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] group",
              selectedNode === "model"
                ? "ring-2 ring-gold scale-105 shadow-[0_0_28px_rgba(245,158,11,0.35)]"
                : "hover:scale-102 hover:border-white/40"
            )}
            style={{
              left: `${NODES.model.position.x}%`,
              top: `${NODES.model.position.y}%`,
              backgroundColor: NODES.model.bgColor,
              borderColor: NODES.model.borderColor,
            }}
          >
            <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-white/[0.03] blur-lg" />
            <div className="relative flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-grey/30 text-text">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-xs font-bold text-text truncate">
                    {NODES.model.label}
                  </h3>
                  <p className="text-[10px] text-muted truncate">{NODES.model.sublabel}</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-muted border border-white/15">
                TARGET
              </span>
            </div>
            <div className="relative flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/10">
              <span className="text-muted">Inferences:</span>
              <span className="font-bold text-text">{nodeStats.model.requests}</span>
            </div>
          </div>

          {/* 2. Red Cell (Left) */}
          <div
            id="node-red"
            onClick={() => setSelectedNode("red")}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-56 p-4 rounded-2xl border backdrop-blur-2xl cursor-pointer transition-all duration-300 select-none shadow-[0_10px_35px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] group",
              selectedNode === "red"
                ? "ring-2 ring-red scale-105 shadow-[0_0_28px_rgba(244,63,94,0.35)]"
                : "hover:scale-102 hover:border-white/40"
            )}
            style={{
              left: `${NODES.red.position.x}%`,
              top: `${NODES.red.position.y}%`,
              backgroundColor: NODES.red.bgColor,
              borderColor: NODES.red.borderColor,
            }}
          >
            <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-red/10 blur-lg" />
            <div className="relative flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red/30 text-red">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-xs font-bold text-red truncate">
                    {NODES.red.label}
                  </h3>
                  <p className="text-[10px] text-muted truncate">{NODES.red.sublabel}</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red/20 text-red border border-red/40">
                ATTACKER
              </span>
            </div>
            <div className="relative grid grid-cols-2 gap-1 text-[10px] font-mono pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-muted">Total:</span>
                <span className="font-bold text-text">{nodeStats.red.requests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Blocked:</span>
                <span className="font-bold text-red">{nodeStats.red.blocked}</span>
              </div>
            </div>
          </div>

          {/* 3. Policy Broker (Center) */}
          <div
            id="node-broker"
            onClick={() => setSelectedNode("broker")}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-64 p-5 rounded-2xl border backdrop-blur-2xl cursor-pointer transition-all duration-300 select-none shadow-[0_16px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] group",
              selectedNode === "broker"
                ? "ring-2 ring-gold scale-105 shadow-[0_0_36px_rgba(245,158,11,0.45)]"
                : "hover:scale-102 hover:border-white/50"
            )}
            style={{
              left: `${NODES.broker.position.x}%`,
              top: `${NODES.broker.position.y}%`,
              backgroundColor: NODES.broker.bgColor,
              borderColor: NODES.broker.borderColor,
            }}
          >
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gold/15 blur-xl" />
            <div className="relative flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/30 text-gold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <Server className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-bold text-gold truncate">
                    {NODES.broker.label}
                  </h3>
                  <p className="text-[10px] text-muted truncate">{NODES.broker.sublabel}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-gold/20 text-gold border border-gold/40 shadow-sm">
                ISOLATION HUB
              </span>
            </div>

            <div className="relative grid grid-cols-3 gap-1.5 text-[10px] font-mono pt-2.5 border-t border-white/10 text-center">
              <div className="bg-white/[0.03] p-1 rounded-lg">
                <div className="text-muted text-[8px] uppercase tracking-wider">TOTAL</div>
                <div className="font-bold text-text text-xs">{nodeStats.broker.requests}</div>
              </div>
              <div className="bg-green/5 p-1 rounded-lg border border-green/20">
                <div className="text-green text-[8px] uppercase tracking-wider">ALLOWED</div>
                <div className="font-bold text-green text-xs">{nodeStats.broker.allowed}</div>
              </div>
              <div className="bg-red/5 p-1 rounded-lg border border-red/20">
                <div className="text-red text-[8px] uppercase tracking-wider">BLOCKED</div>
                <div className="font-bold text-red text-xs">{nodeStats.broker.blocked}</div>
              </div>
            </div>
          </div>

          {/* 4. Blue Evaluator (Right) */}
          <div
            id="node-blue"
            onClick={() => setSelectedNode("blue")}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-56 p-4 rounded-2xl border backdrop-blur-2xl cursor-pointer transition-all duration-300 select-none shadow-[0_10px_35px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] group",
              selectedNode === "blue"
                ? "ring-2 ring-blue scale-105 shadow-[0_0_28px_rgba(56,189,248,0.35)]"
                : "hover:scale-102 hover:border-white/40"
            )}
            style={{
              left: `${NODES.blue.position.x}%`,
              top: `${NODES.blue.position.y}%`,
              backgroundColor: NODES.blue.bgColor,
              borderColor: NODES.blue.borderColor,
            }}
          >
            <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-blue/10 blur-lg" />
            <div className="relative flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue/30 text-blue">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-xs font-bold text-blue truncate">
                    {NODES.blue.label}
                  </h3>
                  <p className="text-[10px] text-muted truncate">{NODES.blue.sublabel}</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue/20 text-blue border border-blue/40">
                DEFENDER
              </span>
            </div>
            <div className="relative grid grid-cols-2 gap-1 text-[10px] font-mono pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-muted">Verdicts:</span>
                <span className="font-bold text-text">{nodeStats.blue.requests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Pass:</span>
                <span className="font-bold text-green">{nodeStats.blue.allowed}</span>
              </div>
            </div>
          </div>

          {/* 5. Ledger (Bottom) */}
          <div
            id="node-ledger"
            onClick={() => setSelectedNode("ledger")}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-56 p-4 rounded-2xl border backdrop-blur-2xl cursor-pointer transition-all duration-300 select-none shadow-[0_10px_35px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] group",
              selectedNode === "ledger"
                ? "ring-2 ring-gold scale-105 shadow-[0_0_28px_rgba(245,158,11,0.35)]"
                : "hover:scale-102 hover:border-white/40"
            )}
            style={{
              left: `${NODES.ledger.position.x}%`,
              top: `${NODES.ledger.position.y}%`,
              backgroundColor: NODES.ledger.bgColor,
              borderColor: NODES.ledger.borderColor,
            }}
          >
            <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gold/10 blur-lg" />
            <div className="relative flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gold/30 text-gold">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-xs font-bold text-gold truncate">
                    {NODES.ledger.label}
                  </h3>
                  <p className="text-[10px] text-muted truncate">{NODES.ledger.sublabel}</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-gold/20 text-gold border border-gold/40">
                AUDIT CHAIN
              </span>
            </div>
            <div className="relative flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/10">
              <span className="text-muted">Appends:</span>
              <span className="font-bold text-gold">{nodeStats.ledger.requests}</span>
            </div>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="absolute bottom-5 left-5 bg-black/70 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 text-[11px] font-mono text-muted space-y-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="text-[10px] uppercase font-bold text-text mb-1 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Topology Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-gold" />
            <span>Mediation Link</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 border-t border-dashed border-gold" />
            <span>Write-Only Append</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 border-t border-dashed border-red" />
            <span>Crossed Out (No Direct Link)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green" />
            <span>Allowed Packet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red" />
            <span>Blocked / Barrier</span>
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Side Panel */}
      {selectedNode && (
        <div
          id="node-inspector-panel"
          className="fixed inset-y-0 right-0 w-96 bg-black/85 backdrop-blur-2xl border-l border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: NODES[selectedNode].bgColor }}
                >
                  {React.createElement(NODES[selectedNode].icon, {
                    className: "w-5 h-5",
                    style: { color: NODES[selectedNode].color },
                  })}
                </div>
                <div>
                  <h2 className="font-heading text-base font-bold text-text">
                    {NODES[selectedNode].label}
                  </h2>
                  <p className="text-xs text-muted font-mono">{NODES[selectedNode].sublabel}</p>
                </div>
              </div>
              <button
                id="close-node-inspector"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-surface-2 text-muted hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Container Isolation Specs */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gold" />
                Container Isolation Facts
              </h3>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 space-y-2.5 text-xs font-mono">
                <div>
                  <span className="text-muted block text-[10px]">NETWORK ISOLATION:</span>
                  <span className="text-text font-medium">
                    {NODES[selectedNode].isolationSpecs.network}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">FILESYSTEM MOUNTS:</span>
                  <span className="text-text font-medium">
                    {NODES[selectedNode].isolationSpecs.mounts}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">CAPABILITIES:</span>
                  <span className="text-text font-medium">
                    {NODES[selectedNode].isolationSpecs.capabilities}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">SECCOMP PROFILE:</span>
                  <span className="text-text font-medium">
                    {NODES[selectedNode].isolationSpecs.seccomp}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Node Counters */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Activity Counters
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-muted">TOTAL</div>
                  <div className="text-base font-bold text-text">
                    {nodeStats[selectedNode].requests}
                  </div>
                </div>
                <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-green">ALLOWED</div>
                  <div className="text-base font-bold text-green">
                    {nodeStats[selectedNode].allowed}
                  </div>
                </div>
                <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-red">BLOCKED</div>
                  <div className="text-base font-bold text-red">
                    {nodeStats[selectedNode].blocked}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Metadata Events for this Node */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Recent Metadata Events ({inspectorEvents.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px]">
                {inspectorEvents.length === 0 ? (
                  <div className="text-muted text-xs p-4 text-center bg-white/[0.03] border border-white/10 rounded-xl">
                    No recent events for this container.
                  </div>
                ) : (
                  inspectorEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-text">{evt.boundary}</div>
                        <div className="text-[9px] text-muted">{evt.type} • {evt.id}</div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          evt.outcome === "allowed"
                            ? "bg-green/15 text-green"
                            : "bg-red/15 text-red"
                        )}
                      >
                        {evt.outcome}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-muted text-center">
            Click outside or press Close to dismiss inspection
          </div>
        </div>
      )}
    </div>
  );
};
