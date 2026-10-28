"""Metadata-only canary scanner for recorded observable surfaces."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def canary_hash(value: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{value}".encode()).hexdigest()


def scan_surfaces(surfaces: dict[str, str], canary_hashes: dict[str, str], salt: str) -> list[dict[str, str]]:
    crossings = []
    for surface, content in surfaces.items():
        for owner, digest in canary_hashes.items():
            if canary_hash(content, salt) == digest:
                crossings.append({"surface": surface, "owner": owner})
    return crossings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    args = parser.parse_args()
    record = json.loads(args.input.read_text(encoding="utf-8"))
    crossings = scan_surfaces(record["surfaces"], record["canary_hashes"], record["salt"])
    print(json.dumps({"crossings": crossings, "count": len(crossings)}, sort_keys=True))
    return 1 if crossings else 0


if __name__ == "__main__":
    raise SystemExit(main())
