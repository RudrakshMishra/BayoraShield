# BayoraShield — Market Requirements Document (MRD) v2

Status: v2.0, 2026-10-28 (updated after reading the design chat)
Scope note: hackathon-grade MRD with **no market-size figures** because none were sourced; add cited numbers in section 10 if the submission needs them. Tools named in section 5 are examples from general knowledge; verify current features before citing publicly.

## 1. Market context
Adversarial testing of AI systems (red-teaming, jailbreak and prompt-injection evaluation, defense benchmarking) is becoming routine, and regulators and standards bodies are pushing toward rigorous, repeatable safety evidence. The hackathon track (Track 04) frames the problem as secure isolation for adversarial AI safety testing.

## 2. The gap
Attacker, defender and model usually share one environment. Leakage through shared volumes, shared networks, shared caches, observable timing or editable logs can make a defense look better (or an attack worse) than it is. Today's assurance is "we were careful". There is no lightweight, demonstrable proof that the test environment itself was sealed.

## 3. Positioning in one line
BayoraShield makes adversarial AI safety tests trustworthy by sealing the cells **and proving it**: the same attack runs in a naive shared Docker setup (leaks succeed) and in BayoraShield (blocked and logged), and the evidence is tamper-evident and verifiable. It is a proof of concept on standard infrastructure; confidential VMs and dedicated GPUs are the next step.

## 4. Target segments
| Segment | Why they care | Priority |
|---|---|---|
| Hackathon judges and mentors | See isolation working and trust the numbers in minutes | Primary now |
| AI safety / red-team teams | Trustworthy findings, clean Red/Blue separation | Primary next |
| Teams running adversarial benchmarks or competitions | Stop participants seeing each other's payloads and defenses | Secondary |
| Auditors / regulators / compliance reviewers | Tamper-evident record of how a test was run | Secondary |

## 5. Alternatives and the gap BayoraShield fills
| Alternative | Gives | Gap |
|---|---|---|
| Plain Docker/Compose (this is literally the Baseline stack) | Process isolation, easy | No mediated channel, no tamper-evident log, no proof, easy to misconfigure |
| Stronger sandboxes (gVisor, Firecracker-class microVMs) | Stronger kernel isolation | Infrastructure only; no Red/Blue/Model protocol, ledger or evidence UI. gVisor is optional in this build |
| LLM eval / red-team harnesses | Run attacks, score models | Assume a trusted environment; do not prove no leakage |
| Confidential computing (TEEs, confidential VMs) | Hardware-backed isolation | Heavy, not universally available; roadmap |
| Manual process | Free | Not verifiable |

## 6. Value proposition and differentiators
1. One audited channel (Policy Broker) between sealed cells, including a Blue evaluator with no network at all.
2. Signed, hash-chained ledger that can be broken live and re-verified, with an honest statement of what it cannot catch (truncation without an anchor).
3. Side-by-side Baseline vs Shield on 14 identical breach tests, plus canary scanning.
4. Measured numbers with sample sizes, and a threat model that states residual risk.
5. `bayora-audit`: isolation rules are checked automatically, not trusted.
Tone: calm security console, evidence first, no hype.

## 7. Go-to-market path
1. **Now:** live demo, saved snapshot, backup video, public repo with README and threat model.
2. **Next:** open-source the harness and breach suite so others can reproduce Baseline vs Shield.
3. **Later (roadmap from the chat):** mTLS between cells, Falco monitoring, OPA policies, OpenTimestamps anchoring, gVisor runtime, Grafana, then confidential VMs and dedicated GPUs, multi-party ledger signing and a public transparency log.

## 8. Market-driven requirements
| ID | Requirement | Reason |
|---|---|---|
| MR-01 | One command to start on a Linux machine (`make up`) | Judges and adopters will not tolerate heavy setup |
| MR-02 | Every claim backed by a measured number with `n` | Trust is the product |
| MR-03 | Honest threat model, shown in the UI | Over-claiming destroys credibility with security-literate judges |
| MR-04 | Offline fallbacks: mock mode, snapshot JSON, recorded video | Demo environments fail |
| MR-05 | Metadata only by design | Teams will not put real attack/defense material into a tool that stores it |
| MR-06 | Inspectable evidence (ledger, `bayora-audit` output, JSON snapshot) | Auditors need artifacts, not screenshots |
| MR-07 | Public benchmark data only (JailbreakBench, AdvBench, HarmBench, Gandalf subsets); licences checked | Avoids IP and misuse issues |

## 9. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Judges see "just Docker" | Lower score | Lead with split screen, the tamper moment and measured results |
| Over-claiming protections | Credibility loss | Threat model, "DETECTED / NOT DISTINGUISHABLE" wording for B12/B13, `n` everywhere, never claim without a test |
| Demo environment fails | Lost demo | Mock mode, snapshot, pre-recorded video |
| gVisor / Falco unsupported on the host | Weaker story | Hardening flags + seccomp; custom violation reporter; show as roadmap |
| Model too slow on CPU | Slow demo | Smaller model, 64–128 token cap, fewer test prompts |
| Two-person team runs out of time | Missing live mode | Mock-first frontend, milestone cut order (PLAN2), never cut breach suite, canaries, ledger verifier, Baseline comparison, `bayora-audit` |
| Weak statistics on side channels | Judge challenge | Report AUC/KS with sample size; state plainly what is not covered |

## 10. Evidence still needed (add only with citations)
- Size and growth of AI-safety / red-teaming tooling.
- Specific regulatory provisions requiring auditable safety testing.
- Published incidents of evaluation leakage.
- Licence terms of the chosen model, classifier and benchmark subsets.
