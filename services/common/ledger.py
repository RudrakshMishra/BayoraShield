"""Shared deterministic hash-chain ledger primitives.

Only metadata and salted payload hashes belong in ledger entries. This module is
usable by the service, CLI verifier, and unit tests without a database.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any

GENESIS_HASH = "0" * 64


def canonical_json(value: dict[str, Any]) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def entry_hash(entry: dict[str, Any]) -> str:
    body = {key: value for key, value in entry.items() if key not in {"entry_hash", "sig"}}
    return hashlib.sha256((body.get("prev_hash", GENESIS_HASH) + canonical_json(body).decode()).encode()).hexdigest()


def verify_chain(entries: list[dict[str, Any]]) -> tuple[bool, int | None, str | None]:
    previous = GENESIS_HASH
    expected_seq = 1
    for entry in entries:
        seq = entry.get("seq")
        if seq != expected_seq:
            return False, seq if isinstance(seq, int) else expected_seq, "sequence gap or reorder"
        if entry.get("prev_hash") != previous:
            return False, seq, "previous hash does not match preceding entry"
        if entry.get("entry_hash") != entry_hash(entry):
            return False, seq, "entry hash mismatch"
        previous = entry["entry_hash"]
        expected_seq += 1
    return True, None, None


def make_entry(seq: int, previous: str, *, cell: str, action: str, payload_hash: str | None = None, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    entry = {"seq": seq, "cell": cell, "action": action, "payload_hash": payload_hash, "prev_hash": previous, "meta": meta or {}}
    entry["entry_hash"] = entry_hash(entry)
    return entry
