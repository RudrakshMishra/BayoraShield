import { describe, it, expect, beforeEach, vi } from "vitest";
import { useEventStore, MAX_EVENT_BUFFER } from "../../src/state/eventStore";

describe("useEventStore", () => {
  beforeEach(() => {
    useEventStore.getState().clearEvents();
    useEventStore.setState({ isPaused: false, stack: "shield" });
  });

  it("adds valid metadata events to state", () => {
    const validEvent = {
      id: "evt_001",
      ts: new Date().toISOString(),
      type: "request",
      actor: "red",
      boundary: "red->broker",
      outcome: "allowed",
      ledger_seq: 101,
    };

    const added = useEventStore.getState().addEvent(validEvent);
    expect(added).toBe(true);

    const state = useEventStore.getState();
    expect(state.events.length).toBe(1);
    expect(state.events[0].id).toBe("evt_001");
    expect(state.nodeStats.red.requests).toBe(1);
    expect(state.nodeStats.red.allowed).toBe(1);
  });

  it("REJECTS and drops any event containing payload or forbidden fields (Rule 1: Metadata Only)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const forbiddenEvent = {
      id: "evt_002",
      ts: new Date().toISOString(),
      type: "request",
      actor: "red",
      boundary: "red->broker",
      outcome: "allowed",
      ledger_seq: 102,
      payload: "SELECT * FROM secrets", // Forbidden field
    };

    const added = useEventStore.getState().addEvent(forbiddenEvent);
    expect(added).toBe(false);

    const state = useEventStore.getState();
    expect(state.events.length).toBe(0);

    consoleSpy.mockRestore();
  });

  it("caps in-memory event buffer at exactly 2,000 events", () => {
    const ts = new Date().toISOString();
    // Add 2,050 events
    for (let i = 0; i < 2050; i++) {
      useEventStore.getState().addEvent({
        id: `evt_${i}`,
        ts,
        type: "request",
        actor: "broker",
        boundary: "broker->model",
        outcome: "allowed",
        ledger_seq: i,
      });
    }

    const state = useEventStore.getState();
    expect(state.events.length).toBe(MAX_EVENT_BUFFER);
    expect(state.events.length).toBe(2000);
    // Newest is first
    expect(state.events[0].id).toBe("evt_2049");
  });

  it("does not add events to event feed table when paused, but updates counters and packets", () => {
    useEventStore.getState().setPaused(true);

    const validEvent = {
      id: "evt_paused_1",
      ts: new Date().toISOString(),
      type: "verdict",
      actor: "blue",
      boundary: "broker->blue",
      outcome: "blocked",
      ledger_seq: null,
    };

    const added = useEventStore.getState().addEvent(validEvent);
    expect(added).toBe(true);

    const state = useEventStore.getState();
    expect(state.events.length).toBe(0); // Paused, not added to list
    expect(state.nodeStats.blue.blocked).toBe(1);
    expect(state.activePackets.length).toBeGreaterThan(0);
  });

  it("filters events by actor and outcome", () => {
    const ts = new Date().toISOString();
    useEventStore.getState().addEvent({
      id: "e1",
      ts,
      type: "request",
      actor: "red",
      boundary: "red->broker",
      outcome: "allowed",
      ledger_seq: 1,
    });
    useEventStore.getState().addEvent({
      id: "e2",
      ts,
      type: "breach_attempt",
      actor: "red",
      boundary: "red->blue",
      outcome: "blocked",
      ledger_seq: 2,
    });
    useEventStore.getState().addEvent({
      id: "e3",
      ts,
      type: "verdict",
      actor: "blue",
      boundary: "broker->blue",
      outcome: "allowed",
      ledger_seq: 3,
    });

    useEventStore.getState().setFilter("actor", "red");
    expect(useEventStore.getState().filters.actor).toBe("red");

    useEventStore.getState().setFilter("outcome", "blocked");
    expect(useEventStore.getState().filters.outcome).toBe("blocked");
  });
});
