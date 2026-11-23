# Kyle · Loxihart & Abstrekkt

Builder in Chicago, IL working on Loxihart and [Abstrekkt](https://abstrekkt.com). AI tools, checked against real work.

## Open-source distributions

| Repository | Role | Stack and install |
| --- | --- | --- |
| [Krosebrook/loxihart-skills](https://github.com/Krosebrook/loxihart-skills) | Loxihart Toolchest (Skill Foundry) | 98 Claude Code skills across five domain plugins (`/plugin marketplace add Krosebrook/loxihart-skills`) |
| [Krosebrook/augmentor-packs](https://github.com/Krosebrook/augmentor-packs) | Loxihart Ballast (Cadence Packs) | 15 human-first coaching packs plus 5 stdio MCP add-ons (`/plugin marketplace add Krosebrook/augmentor-packs`) |
| [Krosebrook/loxihart-ratchet](https://github.com/Krosebrook/loxihart-ratchet) | Loxihart Ratchet (Pawl Ledger) | Checkpoint-driven AI coding skills backed by a local git evidence ledger |
| [Civic Compass Plugin](https://github.com/Krosebrook/navigating-ai-reality-plugin) | Civic Compass (Reality Lens v3.0) | 11-tool stateless MCP 2025.11 server and citizen safety plugin (`python3 reality_lens_http_app.py`) |

## Account infrastructure

| Surface | Repository or URL | Purpose |
| --- | --- | --- |
| Developer site | [krosebrook.github.io](https://krosebrook.github.io) ([source](https://github.com/Krosebrook/krosebrook.github.io)) | Static project index, install commands, `llms.txt`, and GitHub Pages bundle |
| Account defaults | [Krosebrook/.github](https://github.com/Krosebrook/.github) | Default `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, YAML Issue Forms, and PR checklist |
| Org defaults | [ChaosClubCo/.github](https://github.com/ChaosClubCo/.github) | Organization profile and default governance templates for [ChaosClubCo](https://github.com/ChaosClubCo) |
| Codespaces dotfiles | [Krosebrook/dotfiles](https://github.com/Krosebrook/dotfiles) | Idempotent shell bootstrap and Git config include for GitHub Codespaces |
| Public gists | [gist.github.com/Krosebrook](https://gist.github.com/Krosebrook) | Zero-dependency parsers, WCAG 2.2 AA React primitives, MCP probes, and CI audit scripts |

## Working rules

1. Small checkpoints with local verification evidence before merge.
2. Commit-SHA pinning on third-party and GitHub Actions workflows with read-only default `GITHUB_TOKEN` permissions.
3. Explicit separation between sourced evidence and generated estimates during code and document review.
4. WCAG 2.2 AA keyboard, focus, and live-region parity on interactive UI primitives.

## Curated gist pack in this repository

The [`gists/`](gists/MANIFEST.json) directory versions self-tested single-file utilities alongside [`scripts/sync-gists.sh`](scripts/sync-gists.sh) so new and updated snippets sync cleanly to [GitHub Gist](https://gist.github.com/Krosebrook) via the `gh` CLI:

- [`gists/mcp-streamable-http-probe/mcp_probe.mjs`](gists/mcp-streamable-http-probe/mcp_probe.mjs) verifies `/health`, unauthenticated `401` rejection, and JSON-RPC `initialize` + `tools/list` on Streamable HTTP MCP endpoints.
- [`gists/gha-sha-pin-audit/pin_audit.py`](gists/gha-sha-pin-audit/pin_audit.py) scans `.github/workflows/*.yml` for mutable tag references (`@v4`, `@main`) and missing top-level `permissions:` blocks.
- [`gists/dns-ssrf-guard/ssrf_guard.mjs`](gists/dns-ssrf-guard/ssrf_guard.mjs) blocks loopback, RFC1918, link-local, cloud metadata, and IPv4-mapped IPv6 targets before outbound webhook or MCP fetches.
- [`gists/agent-context-template/AGENT_SESSION_HANDOFF.md`](gists/agent-context-template/AGENT_SESSION_HANDOFF.md) provides a compact stateful session handoff template with verified SHA and test status fields.

## Links

- Studio: [abstrekkt.com](https://abstrekkt.com)
- Organization: [github.com/ChaosClubCo](https://github.com/ChaosClubCo)
