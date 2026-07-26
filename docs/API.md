# API

The package exposes pure local functions through its supported ESM entry point:

```js
import {
  buildEvidencePack,
  classifyClaim,
  ensureInside,
  readJson,
  renderSummary,
  writeEvidencePack
} from "agent-evidence-binder-skill";
```

These functions are implemented in `src/index.js`; consumers should use the
package import above rather than depending on that internal path.

- Input readers accept local paths supplied by the caller.
- Builders return plain JSON-compatible objects.
- Renderers produce Markdown review briefs.
- Writers create only the requested output directory.

## CLI errors

`--repo`, `--claims`, `--commands`, and `--out` require a following value.
Missing values are rejected before filesystem work. The CLI writes a concise,
actionable error and usage to stderr without a stack trace, then exits with
status 2.

## Evidence path safety

`classifyClaim(repoRoot, claim)` checks every evidence path twice: first for
lexical containment and then against the real filesystem location of its
nearest existing ancestor. A symlink is accepted only when its resolved target
remains inside the real repository root. Symlinked files or directories that
resolve outside the repository cause the call to throw before an evidence pack
is written.

A claim is `sourced` only when it cites at least one evidence path and every
cited path exists. If any cited path is missing, the claim is `inferred` when
the caller explicitly sets `inference`; otherwise it is `needs-review`.
