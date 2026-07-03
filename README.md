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

## Release Readiness

`npm run release:check` runs syntax checks, the build placeholder, unit tests,
the fixture-backed smoke, and a package smoke that verifies key runtime files
are present in the tarball.

`npm run lint` is an alias for the deterministic repository checks used by the
release gate.

CI uses the committed lockfile with `npm ci` so pull requests exercise the same
dependency graph as local release checks.

The package smoke also verifies that the API notes, examples, changelog,
license, and security policy are included in the npm tarball.

## Local Verification

Run the committed test suite before publishing changes:

```sh
npm test
```
