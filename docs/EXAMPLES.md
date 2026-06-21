# Examples

Run `npm run smoke` to generate fixture-backed review artifacts.

## Fixture Evidence Packet

```bash
node src/cli.js \
  --repo fixtures/sample-repo \
  --claims fixtures/claims.json \
  --commands fixtures/commands.json \
  --out .tmp/evidence
```

The command writes:

- `.tmp/evidence/evidence-pack.json` for structured review automation.
- `.tmp/evidence/evidence-summary.md` for human PR or release review.

## CLI Surface Check

```bash
node src/cli.js --help
node src/cli.js --version
```

Use the version output in package-install smoke tests to confirm the published
binary can load its package metadata.
