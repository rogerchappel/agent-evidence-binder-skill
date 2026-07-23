# Safety Model

This project is intentionally local-first. It does not fetch remote content, send messages, mutate external tools, or treat generated artifacts as approval to act.

Evidence paths must remain inside the repository both lexically and after
filesystem symlinks are resolved. In-repository symlinks are supported;
symlinks to files or directories outside the repository are rejected. A
partially missing evidence list is not treated as sourced.

Agents should present generated files for review and route any later side effects through a separate approved executor.
