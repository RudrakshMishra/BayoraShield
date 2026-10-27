import { describe, it, expect } from "vitest";
import {
  AppEvent,
  User,
  LedgerEntry,
  LedgerHead,
  VerifyResult,
  BreachResult,
  Metric,
  AuditResult,
  Run,
} from "../../src/api/schemas";

describe("Zod Schemas Strict Validation (Metadata Only Enforcement)", () => {
  describe("AppEvent Schema", () => {
    const validEvent = {
      id: "evt_000123",
      ts: "2026-10-27T10:15:30.120Z",
      type: "request",
      actor: "red",
      boundary: "red->broker",
      outcome: "allowed",
      ledger_seq: 4521,
    };

    it("accepts a valid metadata event", () => {
      const parsed = AppEvent.safeParse(validEvent);
      expect(parsed.success).toBe(true);
    });

    it("rejects when an unauthorized 'payload' field is injected", () => {
      const withPayload = {
        ...validEvent,
        payload: "SELECT * FROM secrets",
      };
      const parsed = AppEvent.safeParse(withPayload);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0].code).toBe("unrecognized_keys");
      }
    });

    it("rejects when an unauthorized 'prompt' field is injected", () => {
      const withPrompt = {
        ...validEvent,
        prompt: "System prompt leak",
      };
      const parsed = AppEvent.safeParse(withPrompt);
      expect(parsed.success).toBe(false);
    });

    it("rejects an invalid actor enum", () => {
      const badActor = { ...validEvent, actor: "malicious_hacker" };
      const parsed = AppEvent.safeParse(badActor);
      expect(parsed.success).toBe(false);
    });

    it("rejects an invalid outcome enum", () => {
      const badOutcome = { ...validEvent, outcome: "permitted" };
      const parsed = AppEvent.safeParse(badOutcome);
      expect(parsed.success).toBe(false);
    });

    it("rejects an invalid timestamp format", () => {
      const badTimestamp = { ...validEvent, ts: "yesterday at 5pm" };
      const parsed = AppEvent.safeParse(badTimestamp);
      expect(parsed.success).toBe(false);
    });
  });

  describe("User Schema", () => {
    it("accepts valid user object", () => {
      const user = { username: "admin", role: "admin", demo_controls: true };
      const parsed = User.safeParse(user);
      expect(parsed.success).toBe(true);
    });

    it("rejects unknown fields in user", () => {
      const user = { username: "admin", role: "admin", demo_controls: true, token: "secret" };
      const parsed = User.safeParse(user);
      expect(parsed.success).toBe(false);
    });
  });

  describe("LedgerEntry Schema", () => {
    const validEntry = {
      seq: 1,
      ts: "2026-10-27T10:15:30.120Z",
      cell: "red",
      action: "emit_request",
      payload_hash: "a1b2c3d4e5f67890",
      prev_hash: "0000000000000000",
      entry_hash: "1234567890abcdef",
      sig: "abcdef1234567890",
      meta: { request_id: "req_1", attempt: 1 },
    };

    it("accepts a valid ledger entry", () => {
      expect(LedgerEntry.safeParse(validEntry).success).toBe(true);
    });

    it("rejects invalid non-hex hash values", () => {
      const badHash = { ...validEntry, entry_hash: "not_a_hex_hash!_#$" };
      expect(LedgerEntry.safeParse(badHash).success).toBe(false);
    });

    it("rejects payload field on top-level", () => {
      const withPayload = { ...validEntry, payload: "unauthorized" };
      expect(LedgerEntry.safeParse(withPayload).success).toBe(false);
    });
  });

  describe("LedgerHead & VerifyResult Schemas", () => {
    it("validates LedgerHead correctly", () => {
      const head = {
        seq: 42,
        entry_hash: "1234567890abcdef",
        count: 42,
        anchored_at: "2026-10-27T10:15:30.120Z",
      };
      expect(LedgerHead.safeParse(head).success).toBe(true);
    });

    it("validates VerifyResult correctly", () => {
      const verify = {
        ok: true,
        checked: 42,
        first_bad_seq: null,
        reason: null,
        head_hash: "1234567890abcdef",
      };
      expect(VerifyResult.safeParse(verify).success).toBe(true);
    });
  });

  describe("BreachResult Schema", () => {
    it("validates BreachResult correctly", () => {
      const breach = {
        test_id: "B01",
        name: "Blue reads Red's payload directory",
        attempt: "mount probe",
        baseline: "succeeded",
        shield: "blocked",
        control: "Per-cell mounts",
      };
      expect(BreachResult.safeParse(breach).success).toBe(true);
    });

    it("rejects invalid attempt status", () => {
      const bad = {
        test_id: "B01",
        name: "Test",
        attempt: "test",
        baseline: "passed", // invalid enum, must be succeeded/blocked/n/a
        shield: "blocked",
        control: "Control",
      };
      expect(BreachResult.safeParse(bad).success).toBe(false);
    });
  });

  describe("Metric, AuditResult, and Run Schemas", () => {
    it("validates Metric correctly", () => {
      const metric = {
        name: "Canary crossings",
        value: 0,
        unit: "count",
        n: 100,
        group: "leakage",
      };
      expect(Metric.safeParse(metric).success).toBe(true);
    });

    it("validates AuditResult correctly", () => {
      const audit = {
        invariant: "Read-only root FS",
        status: "pass",
        detail: "Container root mounted read-only",
      };
      expect(AuditResult.safeParse(audit).success).toBe(true);
    });

    it("validates Run correctly", () => {
      const run = {
        id: "run_001",
        mode: "both",
        status: "running",
        started_at: "2026-10-27T10:15:30.120Z",
        finished_at: null,
        dataset_hash: "abcdef123456",
        model_hash: "123456abcdef",
        policy_version: "v1.0.0",
      };
      expect(Run.safeParse(run).success).toBe(true);
    });
  });
});
