import React, { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Play,
  Pause,
  Trash2,
  Filter,
  CheckCircle2,
  Lock,
  AlertTriangle,
  ExternalLink,
  Layers,
  Search,
} from "lucide-react";
import { useEventStore } from "../state/eventStore";
import { cn } from "../lib/utils";
import type { ActorT, OutcomeT } from "../api/schemas";

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().substring(11, 23); // HH:mm:ss.SSS
  } catch {
    return iso;
  }
}

export const EventsPage: React.FC = () => {
  const {
    events,
    isPaused,
    isConnected,
    filters,
    connect,
    togglePause,
    clearEvents,
    setFilter,
    resetFilters,
  } = useEventStore();

  useEffect(() => {
    connect();
  }, [connect]);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filters.actor !== "all" && evt.actor !== filters.actor) return false;
      if (filters.outcome !== "all" && evt.outcome !== filters.outcome) return false;
      if (filters.type !== "all" && evt.type !== filters.type) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchId = evt.id.toLowerCase().includes(q);
        const matchBoundary = evt.boundary.toLowerCase().includes(q);
        const matchSeq = evt.ledger_seq?.toString().includes(q);
        if (!matchId && !matchBoundary && !matchSeq) return false;
      }
      return true;
    });
  }, [events, filters]);

  const actorColor = (actor: ActorT) => {
    switch (actor) {
      case "red":
        return "bg-red/20 text-red border-red/40";
      case "blue":
        return "bg-blue/20 text-blue border-blue/40";
      case "model":
        return "bg-grey/20 text-[#A0AEC0] border-grey/40";
      case "broker":
        return "bg-gold/20 text-gold border-gold/40";
      case "ledger":
        return "bg-gold/15 text-[#F6AD55] border-[#D69E2E]/40";
      default:
        return "bg-teal/20 text-teal border-teal/40";
    }
  };

  const outcomeBadge = (outcome: OutcomeT) => {
    switch (outcome) {
      case "allowed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-green/15 text-green border border-green/30">
            <CheckCircle2 className="w-3 h-3" />
            ALLOWED
          </span>
        );
      case "blocked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red/15 text-red border border-red/30">
            <Lock className="w-3 h-3" />
            BLOCKED
          </span>
        );
      case "denied":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red/20 text-[#FC8181] border border-red/40">
            <AlertTriangle className="w-3 h-3" />
            DENIED
          </span>
        );
    }
  };

  return (
    <div id="page-events" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="gradient-headline font-heading text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-gold" />
            Live Event Feed
          </h1>
          <p className="text-muted text-xs font-mono uppercase tracking-[0.16em] mt-1">
            Real-time metadata stream from container isolation boundaries
          </p>
        </div>

        {/* Global Stream Status & Controls */}
        <div className="flex items-center gap-3">
          <div
            id="connection-status-badge"
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono border backdrop-blur-md shadow-sm",
              isConnected
                ? "bg-green/10 text-green border-green/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-red/10 text-red border-red/30"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green animate-pulse" : "bg-red"
              )}
            />
            <span>{isConnected ? "STREAM ACTIVE" : "CONNECTING..."}</span>
          </div>

          <button
            id="event-feed-pause-btn"
            onClick={togglePause}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all shadow-sm",
              isPaused
                ? "bg-gold/20 text-gold border-gold/40 hover:bg-gold/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "bg-white/[0.05] text-text border-white/15 hover:bg-white/[0.1]"
            )}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? "Resume Stream" : "Pause Stream"}</span>
          </button>

          <button
            id="event-feed-clear-btn"
            onClick={clearEvents}
            title="Clear buffered events"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] hover:bg-red/20 hover:text-red hover:border-red/40 text-muted border border-white/15 backdrop-blur-md transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Non-negotiable Rule 1 Security Banner */}
      <div
        id="metadata-only-banner"
        className="flex items-center gap-3 p-4 rounded-2xl bg-gold/10 border border-gold/30 text-gold backdrop-blur-xl shadow-[0_4px_24px_rgba(245,158,11,0.15)]"
      >
        <Shield className="w-5 h-5 flex-shrink-0 text-gold" />
        <div className="text-xs sm:text-sm">
          <span className="font-semibold tracking-wide uppercase font-mono mr-2">
            Non-Negotiable Rule:
          </span>
          Metadata only: payload content is never shown, stored, or transmitted to the client.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/15 rounded-3xl p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Actor */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-actor" className="text-xs font-mono text-muted">
                Actor:
              </label>
              <select
                id="filter-actor"
                value={filters.actor}
                onChange={(e) => setFilter("actor", e.target.value)}
                className="bg-black/40 border border-white/15 text-text rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/40 transition-all"
              >
                <option value="all">All Actors</option>
                <option value="red">Red Cell</option>
                <option value="blue">Blue Evaluator</option>
                <option value="model">Model Cell</option>
                <option value="broker">Policy Broker</option>
                <option value="ledger">Ledger</option>
                <option value="operator">Operator</option>
              </select>
            </div>

            {/* Filter by Outcome */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-outcome" className="text-xs font-mono text-muted">
                Outcome:
              </label>
              <select
                id="filter-outcome"
                value={filters.outcome}
                onChange={(e) => setFilter("outcome", e.target.value)}
                className="bg-black/40 border border-white/15 text-text rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/40 transition-all"
              >
                <option value="all">All Outcomes</option>
                <option value="allowed">Allowed</option>
                <option value="blocked">Blocked</option>
                <option value="denied">Denied</option>
              </select>
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-type" className="text-xs font-mono text-muted">
                Type:
              </label>
              <select
                id="filter-type"
                value={filters.type}
                onChange={(e) => setFilter("type", e.target.value)}
                className="bg-black/40 border border-white/15 text-text rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/40 transition-all"
              >
                <option value="all">All Types</option>
                <option value="request">request</option>
                <option value="verdict">verdict</option>
                <option value="model_call">model_call</option>
                <option value="breach_attempt">breach_attempt</option>
                <option value="ledger_append">ledger_append</option>
                <option value="audit">audit</option>
                <option value="run">run</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(filters.actor !== "all" ||
              filters.outcome !== "all" ||
              filters.type !== "all" ||
              filters.search) && (
              <button
                id="reset-filters-btn"
                onClick={resetFilters}
                className="text-xs text-gold hover:underline flex items-center gap-1 ml-1"
              >
                <Filter className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Search Input & Buffer Counter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="search-events-input"
                type="text"
                placeholder="Search boundary or id..."
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className="bg-black/40 border border-white/15 text-text rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/40 transition-all w-48"
              />
            </div>

            <div
              id="event-buffer-counter"
              className="text-xs font-mono text-muted bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md"
            >
              <span className="text-text font-bold">{filteredEvents.length}</span> / {events.length} (max 2,000)
            </div>
          </div>
        </div>

        {/* Live Event Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/15 bg-black/25">
          <table id="event-feed-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10 text-muted font-mono uppercase text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Time (UTC)</th>
                <th className="py-2.5 px-4 font-semibold">Event ID</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Actor</th>
                <th className="py-2.5 px-4 font-semibold">Boundary Link</th>
                <th className="py-2.5 px-4 font-semibold">Outcome</th>
                <th className="py-2.5 px-4 font-semibold text-right">Ledger Seq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <p className="text-sm font-sans mb-1">No events match the current filter.</p>
                    <p className="text-xs text-muted/80">
                      Live events will appear automatically as container traffic flows.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 500).map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-surface-2/60 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-2 px-4 whitespace-nowrap text-muted">
                      {formatTimestamp(evt.ts)}
                    </td>

                    {/* Event ID */}
                    <td className="py-2 px-4 font-semibold text-text whitespace-nowrap">
                      {evt.id}
                    </td>

                    {/* Type */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.06] text-muted border border-white/[0.08]">
                        {evt.type}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded border text-[11px] font-semibold uppercase",
                          actorColor(evt.actor)
                        )}
                      >
                        {evt.actor}
                      </span>
                    </td>

                    {/* Boundary */}
                    <td className="py-2 px-4 whitespace-nowrap text-text">
                      <span className="flex items-center gap-1.5 font-mono">
                        {evt.boundary}
                      </span>
                    </td>

                    {/* Outcome Badge */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      {outcomeBadge(evt.outcome)}
                    </td>

                    {/* Ledger Seq */}
                    <td className="py-2 px-4 whitespace-nowrap text-right">
                      {evt.ledger_seq !== null ? (
                        <Link
                          to={`/ledger#seq-${evt.ledger_seq}`}
                          className="inline-flex items-center gap-1 text-gold hover:text-gold/80 hover:underline font-semibold"
                        >
                          #{evt.ledger_seq}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredEvents.length > 500 && (
          <div className="text-center text-xs text-muted py-2">
            Showing latest 500 of {filteredEvents.length} events for optimal performance.
          </div>
        )}
      </div>
    </div>
  );
};
