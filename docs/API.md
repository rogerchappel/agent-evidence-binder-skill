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

`buildEvidencePack` accepts `claims` as an array of claim objects. Each claim
requires non-empty, non-whitespace string `id` and `text` fields and may include
an `evidence` array. An evidence entry is either a non-empty, non-whitespace
path string or an object whose `path` field is a non-empty, non-whitespace
string. Omitting `evidence` is equivalent to an empty array. For example:

```js
{
  id: "build-check",
  text: "The package builds successfully",
  evidence: ["package.json", { path: "scripts/build.js" }]
}
```

The optional `commands` value must be an array. Each command entry is an object
with non-empty, non-whitespace string `name` and `status` fields:

```js
buildEvidencePack({
  repoRoot: ".",
  claims: [],
  commands: [{ name: "npm test", status: "pass" }]
});
```

Malformed collections, claims, and evidence entries throw `TypeError` with the
invalid field path (for example, `claims[0].evidence[1].path must be a string`
or `claims[0].evidence[1].path must be a non-empty string`).
Validation happens before evidence path inspection. The CLI reports the same
field-specific message and does not create its output directory for rejected
claim input.

`classifyClaim(repoRoot, claim)` checks every evidence path twice: first for
lexical containment and then against the real filesystem location of its
nearest existing ancestor. A symlink is accepted only when its resolved target
remains inside the real repository root. Symlinked files or directories that
resolve outside the repository cause the call to throw before an evidence pack
is written.

A claim is `sourced` only when it cites at least one evidence path and every
cited path exists. If any cited path is missing, the claim is `inferred` when
the caller explicitly sets `inference`; otherwise it is `needs-review`.
