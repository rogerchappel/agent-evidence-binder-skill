# API

The package exposes pure local functions from `src/index.js` for agents that prefer a library call over the CLI.

- Input readers accept local paths supplied by the caller.
- Builders return plain JSON-compatible objects.
- Renderers produce Markdown review briefs.
- Writers create only the requested output directory.

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
