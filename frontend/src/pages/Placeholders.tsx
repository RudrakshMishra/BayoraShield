import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  Flame,
  Gauge,
  GitCompare,
  KeyRound,
  Lock,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Upload,
  XCircle,
} from "lucide-react";
import {
  apiFetch,
  ApiRequestError,
} from "../api/apiFetch";
import {
  AppEvent,
  AuditResult,
  BreachResult,
  LedgerEntry,
  LedgerHead,
  Metric,
  Run,
  VerifyResult,
  type AppEventT,
  type AuditResultT,
  type BreachResultT,
  type LedgerEntryT,
  type LedgerHeadT,
  type MetricT,
  type RunT,
  type VerifyResultT,
} from "../api/schemas";
import { useAuthStore } from "../state/authStore";
import { formatTimestamp, truncateHash } from "../lib/utils";
import { sseRegistry } from "../api/sse";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const card = "bg-surface border border-white/10 rounded-card";
const button = "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function Simulated() {
  return <span className="ml-2 rounded bg-gold/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-gold">SIMULATED</span>;
}

function StatusBadge({ status }: { status: "pass" | "fail" | "allowed" | "blocked" | "denied" | "succeeded" | "n/a" }) {
  const good = status === "pass" || status === "blocked";
  const bad = status === "fail" || status === "succeeded";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono font-bold uppercase ${good ? "border-green/40 bg-green/10 text-green" : bad ? "border-red/40 bg-red/10 text-red" : "border-muted/40 bg-muted/10 text-muted"}`}>
      {good ? <Check className="h-3 w-3" /> : bad ? <XCircle className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted" />}
      {status}
    </span>
  );
}

function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = error instanceof ApiRequestError && error.status >= 500 ? "Backend unavailable. Please retry." : error instanceof Error ? error.message : "Unable to load this view.";
  return (
    <div className={`${card} flex flex-col items-center gap-3 p-8 text-center`} role="alert">
      <AlertTriangle className="h-8 w-8 text-gold" />
      <p className="text-sm text-muted">{message}</p>
      {retry && <button className={`${button} bg-blue text-white`} onClick={retry}><RefreshCw className="h-3.5 w-3.5" />Retry</button>}
    </div>
  );
}

function LoadingState({ label = "Loading metadata" }: { label?: string }) {
  return <div className={`${card} flex min-h-40 items-center justify-center gap-3 p-8 text-sm text-muted`}><RefreshCw className="h-4 w-4 animate-spin text-gold" />{label}…</div>;
}

function useJson<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    loader().then(setData).catch(setError).finally(() => setLoading(false));
  }, [loader]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload };
}

function useEvents(stack: "shield" | "baseline") {
  const [events, setEvents] = useState<AppEventT[]>([]);
  const [connected, setConnected] = useState(false);
  const [invalid, setInvalid] = useState(0);
  useEffect(() => {
    const source = new EventSource(`/api/events?stack=${stack}`, { withCredentials: true });
    const unregister = sseRegistry.register(source);
    source.onopen = () => setConnected(true);
    source.onmessage = (message) => {
      try {
        const parsed = AppEvent.safeParse(JSON.parse(message.data));
        if (!parsed.success) { setInvalid((count) => count + 1); return; }
        setEvents((current) => [parsed.data, ...current.filter((event) => event.id !== parsed.data.id)].slice(0, 2000));
      } catch { setInvalid((count) => count + 1); }
    };
    source.onerror = () => setConnected(false);
    return () => { unregister(); };
  }, [stack]);
  return { events, connected, invalid };
}

const nodes = [
  { id: "model", label: "Model Cell", color: "grey", place: "left-1/2 top-6 -translate-x-1/2" },
  { id: "red", label: "Red Cell", color: "red", place: "left-8 top-1/2 -translate-y-1/2" },
  { id: "broker", label: "Policy Broker", color: "gold", place: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" },
  { id: "blue", label: "Blue Evaluator", color: "blue", place: "right-8 top-1/2 -translate-y-1/2" },
  { id: "ledger", label: "Ledger", color: "gold", place: "left-1/2 bottom-5 -translate-x-1/2" },
] as const;

function TopologyDiagram({ events }: { events: AppEventT[] }) {
  const reduced = useReducedMotion();
  const latest = events[0];
  const packetBlocked = latest?.outcome !== "allowed";
  return (
    <div className={`${card} relative min-h-[440px] overflow-hidden p-6`} aria-label="BayoraShield topology">
      <div className="absolute inset-x-16 top-1/2 h-px bg-gradient-to-r from-red/60 via-gold/60 to-blue/60" />
      <div className="absolute left-1/2 top-14 h-[270px] w-px -translate-x-1/2 bg-gradient-to-b from-grey/50 via-gold/60 to-gold/30" />
      <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-5rem)] -translate-x-1/2 border-t border-dashed border-red/30" />
      <div className="absolute left-1/2 top-[calc(50%+25px)] -translate-x-1/2 rounded-full border border-red/20 bg-red/5 px-3 py-1 text-[10px] font-mono text-red">⊘ NO DIRECT CELL-TO-CELL LINKS</div>
      {latest && <motion.div className={`absolute left-1/2 top-1/2 z-10 h-3 w-3 rounded-full ${packetBlocked ? "bg-red shadow-[0_0_18px_var(--red)]" : "bg-green shadow-[0_0_18px_var(--green)]"}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: reduced ? 0 : 0.3 }} aria-label={`Latest packet ${latest.outcome}`} />}
      {nodes.map((node) => (
        <div key={node.id} className={`absolute ${node.place} flex w-32 flex-col items-center gap-2 text-center`}>
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-${node.color}/50 bg-${node.color}/10 text-${node.color}`}>
            {node.id === "broker" ? <KeyRound className="h-7 w-7" /> : node.id === "ledger" ? <Terminal className="h-7 w-7" /> : <Server className="h-7 w-7" />}
          </div>
          <span className="text-xs font-semibold text-text">{node.label}</span>
          <span className="font-mono text-[10px] uppercase text-muted">{node.id === "blue" ? "network: none" : node.id === "broker" ? "trusted route" : "sealed cell"}</span>
        </div>
      ))}
      <div className="absolute bottom-3 left-4 flex items-center gap-4 text-[10px] font-mono text-muted"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green" />ALLOWED</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red" />BLOCKED / DENIED</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gold" />WRITE-ONLY LEDGER</span></div>
    </div>
  );
}

export const TopologyPage: React.FC = () => {
  const [stack, setStack] = useState<"shield" | "baseline">("shield");
  const { events, connected, invalid } = useEvents(stack);
  const counts = useMemo(() => events.reduce((acc, event) => { acc[event.outcome] += 1; return acc; }, { allowed: 0, blocked: 0, denied: 0 }), [events]);
  return <div id="page-topology" className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">Network proof / live stream</p><h1 className="font-heading text-2xl font-bold text-text">Live Topology</h1><p className="text-sm text-muted">The Broker is the only route between mutually untrusted cells.</p></div><div className="flex items-center gap-2"><div className="flex rounded-lg border border-white/10 bg-surface p-1"><button className={`px-3 py-1.5 text-xs font-semibold ${stack === "shield" ? "rounded bg-green/15 text-green" : "text-muted"}`} onClick={() => setStack("shield")}>Shield</button><button className={`px-3 py-1.5 text-xs font-semibold ${stack === "baseline" ? "rounded bg-red/15 text-red" : "text-muted"}`} onClick={() => setStack("baseline")}>Baseline</button></div><span className={`rounded-full border px-2 py-1 text-[10px] font-mono uppercase ${connected ? "border-green/40 text-green" : "border-gold/40 text-gold"}`}>{connected ? "stream live" : "reconnecting"}</span></div></header>
    <div className="grid gap-3 sm:grid-cols-3"><div className={`${card} p-4`}><p className="text-[10px] font-mono uppercase text-muted">Events observed</p><p className="mt-1 text-2xl font-heading font-bold text-text">{events.length}<Simulated /></p></div><div className={`${card} p-4`}><p className="text-[10px] font-mono uppercase text-muted">Allowed</p><p className="mt-1 text-2xl font-heading font-bold text-green">{counts.allowed}</p></div><div className={`${card} p-4`}><p className="text-[10px] font-mono uppercase text-muted">Stopped at boundary</p><p className="mt-1 text-2xl font-heading font-bold text-red">{counts.blocked + counts.denied}</p></div></div>
    <TopologyDiagram events={events} />
    {invalid > 0 && <p className="text-xs text-gold">{invalid} malformed stream event(s) were rejected before rendering.</p>}
  </div>;
};

export const EventsPage: React.FC = () => {
  const [stack, setStack] = useState<"shield" | "baseline">("shield");
  const [paused, setPaused] = useState(false);
  const [outcome, setOutcome] = useState("all");
  const { events, connected, invalid } = useEvents(stack);
  const visible = paused ? events.slice(0, 50) : events;
  const filtered = visible.filter((event) => outcome === "all" || event.outcome === outcome);
  return <div id="page-events" className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-2xl font-bold text-text">Event Feed</h1><p className="text-sm text-muted">Metadata only: payload content is never shown or stored.</p></div><div className="flex gap-2"><select className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-text" value={stack} onChange={(event) => setStack(event.target.value as "shield" | "baseline")}><option value="shield">Shield stream</option><option value="baseline">Baseline stream</option></select><button className={`${button} border border-white/10 bg-surface-2 text-text`} onClick={() => setPaused((value) => !value)}><Activity className="h-3.5 w-3.5" />{paused ? "Resume" : "Pause"}</button></div></header><div className="rounded-lg border border-blue/30 bg-blue/10 p-3 text-xs text-blue">Metadata-only guard active. Payloads, prompts, rules, and model content are never rendered. <span className="font-mono">{connected ? "SSE CONNECTED" : "SSE RECONNECTING"}</span>{invalid > 0 && ` • ${invalid} rejected`}</div><div className="flex gap-2 text-xs"><button className={`rounded-full px-3 py-1 ${outcome === "all" ? "bg-surface-2 text-text" : "text-muted"}`} onClick={() => setOutcome("all")}>All ({events.length})</button>{["allowed", "blocked", "denied"].map((value) => <button key={value} className={`rounded-full px-3 py-1 ${outcome === value ? "bg-surface-2 text-text" : "text-muted"}`} onClick={() => setOutcome(value)}>{value}</button>)}</div><div className={`${card} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-white/10 bg-surface-2/60 text-[10px] font-mono uppercase text-muted"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Boundary</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">Ledger</th></tr></thead><tbody>{filtered.slice(0, 200).map((event) => <tr key={event.id} className="border-b border-white/5 hover:bg-surface-2/40"><td className="whitespace-nowrap px-4 py-3 font-mono text-muted">{formatTimestamp(event.ts)}</td><td className="px-4 py-3 text-text">{event.type}</td><td className="px-4 py-3 uppercase text-muted">{event.actor}</td><td className="px-4 py-3 font-mono text-muted">{event.boundary}</td><td className="px-4 py-3"><StatusBadge status={event.outcome} /></td><td className="px-4 py-3 font-mono text-muted">{event.ledger_seq ?? "—"}</td></tr>)}</tbody></table>{filtered.length === 0 && <div className="p-10 text-center text-sm text-muted">Waiting for metadata events…</div>}</div></div></div>;
};

export const BreachPage: React.FC = () => {
  const load = useCallback(() => apiFetch<{ run_id: string; results: BreachResultT[] }>("/results/breach", { schema: undefined }).then((value) => ({ run_id: value.run_id, results: value.results.map((item) => BreachResult.parse(item)) })), []);
  const { data, error, loading, reload } = useJson(load);
  const [filter, setFilter] = useState("all");
  if (loading) return <LoadingState label="Loading breach evidence" />;
  if (error) return <ErrorState error={error} retry={reload} />;
  const results = data?.results ?? [];
  const filtered = results.filter((item) => filter === "all" || item.shield === filter);
  const blocked = results.filter((item) => item.shield === "blocked").length;
  return <div id="page-breach" className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-green">Proof suite / 14 controls</p><h1 className="font-heading text-2xl font-bold text-text">Breach Wall</h1><p className="text-sm text-muted">The same attack paths are compared against Baseline and Shield.</p></div><select className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-text" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All controls</option><option value="blocked">Shield blocked</option><option value="n/a">Shield not applicable</option></select></header><div className="grid gap-3 sm:grid-cols-3"><div className={`${card} p-4`}><p className="text-[10px] font-mono uppercase text-muted">Shield blocked</p><p className="mt-1 text-2xl font-heading font-bold text-green">{blocked}/{results.length}<Simulated /></p></div><div className={`${card} p-4`}><p className="text-[10px] font-mono uppercase text-muted">Baseline succeeded</p><p className="mt-1 text-2xl font-heading font-bold text-red">{results.filter((item) => item.baseline === "succeeded").length}</p></div><div className={`${card} p-4`}><p className="text-[10px] font-mono uppercase text-muted">Run</p><p className="mt-1 font-mono text-sm text-text">{data?.run_id}</p></div></div><div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => <motion.article key={item.test_id} initial={{ opacity: 0, rotateY: 25 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: 0.25 }} className={`${card} p-4`}><div className="flex items-start justify-between gap-3"><div><span className="font-mono text-xs text-gold">{item.test_id}</span><h2 className="mt-1 text-sm font-semibold text-text">{item.name}</h2></div><StatusBadge status={item.shield} /></div><p className="mt-3 text-xs text-muted">{item.attempt}</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg border border-red/30 bg-red/5 p-3"><p className="text-[10px] font-mono uppercase text-muted">Baseline</p><StatusBadge status={item.baseline} /></div><div className="rounded-lg border border-green/30 bg-green/5 p-3"><p className="text-[10px] font-mono uppercase text-muted">Shield</p><StatusBadge status={item.shield} /></div></div><p className="mt-3 flex items-center gap-2 text-xs text-muted"><Lock className="h-3.5 w-3.5 text-green" />Control: <span className="text-text">{item.control}</span></p></motion.article>)}</div></div>;
};

function MiniStream({ stack }: { stack: "shield" | "baseline" }) {
  const { events } = useEvents(stack);
  return <div className={`${card} p-4`}><div className="mb-3 flex items-center justify-between"><h2 className="font-heading font-semibold text-text">{stack === "shield" ? "Shield" : "Baseline"}</h2><span className={`text-[10px] font-mono uppercase ${stack === "shield" ? "text-green" : "text-red"}`}>{stack === "shield" ? "mediated" : "shared network"}</span></div><div className="space-y-2">{events.slice(0, 6).map((event) => <div key={event.id} className="flex items-center justify-between rounded bg-surface-2/60 px-3 py-2 text-xs"><span className="font-mono text-muted">{event.boundary}</span><StatusBadge status={event.outcome} /></div>)}{events.length === 0 && <p className="py-5 text-center text-xs text-muted">Waiting for stream…</p>}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-lg font-bold text-text">{events.length}</p><p className="text-[9px] uppercase text-muted">events</p></div><div><p className="text-lg font-bold text-green">{events.filter((event) => event.outcome === "blocked").length}</p><p className="text-[9px] uppercase text-muted">blocked</p></div><div><p className="text-lg font-bold text-red">{events.filter((event) => event.outcome === "allowed").length}</p><p className="text-[9px] uppercase text-muted">allowed</p></div></div></div>;
}

export const ComparePage: React.FC = () => {
  const { user } = useAuthStore();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const runSameAttack = async () => { setRunning(true); setMessage(null); try { await apiFetch("/runs", { method: "POST", body: JSON.stringify({ mode: "both", dataset: "standard-adversarial-v1", requests: 14 }) }); setMessage("Comparison run started. Watch both streams for outcomes."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start run."); } finally { setRunning(false); } };
  return <div id="page-compare" className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">Hero proof / same workload</p><h1 className="font-heading text-2xl font-bold text-text">Baseline vs Shield</h1><p className="text-sm text-muted">One attack suite. Two trust boundaries. No hidden payloads.</p></div>{(user?.role === "operator" || user?.role === "admin") && <button className={`${button} bg-blue text-white`} onClick={runSameAttack} disabled={running}><GitCompare className="h-4 w-4" />{running ? "Starting…" : "Run same attack"}</button>}</header>{message && <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold">{message}</div>}<div className="grid gap-5 lg:grid-cols-2"><MiniStream stack="baseline" /><MiniStream stack="shield" /></div><div className={`${card} p-5`}><div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-green" /><div><h2 className="font-heading font-semibold text-text">What the comparison proves</h2><p className="mt-1 text-sm text-muted">Baseline is a deliberately weak lab fixture. Shield is only considered effective after the Linux audit and breach suite pass.</p></div></div></div></div>;
};

export const LedgerPage: React.FC = () => {
  const { user } = useAuthStore();
  const isOperator = user?.role === "operator" || user?.role === "admin";
  const isAdmin = user?.role === "admin" && user.demo_controls;
  const headLoader = useCallback(() => apiFetch<LedgerHeadT>("/ledger/head", { schema: LedgerHead }), []);
  const entriesLoader = useCallback(() => apiFetch<LedgerEntryT[]>("/ledger/entries?from=1&limit=30", { schema: LedgerEntry.array() }), []);
  const head = useJson(headLoader); const entries = useJson(entriesLoader);
  const [verify, setVerify] = useState<VerifyResultT | null>(null); const [working, setWorking] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  const verifyChain = async () => { setWorking(true); try { setVerify(await apiFetch<VerifyResultT>("/ledger/verify", { method: "POST", schema: VerifyResult })); } catch (error) { setNotice(error instanceof Error ? error.message : "Verification failed."); } finally { setWorking(false); } };
  const demoAction = async (path: "/demo/tamper" | "/demo/untamper") => { setWorking(true); try { await apiFetch(path, { method: "POST", body: path.endsWith("tamper") ? JSON.stringify({ seq: 32 }) : undefined }); setNotice(path.endsWith("tamper") ? "Demo tamper applied. Verify the chain to observe detection." : "Ledger restored."); entries.reload(); head.reload(); } catch (error) { setNotice(error instanceof Error ? error.message : "Demo action failed."); } finally { setWorking(false); } };
  if (head.loading || entries.loading) return <LoadingState label="Loading signed ledger" />;
  if (head.error) return <ErrorState error={head.error} retry={head.reload} />;
  if (entries.error) return <ErrorState error={entries.error} retry={entries.reload} />;
  const brokenSeq = verify?.first_bad_seq;
  return <div id="page-ledger" className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">Integrity / append-only evidence</p><h1 className="font-heading text-2xl font-bold text-text">Ledger Explorer</h1><p className="text-sm text-muted">Signed SHA-256 chain. Metadata and salted hashes only.</p></div><div className="flex flex-wrap gap-2">{isOperator && <button id="verify-ledger-button" className={`${button} bg-blue text-white`} onClick={verifyChain} disabled={working}><CheckCircle2 className="h-4 w-4" />{working ? "Checking…" : "Verify chain"}</button>}{isAdmin && <><button id="tamper-ledger-button" className={`${button} border border-red/40 bg-red/10 text-red`} onClick={() => demoAction("/demo/tamper")} disabled={working}><ShieldAlert className="h-4 w-4" />Tamper demo</button><button id="restore-ledger-button" className={`${button} border border-green/40 bg-green/10 text-green`} onClick={() => demoAction("/demo/untamper")} disabled={working}><ShieldCheck className="h-4 w-4" />Restore</button></>}</div></header>{notice && <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold">{notice}</div>}{verify && <div className={`rounded-lg border p-4 ${verify.ok ? "border-green/30 bg-green/10" : "border-red/30 bg-red/10"}`}><div className="flex items-center gap-2 text-sm font-semibold">{verify.ok ? <CheckCircle2 className="h-4 w-4 text-green" /> : <XCircle className="h-4 w-4 text-red" />}{verify.ok ? "Chain verified" : `Chain broken at sequence ${verify.first_bad_seq}`}</div><p className="mt-1 text-xs text-muted">Checked {verify.checked} entries. {verify.reason ?? "No inconsistencies found."}</p></div>}<div className="grid gap-3 sm:grid-cols-3"><div className={`${card} p-4`}><p className="text-[10px] uppercase text-muted">Head sequence</p><p className="mt-1 font-mono text-xl text-text">{head.data?.seq}</p></div><div className={`${card} p-4`}><p className="text-[10px] uppercase text-muted">Entry count</p><p className="mt-1 font-mono text-xl text-text">{head.data?.count}</p></div><div className={`${card} p-4`}><p className="text-[10px] uppercase text-muted">Head hash</p><p className="mt-1 font-mono text-xs text-gold">{truncateHash(head.data?.entry_hash)}</p></div></div><div className={`${card} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-white/10 bg-surface-2/60 text-[10px] uppercase text-muted"><tr><th className="px-4 py-3">Seq</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Cell / action</th><th className="px-4 py-3">Previous hash</th><th className="px-4 py-3">Entry hash</th><th className="px-4 py-3">Sig</th></tr></thead><tbody>{entries.data?.map((entry) => <tr key={entry.seq} className={`border-b border-white/5 ${brokenSeq !== null && brokenSeq !== undefined && entry.seq >= brokenSeq ? "bg-red/5" : ""}`}><td className="px-4 py-3 font-mono text-gold">{entry.seq}</td><td className="whitespace-nowrap px-4 py-3 font-mono text-muted">{formatTimestamp(entry.ts)}</td><td className="px-4 py-3"><div className="text-text">{entry.cell}</div><div className="text-muted">{entry.action}</div></td><td className="px-4 py-3 font-mono text-muted">{truncateHash(entry.prev_hash)}</td><td className="px-4 py-3 font-mono text-muted">{truncateHash(entry.entry_hash)}</td><td className="px-4 py-3 text-green"><Check className="h-4 w-4" aria-label="signature present" /></td></tr>)}</tbody></table></div></div></div>;
};

const metricColor: Record<string, string> = { leakage: "#2F6FED", latency: "#E8A33D", integrity: "#1FA971", defense: "#0E7C86" };

export const ResultsPage: React.FC = () => {
  const load = useCallback(() => apiFetch<{ run_id: string; metrics: MetricT[] }>("/results/metrics").then((value) => ({ run_id: value.run_id, metrics: value.metrics.map((metric) => Metric.parse(metric)) })), []);
  const { data, error, loading, reload } = useJson(load);
  const exportSnapshot = () => { if (!data) return; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `bayorashield-${data.run_id}.json`; link.click(); URL.revokeObjectURL(url); };
  const loadSnapshot = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; file.text().then((text) => { const parsed: unknown = JSON.parse(text); if (typeof parsed === "object" && parsed !== null && "metrics" in parsed) window.dispatchEvent(new CustomEvent("bayorashield:snapshot", { detail: parsed })); }).catch(() => undefined); };
  if (loading) return <LoadingState label="Loading measured results" />;
  if (error) return <ErrorState error={error} retry={reload} />;
  const metrics = data?.metrics ?? [];
  const latencyData = metrics.filter((metric) => metric.group === "latency").map((metric) => ({ name: metric.name.replace("Latency ", ""), value: metric.value, n: metric.n }));
  return <div id="page-results" className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-green">Evidence / measured values</p><h1 className="font-heading text-2xl font-bold text-text">Results & Metrics</h1><p className="text-sm text-muted">Run {data?.run_id}. Every number includes its sample size.</p></div><div className="flex gap-2"><label className={`${button} cursor-pointer border border-white/10 bg-surface-2 text-text`}><Upload className="h-3.5 w-3.5" />Load snapshot<input type="file" accept="application/json" className="hidden" onChange={loadSnapshot} /></label><button className={`${button} bg-blue text-white`} onClick={exportSnapshot}><Download className="h-3.5 w-3.5" />Export JSON</button></div></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.slice(0, 8).map((metric) => <div key={metric.name} className={`${card} p-4`}><div className="flex items-center justify-between"><p className="text-[10px] uppercase text-muted">{metric.name}</p><span className="h-2 w-2 rounded-full" style={{ backgroundColor: metricColor[metric.group] }} /></div><p className="mt-2 text-2xl font-heading font-bold text-text">{metric.value}{metric.unit === "%" ? "%" : ` ${metric.unit}`}<Simulated /></p><p className="mt-1 text-[10px] font-mono text-muted">n = {metric.n}</p></div>)}</div><div className={`${card} p-5`}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-heading font-semibold text-text">Latency comparison</h2><p className="text-xs text-muted">Baseline and Shield values, one scale in milliseconds.</p></div><Gauge className="h-5 w-5 text-gold" /></div><div className="h-72" aria-label="Latency comparison bar chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={latencyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}><CartesianGrid stroke="#ffffff14" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9AA7B8", fontSize: 11 }} /><YAxis tick={{ fill: "#9AA7B8", fontSize: 11 }} unit=" ms" /><Tooltip contentStyle={{ background: "#12294A", border: "1px solid #ffffff20", color: "#F1F4F9" }} formatter={(value, _name, item) => [`${value} ms (n=${item.payload.n})`, "Measured latency"]} /><Legend wrapperStyle={{ color: "#F1F4F9", fontSize: 11 }} /><Bar dataKey="value" name="Latency" radius={[4, 4, 0, 0]}>{latencyData.map((entry) => <Cell key={entry.name} fill={entry.name.toLowerCase().includes("shield") ? "#1FA971" : "#E5484D"} />)}</Bar></BarChart></ResponsiveContainer></div><p className="mt-3 text-[10px] text-muted">Mock values are illustrative and labelled SIMULATED; replace with Linux benchmark output before claiming overhead.</p></div></div>;
};

export const RunsPage: React.FC = () => {
  const { user } = useAuthStore(); const [mode, setMode] = useState<"baseline" | "shield" | "both">("both"); const [run, setRun] = useState<RunT | null>(null); const [runs, setRuns] = useState<RunT[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const refresh = useCallback(() => apiFetch<RunT[]>("/runs", { schema: Run.array() }).then(setRuns).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load runs.")), []); useEffect(() => { refresh(); }, [refresh]);
  const start = async () => { setBusy(true); try { const created = await apiFetch<RunT>("/runs", { method: "POST", body: JSON.stringify({ mode, dataset: "standard-adversarial-v1", requests: 14 }), schema: Run }); setRun(created); setMessage("Run started. Hostile Red is safe to replay against the lab fixture."); refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start run."); } finally { setBusy(false); } };
  const hostile = async () => { if (!run || !window.confirm("Launch the safe hostile-Red test burst?")) return; setBusy(true); try { await apiFetch(`/runs/${run.id}/hostile-red`, { method: "POST", body: JSON.stringify({ confirm: true }) }); setMessage("Hostile Red burst launched; observe blocked boundary events."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to launch hostile Red."); } finally { setBusy(false); } };
  const reset = async () => { if (user?.role !== "admin" || !window.confirm("Reset demo state?")) return; try { await apiFetch("/reset", { method: "POST", body: JSON.stringify({ confirm: true }) }); setMessage("Demo state reset."); refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to reset."); } };
  return <div id="page-runs" className="space-y-5"><header><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">Operations / controlled actions</p><h1 className="font-heading text-2xl font-bold text-text">Run Control</h1><p className="text-sm text-muted">Start deterministic evaluation runs and watch the metadata stream.</p></header>{message && <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold">{message}</div>}<div className={`${card} flex flex-wrap items-end gap-4 p-5`}><label className="text-xs text-muted">Stack mode<select className="mt-2 block rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-sm text-text" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="both">Baseline + Shield</option><option value="shield">Shield</option><option value="baseline">Baseline</option></select></label><button id="start-run-button" className={`${button} bg-blue text-white`} onClick={start} disabled={busy}><Play className="h-4 w-4" />{busy ? "Starting…" : "Start run"}</button><button id="launch-hostile-red-button" className={`${button} border border-red/40 bg-red/10 text-red`} onClick={hostile} disabled={busy || !run}><Flame className="h-4 w-4" />Launch hostile Red</button>{user?.role === "admin" && <button className={`${button} border border-white/10 bg-surface-2 text-text`} onClick={reset}><RefreshCw className="h-4 w-4" />Reset demo</button>}</div><div className={`${card} overflow-hidden`}><table className="w-full text-left text-xs"><thead className="border-b border-white/10 bg-surface-2/60 text-[10px] uppercase text-muted"><tr><th className="px-4 py-3">Run</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Policy</th></tr></thead><tbody>{runs.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="px-4 py-3 font-mono text-gold">{item.id}</td><td className="px-4 py-3 text-text uppercase">{item.mode}</td><td className="px-4 py-3"><span className="text-green">{item.status}</span></td><td className="px-4 py-3 font-mono text-muted">{item.policy_version}</td></tr>)}</tbody></table></div></div>;
};

export const ThreatModelPage: React.FC = () => <div id="page-threat-model" className="space-y-5"><header><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">Security posture / honest limits</p><h1 className="font-heading text-2xl font-bold text-text">Threat Model</h1><p className="text-sm text-muted">What the demo protects against, and what it does not claim.</p></header><div className="grid gap-4 lg:grid-cols-3"><section className={`${card} border-green/20 p-5`}><ShieldCheck className="h-6 w-6 text-green" /><h2 className="mt-4 font-heading font-semibold text-text">Protects against</h2><ul className="mt-3 space-y-2 text-sm text-muted"><li>• Direct cell-to-cell network access</li><li>• Shared filesystem leakage</li><li>• Internet and external DNS egress</li><li>• Forged, replayed, or over-budget calls</li><li>• Silent edits to prior ledger entries</li></ul></section><section className={`${card} border-red/20 p-5`}><AlertTriangle className="h-6 w-6 text-red" /><h2 className="mt-4 font-heading font-semibold text-text">Not fully covered</h2><ul className="mt-3 space-y-2 text-sm text-muted"><li>• Host kernel or hypervisor zero-days</li><li>• Compromised Broker or signing key</li><li>• Malicious cloud operator</li><li>• New dependency vulnerabilities</li><li>• Newest-entry truncation without an anchor</li></ul></section><section className={`${card} border-gold/20 p-5`}><Activity className="h-6 w-6 text-gold" /><h2 className="mt-4 font-heading font-semibold text-text">Roadmap</h2><ul className="mt-3 space-y-2 text-sm text-muted"><li>• mTLS and OPA policy bundles</li><li>• gVisor or microVM execution</li><li>• Falco and transparency anchoring</li><li>• Confidential VMs and dedicated GPUs</li><li>• Production identity and tenancy</li></ul></section></div><div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-gold"><strong>Guarantees may fail if:</strong> the stack changes without rerunning `bayora-audit` and the breach suite, or if the documented Linux host assumptions do not hold.</div></div>;

export const AuditPage: React.FC = () => {
  const [scenario, setScenario] = useState("all-pass"); const load = useCallback(() => apiFetch<{ ts: string; results: AuditResultT[] }>(`/audit/latest?scenario=${scenario}`).then((value) => ({ ts: value.ts, results: value.results.map((item) => AuditResult.parse(item)) })), [scenario]); const { data, error, loading, reload } = useJson(load);
  if (loading) return <LoadingState label="Running audit report" />; if (error) return <ErrorState error={error} retry={reload} />; const failed = data?.results.filter((item) => item.status === "fail").length ?? 0;
  return <div id="page-audit" className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">Host inspection / invariant report</p><h1 className="font-heading text-2xl font-bold text-text">Audit Status</h1><p className="text-sm text-muted">Every result must be checked on the Linux validation host.</p></div><select className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-text" value={scenario} onChange={(event) => setScenario(event.target.value)}><option value="all-pass">All pass</option><option value="one-fail">Deliberate one-fail demo</option></select></header>{failed > 0 && <div className="flex items-center gap-2 rounded-lg border border-red/40 bg-red/10 p-4 text-sm text-red"><XCircle className="h-5 w-5" />Audit failure: {failed} invariant(s) need attention.</div>}{failed === 0 && <div className="flex items-center gap-2 rounded-lg border border-green/30 bg-green/10 p-4 text-sm text-green"><CheckCircle2 className="h-5 w-5" />All reported invariants pass. <Simulated /></div>}<div className={`${card} overflow-hidden`}><table className="w-full text-left text-xs"><thead className="border-b border-white/10 bg-surface-2/60 text-[10px] uppercase text-muted"><tr><th className="px-4 py-3">Invariant</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Detail</th></tr></thead><tbody>{data?.results.map((item) => <tr key={item.invariant} className="border-b border-white/5"><td className="px-4 py-3 font-semibold text-text">{item.invariant}</td><td className="px-4 py-3"><StatusBadge status={item.status} /></td><td className="px-4 py-3 text-muted">{item.detail}</td></tr>)}</tbody></table></div></div>;
};
