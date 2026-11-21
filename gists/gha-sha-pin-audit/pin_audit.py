#!/usr/bin/env python3
"""Audit GitHub Actions workflows for full 40-char commit SHA pinning and explicit permissions.

Usage:
  python3 pin_audit.py --self-test
  python3 pin_audit.py .github/workflows
"""
from __future__ import annotations

import re
import sys
import tempfile
from pathlib import Path

USES_RE = re.compile(r"^\s*(?:-\s*)?uses:\s*([^#\s]+)", re.MULTILINE)
SHA_PIN_RE = re.compile(r"^[^@]+@[0-9a-f]{40}$")
PERMISSIONS_RE = re.compile(r"^permissions\s*:", re.MULTILINE)


def audit_workflow_text(text: str, label: str = "<memory>") -> list[str]:
    findings: list[str] = []
    if not PERMISSIONS_RE.search(text):
        findings.append(f"{label}: missing top-level 'permissions:' block")
    for match in USES_RE.finditer(text):
        ref = match.group(1).strip("\"'")
        if ref.startswith("./") or ref.startswith("docker://"):
            continue
        if not SHA_PIN_RE.match(ref):
            line = text.count("\n", 0, match.start()) + 1
            findings.append(f"{label}:L{line}: unpinned action reference '{ref}'")
    return findings


def audit_path(target: Path) -> list[str]:
    files = [target] if target.is_file() else sorted(list(target.glob("*.yml")) + list(target.glob("*.yaml")))
    all_findings: list[str] = []
    for wf in files:
        all_findings.extend(audit_workflow_text(wf.read_text(encoding="utf-8"), str(wf)))
    return all_findings


def run_self_test() -> int:
    clean_yml = (
        "name: ci\n"
        "on: [push]\n"
        "permissions:\n"
        "  contents: read\n"
        "jobs:\n"
        "  test:\n"
        "    runs-on: ubuntu-latest\n"
        "    steps:\n"
        "      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262\n"
    )
    dirty_yml = (
        "name: ci\n"
        "on: [push]\n"
        "jobs:\n"
        "  test:\n"
        "    runs-on: ubuntu-latest\n"
        "    steps:\n"
        "      - uses: actions/checkout@v4\n"
    )
    assert audit_workflow_text(clean_yml, "clean.yml") == []
    dirty_hits = audit_workflow_text(dirty_yml, "dirty.yml")
    assert len(dirty_hits) == 2, f"Expected 2 findings, got {dirty_hits}"
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / "ci.yml"
        p.write_text(clean_yml, encoding="utf-8")
        assert audit_path(Path(tmp)) == []
    print("pin_audit self-test passed (clean=0 findings, dirty=2 findings)")
    return 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return run_self_test()
    target = Path(argv[1]) if len(argv) > 1 else Path(".github/workflows")
    if not target.exists():
        print(f"Path not found: {target}", file=sys.stderr)
        return 2
    findings = audit_path(target)
    for item in findings:
        print(item)
    print(f"checked {target}: {len(findings)} finding(s)")
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
