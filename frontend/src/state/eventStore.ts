import { create } from "zustand";
import { AppEvent, type AppEventT, type ActorT, type OutcomeT, type EventTypeT } from "../api/schemas";
import { sseRegistry } from "../api/sse";

export const MAX_EVENT_BUFFER = 2000;

export interface TopologyPacket {
  id: string;
  source: string;
  target: string;
  outcome: OutcomeT;
  type: EventTypeT;
  boundary: string;
  timestamp: number;
}

export interface NodeStats {
  requests: number;
  blocked: number;
  denied: number;
  allowed: number;
}

export interface EventFilters {
  actor: string;
  outcome: string;
  type: string;
  search: string;
}

interface EventState {
  events: AppEventT[];
  isPaused: boolean;
  stack: "shield" | "baseline";
  isConnected: boolean;
  error: string | null;
  lastEvent: AppEventT | null;
  activePackets: TopologyPacket[];
  nodeStats: Record<ActorT, NodeStats>;
  filters: EventFilters;

  // Actions
  connect: (stack?: "shield" | "baseline") => void;
  disconnect: () => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setStack: (stack: "shield" | "baseline") => void;
  setFilter: (key: keyof EventFilters, value: string) => void;
  resetFilters: () => void;
  clearEvents: () => void;
  addEvent: (raw: unknown) => boolean;
  removePacket: (packetId: string) => void;
}

const initialNodeStats: Record<ActorT, NodeStats> = {
  red: { requests: 0, blocked: 0, denied: 0, allowed: 0 },
  blue: { requests: 0, blocked: 0, denied: 0, allowed: 0 },
  model: { requests: 0, blocked: 0, denied: 0, allowed: 0 },
  broker: { requests: 0, blocked: 0, denied: 0, allowed: 0 },
  ledger: { requests: 0, blocked: 0, denied: 0, allowed: 0 },
  operator: { requests: 0, blocked: 0, denied: 0, allowed: 0 },
};

const initialFilters: EventFilters = {
  actor: "all",
  outcome: "all",
  type: "all",
  search: "",
};

let currentEventSource: EventSource | null = null;
let reconnectTimer: any = null;

function parseBoundaryToNodes(boundary: string, actor: ActorT): { source: string; target: string } {
  if (boundary.includes("->")) {
    const [rawSrc, rawTgt] = boundary.split("->");
    return {
      source: rawSrc.trim(),
      target: rawTgt.trim(),
    };
  }
  return {
    source: actor,
    target: "broker",
  };
}

let mockEventTimer: any = null;
let mockSeq = 4500;

function startMockStream(get: any, set: any, stack: "shield" | "baseline") {
  if (mockEventTimer) return;
  set({ isConnected: true, error: null });
  mockEventTimer = setInterval(() => {
    mockSeq++;
    const actors = ["red", "broker", "blue", "model"] as const;
    const boundaries = ["red->broker", "broker->blue", "broker->model", "broker->ledger"] as const;
    const actor = actors[mockSeq % actors.length];
    const boundary = boundaries[mockSeq % boundaries.length];
    const isBreach = mockSeq % 4 === 0;

    get().addEvent({
      id: `evt_sim_${mockSeq}`,
      ts: new Date().toISOString(),
      type: isBreach ? "breach_attempt" : "verdict",
      actor: isBreach ? "red" : actor,
      boundary: isBreach ? "red->blue" : boundary,
      outcome: isBreach ? (stack === "shield" ? "blocked" : "allowed") : "allowed",
      ledger_seq: mockSeq,
    });
  }, 1400);
}

function stopMockStream() {
  if (mockEventTimer) {
    clearInterval(mockEventTimer);
    mockEventTimer = null;
  }
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isPaused: false,
  stack: "shield",
  isConnected: false,
  error: null,
  lastEvent: null,
  activePackets: [],
  nodeStats: { ...initialNodeStats },
  filters: { ...initialFilters },

  connect: (targetStack) => {
    const stack = targetStack || get().stack;
    get().disconnect();

    set({ stack, error: null });

    const url = `/api/events?stack=${encodeURIComponent(stack)}`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(url, { withCredentials: true });
      currentEventSource = es;
      const unregister = sseRegistry.register(es);

      es.onopen = () => {
        stopMockStream();
        set({ isConnected: true, error: null });
      };

      es.onmessage = (msgEvent) => {
        try {
          if (!msgEvent.data || msgEvent.data.startsWith(":")) return;
          const parsedJson = JSON.parse(msgEvent.data);
          get().addEvent(parsedJson);
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Failed to parse SSE JSON payload:", err);
          }
        }
      };

      es.onerror = () => {
        unregister();
        if (es) {
          es.close();
        }
        if (currentEventSource === es) {
          currentEventSource = null;
        }
        // Fallback to simulated mock stream for static Netlify deployments
        startMockStream(get, set, stack);
      };
    } catch {
      startMockStream(get, set, stack);
    }
  },

  disconnect: () => {
    stopMockStream();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (currentEventSource) {
      sseRegistry.unregister(currentEventSource);
      currentEventSource.close();
      currentEventSource = null;
    }
    set({ isConnected: false });
  },

  setPaused: (paused) => set({ isPaused: paused }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setStack: (stack) => {
    if (get().stack === stack) return;
    set({ stack });
    get().connect(stack);
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: { ...initialFilters } }),

  clearEvents: () =>
    set({
      events: [],
      activePackets: [],
      lastEvent: null,
      nodeStats: { ...initialNodeStats },
    }),

  addEvent: (raw) => {
    // Non-negotiable Rule 1: Metadata only. .strict() Zod schema validation
    const validation = AppEvent.safeParse(raw);
    if (!validation.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "METADATA-ONLY SECURITY VIOLATION: Dropping event with invalid or forbidden fields:",
          validation.error.message
        );
      }
      return false;
    }

    const event = validation.data;
    const { isPaused, activePackets } = get();

    // Determine packet animation details
    const { source, target } = parseBoundaryToNodes(event.boundary, event.actor);
    const newPacket: TopologyPacket = {
      id: `${event.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      source,
      target,
      outcome: event.outcome,
      type: event.type,
      boundary: event.boundary,
      timestamp: Date.now(),
    };

    // Update node statistics
    const currentStats = get().nodeStats[event.actor] || {
      requests: 0,
      blocked: 0,
      denied: 0,
      allowed: 0,
    };

    const updatedNodeStats = {
      ...get().nodeStats,
      [event.actor]: {
        requests: currentStats.requests + 1,
        allowed: currentStats.allowed + (event.outcome === "allowed" ? 1 : 0),
        blocked: currentStats.blocked + (event.outcome === "blocked" ? 1 : 0),
        denied: currentStats.denied + (event.outcome === "denied" ? 1 : 0),
      },
    };

    // Limit active packets for performance (keep latest 12)
    const updatedPackets = [...activePackets.slice(-11), newPacket];

    // If paused, update topology packets and counters, but don't add to event table
    if (isPaused) {
      set({
        lastEvent: event,
        activePackets: updatedPackets,
        nodeStats: updatedNodeStats,
      });
      return true;
    }

    // Keep at most MAX_EVENT_BUFFER events (latest first)
    const updatedEvents = [event, ...get().events];
    if (updatedEvents.length > MAX_EVENT_BUFFER) {
      updatedEvents.length = MAX_EVENT_BUFFER;
    }

    set({
      events: updatedEvents,
      lastEvent: event,
      activePackets: updatedPackets,
      nodeStats: updatedNodeStats,
    });

    return true;
  },

  removePacket: (packetId) =>
    set((state) => ({
      activePackets: state.activePackets.filter((p) => p.id !== packetId),
    })),
}));
