# Changelog

## [Unreleased]

- Add release-readiness checks for package metadata, pack contents, and CI verification.
- Correct README CLI examples so they match the shipped fixture-backed command.
- Reject evidence paths that escape the repository through filesystem symlinks.
- Require every cited path to exist before classifying a claim as sourced.
## 0.1.0

- Initial pre-release package for bundling repository evidence, command output, and supported claims into local review packets.
- Includes the CLI, reusable skill instructions, fixtures, validation scripts, and package smoke coverage.
