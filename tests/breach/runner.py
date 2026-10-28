"""Deterministic breach result fixture runner.

This runner makes the expected comparison explicit for local demos. It does not
claim live container isolation; run the Linux integration harness separately.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


EXPECTED = {
    "baseline": {"succeeded": 12, "n/a": 2},
    "shield": {"blocked": 14},
}


def load_fixture() -> dict:
    return json.loads(
        (Path(__file__).resolve().parents[2] / "frontend/mock/fixtures/breach.json").read_text(
            encoding="utf-8"
        )
    )


def summarize(results: list[dict]) -> dict:
    return {
        "baseline": {status: sum(item["baseline"] == status for item in results) for status in ("succeeded", "blocked", "n/a")},
        "shield": {status: sum(item["shield"] == status for item in results) for status in ("succeeded", "blocked", "n/a")},
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stack", choices=("baseline", "shield", "both"), default="both")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    fixture = load_fixture()
    summary = summarize(fixture["results"])
    selected = ("baseline", "shield") if args.stack == "both" else (args.stack,)
    result = {
        "run_id": fixture["run_id"],
        "stack": args.stack,
        "simulated": True,
        "results": fixture["results"],
        "summary": {stack: summary[stack] for stack in selected},
        "expected": {stack: EXPECTED[stack] for stack in selected},
    }
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
