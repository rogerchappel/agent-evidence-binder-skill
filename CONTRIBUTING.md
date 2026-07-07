# Contributing

Thanks for improving `agent-evidence-binder-skill`. This package is intended to
produce local, reviewable evidence packets without approving or publishing any
external action.

## Local Verification

Run the release gate before opening a pull request:

```sh
npm run release:check
```

For focused changes, these commands cover the main surfaces:

```sh
npm run check
npm run build
npm test
npm run smoke
npm run package:smoke
```

## Contributor Expectations

- Keep the default workflow local-only; do not add network fetches, publishing,
  account writes, or approval side effects.
- Add or update fixtures when changing packet shape or CLI output.
- Update README or docs when command behavior, package contents, or limitations
  change.
- Include the verification commands you ran in the pull request.
