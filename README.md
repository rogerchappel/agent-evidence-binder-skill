# agent-evidence-binder-skill

Bundle repository evidence, command output, and claims into reviewable local evidence packets.

## Quickstart

```bash
npm ci
npm run release:check
npm run smoke
```

Check the installed CLI surface:

```bash
npx agent-evidence-binder --help
npx agent-evidence-binder --version
```

Import the supported ESM library entry point:

```js
import { buildEvidencePack, classifyClaim } from "agent-evidence-binder-skill";
```

Generate a local evidence packet from the included fixtures:

```bash
node src/cli.js \
  --repo fixtures/sample-repo \
  --claims fixtures/claims.json \
  --commands fixtures/commands.json \
  --out .tmp/evidence
```

## Safety

Local files only. No network calls, publishing, or external account writes. Generated outputs are review artifacts and require human approval before downstream action.

Evidence paths are constrained to the repository after symlink resolution.
In-repository symlinks are accepted, while symlinks that escape the repository
are rejected. Claims receive `sourced` only when every cited path exists;
partially missing evidence remains `needs-review` (or `inferred` when explicitly
declared with `"inference": true`). The optional `inference` field must be a
boolean; strings such as `"false"` are rejected.

## Release Readiness

`npm run release:readiness` validates package metadata, CLI bin metadata, npm
allowlist coverage, required support docs, and CI presence.

`npm run release:check` runs syntax checks, the build placeholder, unit tests,
the fixture-backed smoke, and a package smoke that verifies key runtime files
are present in the tarball.

`npm run lint` is an alias for the deterministic repository checks used by the
release gate.

CI uses the committed lockfile with `npm ci` so pull requests exercise the same
dependency graph as local release checks.

The package smoke also verifies that the API notes, examples, changelog,
license, and security policy are included in the npm tarball. It then installs
that tarball in an isolated consumer project and verifies the public ESM import
and installed binary help/version surfaces.

## Local Verification

Run the committed test suite before publishing changes:

```sh
npm test
```

## CLI

```bash
node src/cli.js \
  --repo fixtures/sample-repo \
  --claims fixtures/claims.json \
  --commands fixtures/commands.json \
  --out .tmp/evidence
```

This writes `.tmp/evidence/evidence-pack.json` for automation and
`.tmp/evidence/evidence-summary.md` for reviewer handoff.

CLI arguments are parsed strictly before any input is read or output is written.
Unknown options, unexpected positional arguments, duplicate value-taking flags,
and missing values (including when the next token is another flag) identify the
offending token or flag, print a concise error plus usage without a stack trace,
and exit with status 2.

## Verification

```bash
npm test
npm run check
npm run smoke
npm run package:smoke
npm run release:check
```

## Limitations

The binder constrains local evidence paths but does not authenticate artifact
contents or command notes supplied by the caller. It does not fetch remote
evidence or approve external actions.

## Release notes

Before tagging a release, confirm the smoke fixture still represents the intended workflow and summarize any changed output, limitations, or operator steps in the PR.
