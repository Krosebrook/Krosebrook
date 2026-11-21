# Agent session handoff template

Copy into `.claude/HANDOFF.md` or attach at session compaction boundaries so the next coding session starts from verified git state instead of conversational memory.

## Repository state

- Repository: `owner/repo`
- Branch: `main`
- Verified HEAD SHA: `0000000000000000000000000000000000000000`
- Working tree clean (`git status --short` empty): `yes`
- Last verified CI run or local test command: `npm test` (exit `0`)

## Completed in this checkpoint

1. Describe the exact file paths changed and the behavior verified.
2. Record the command output or test count that proved the fix.

## Open blockers and untouched scope

1. List any failing check, unverified edge case, or deferred file path.
2. Record external UI or secret dependencies that cannot be mutated from code.

## Guardrails for the next session

- Run tests before editing so pre-existing failures are separated from new regressions.
- Label external claims `[SOURCED]` when backed by tool output and `[GENERATED]` when inferred.
- Never commit `.env` files, bearer tokens, or unpinned GitHub Actions tags.
