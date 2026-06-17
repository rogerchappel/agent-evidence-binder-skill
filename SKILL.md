# agent-evidence-binder-skill

Use this skill when an agent needs bundle repository evidence, command output, and claims into reviewable local evidence packets.

## Inputs

Local fixture or workflow files described in the README.

## Side effects

Writes local output files only. It does not execute connector actions or contact external services.

## Approval requirements

Any generated action, claim, or approval record must be reviewed before an external executor uses it.

## Validation

Run `npm run smoke`, inspect generated JSON and Markdown, and resolve any review issues.
