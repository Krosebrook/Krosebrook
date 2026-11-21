#!/usr/bin/env bash
# Publish or sync curated snippet packs to GitHub Gist using the authenticated `gh` CLI.
# Usage:
#   bash scripts/sync-gists.sh --dry-run
#   bash scripts/sync-gists.sh --apply

set -euo pipefail

MODE="${1:---dry-run}"

run_or_echo() {
  if [[ "${MODE}" == "--apply" ]]; then
    "$@"
  else
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
  fi
}

echo "1. Verifying local snippet self-tests before gist sync..."
node gists/mcp-streamable-http-probe/mcp_probe.mjs --self-test
python3 gists/gha-sha-pin-audit/pin_audit.py --self-test
node gists/dns-ssrf-guard/ssrf_guard.mjs --self-test

echo "2. Syncing curated public gists..."
run_or_echo gh gist create gists/mcp-streamable-http-probe/mcp_probe.mjs \
  --public \
  --desc "mcp-streamable-http-probe: Zero-dependency Node 22 JSON-RPC initialize + tools/list probe for Streamable HTTP MCP servers (2025-11-25)"

run_or_echo gh gist create gists/gha-sha-pin-audit/pin_audit.py \
  --public \
  --desc "gha-sha-pin-audit: Zero-dependency Python 3 scanner for 40-char commit SHA pinning and permissions blocks in GitHub Actions"

run_or_echo gh gist create gists/dns-ssrf-guard/ssrf_guard.mjs \
  --public \
  --desc "dns-ssrf-guard: Pre-flight DNS and IPv4/IPv6 CWE-918 SSRF guard for outbound webhook and MCP clients in Node 22+"

echo "3. Updating legacy Claude Memory Template gist (fc1e5ebee4d9cc37077887bb8bd75406)..."
run_or_echo gh gist edit fc1e5ebee4d9cc37077887bb8bd75406 \
  --add gists/agent-context-template/AGENT_SESSION_HANDOFF.md \
  --desc "Agent Session Handoff & Memory Template (Stateful SHA + Verification Checkpoint)"
