import { z } from "zod";

export const Role = z.enum(["viewer", "operator", "admin"]);

export const User = z
  .object({ username: z.string(), role: Role, demo_controls: z.boolean() })
  .strict();

export const Outcome = z.enum(["allowed", "blocked", "denied"]);
export const Actor = z.enum(["red", "blue", "model", "broker", "ledger", "operator"]);
export const EventType = z.enum([
  "request", "verdict", "model_call", "breach_attempt", "ledger_append", "audit", "run",
]);

export const AppEvent = z
  .object({
    id: z.string(),
    ts: z.string().datetime(),
    type: EventType,
    actor: Actor,
    boundary: z.string().max(64),
    outcome: Outcome,
    ledger_seq: z.number().int().nullable(),
  })
  .strict();

const Hex = z.string().regex(/^[0-9a-f]+$/);

export const LedgerEntry = z
  .object({
    seq: z.number().int(),
    ts: z.string().datetime(),
    cell: z.string(),
    action: z.string(),
    payload_hash: Hex.nullable(),
    prev_hash: Hex,
    entry_hash: Hex,
    sig: Hex,
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict();

export const LedgerHead = z
  .object({
    seq: z.number().int(),
    entry_hash: Hex,
    count: z.number().int(),
    anchored_at: z.string().datetime().nullable(),
  })
  .strict();

export const VerifyResult = z
  .object({
    ok: z.boolean(),
    checked: z.number().int(),
    first_bad_seq: z.number().int().nullable(),
    reason: z.string().nullable(),
    head_hash: Hex,
  })
  .strict();

const Attempt = z.enum(["succeeded", "blocked", "n/a"]);

export const BreachResult = z
  .object({
    test_id: z.string(),
    name: z.string(),
    attempt: z.string(),
    baseline: Attempt,
    shield: Attempt,
    control: z.string(),
  })
  .strict();

export const Metric = z
  .object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    n: z.number().int(),
    group: z.enum(["latency", "leakage", "integrity", "defense"]),
  })
  .strict();

export const AuditResult = z
  .object({ invariant: z.string(), status: z.enum(["pass", "fail"]), detail: z.string() })
  .strict();

export const Run = z
  .object({
    id: z.string(),
    mode: z.enum(["baseline", "shield", "both"]),
    status: z.enum(["pending", "running", "finished", "failed"]),
    started_at: z.string().datetime(),
    finished_at: z.string().datetime().nullable(),
    dataset_hash: Hex,
    model_hash: Hex,
    policy_version: z.string(),
  })
  .strict();

export const ApiError = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .strict();

export type RoleT = z.infer<typeof Role>;
export type UserT = z.infer<typeof User>;
export type OutcomeT = z.infer<typeof Outcome>;
export type ActorT = z.infer<typeof Actor>;
export type EventTypeT = z.infer<typeof EventType>;
export type AppEventT = z.infer<typeof AppEvent>;
export type LedgerEntryT = z.infer<typeof LedgerEntry>;
export type LedgerHeadT = z.infer<typeof LedgerHead>;
export type VerifyResultT = z.infer<typeof VerifyResult>;
export type AttemptT = z.infer<typeof Attempt>;
export type BreachResultT = z.infer<typeof BreachResult>;
export type MetricT = z.infer<typeof Metric>;
export type AuditResultT = z.infer<typeof AuditResult>;
export type RunT = z.infer<typeof Run>;
export type ApiErrorT = z.infer<typeof ApiError>;
