# BayoraShield Threat Model

BayoraShield is a proof-of-concept isolation layer for adversarial AI safety testing. The dashboard intentionally exposes metadata only: payload text, classifier rules, model weights, and secrets are not part of the browser contract.

## Protects against

- Direct Red-to-Blue and cell-to-cell network access when the shield stack is validated with the hardened compose configuration.
- Accidental shared filesystem access through per-cell mounts.
- Internet and external DNS access through internal-only networks.
- Evaluator networking through `network_mode: none` and the Broker-only Unix socket channel.
- Editable audit history through a signed, hash-chained ledger and verification tool.
- Forged, expired, replayed, and over-budget Broker requests through capability tokens, nonces, and budgets.

## Not fully covered

- Host-kernel, hypervisor, hardware side-channel, malicious cloud-operator, compromised Broker, and compromised signing-key threats.
- New vulnerabilities in Docker, Linux, model runtimes, dependencies, or the host VM.
- Truncating the newest ledger entries without an external anchor or signed count.
- Timing leakage beyond the measured experiment and sample size.
- Production multi-tenant scale and operational identity management.

## Roadmap

mTLS, gVisor or microVM execution, Falco monitoring, OPA policies, OpenTimestamps anchoring, Vault, transparency-log anchoring, and confidential VMs.

## Guarantees may fail if

The stack is changed without rerunning `bayora-audit` and the breach suite, a privileged container or Docker socket is introduced, a cell is attached to an unexpected network or shared volume, credentials are exposed, or the Linux host/runtime violates the assumptions documented for the demo.

All dashboard values in mock mode are labelled **SIMULATED**. A passing mock test demonstrates the contract and UI behavior; it does not by itself prove host isolation.
