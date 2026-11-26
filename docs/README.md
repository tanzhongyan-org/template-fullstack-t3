# Documentation

Where each kind of document lives in this repository.

| Path                                  | Holds                                             | Lifespan                                                       |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Code map, invariants, request flow                | Permanent; update it in the pull request that changes the code |
| [decisions](decisions)                | One ADR per irreversible choice, `NNNN-<slug>.md` | Append-only; supersede, never edit                             |
| [dependencies.md](dependencies.md)    | Ledger of direct dependencies                     | Permanent; one row per dependency                              |
| [recipes](recipes)                    | Optional guides (auth, payments, crons, mobile)   | Reference guides; adopt only when needed                       |
| specs                                 | Functional specs for a feature in flight          | Medium; fold into ARCHITECTURE.md or tests when done           |
| plans                                 | Task checklists                                   | Ephemeral; remove on merge                                     |
| archive                               | Retired specs and old lesson rows                 | Reference only                                                 |

Create `specs`, `plans`, and `archive` folders when you need them.
