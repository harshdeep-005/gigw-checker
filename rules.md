# rules.md — Agent & Contributor Conventions

This file defines how AI coding agents (and humans) must behave in this repo.
**Every agent must read this file at the start of every session, before making
any change.**

---

## 1. Session start protocol

Before writing or editing any code, an agent must read, in this order:

1. `rules.md` (this file)
2. `schema.md` — the frozen data contracts
3. `design.md` — system architecture
4. `requirements.md` — what must be built (includes the GIGW clause table)
5. `implementationPlan.md` — current phase / timeline
6. **All** files in `brain/` (`brain/member-a.md`, `brain/member-b.md`,
   `brain/member-c.md`) — to understand what the other two members have
   done, decided, or are blocked on
7. Its own `tasks/member-{x}.md` — to know what it's currently assigned

Do not skip step 6. The whole point of `brain/` is that an agent never
needs to ask a human "what did the others do" — it reads the logs.

---

## 2. File ownership — who can write what

| File(s) | Writable by |
|---|---|
| `brain/member-{x}.md` | Only that member's own agent. Never edit another member's brain file. |
| `tasks/member-{x}.md` | Only that member's own agent. |
| `rules.md`, `schema.md`, `design.md`, `requirements.md`, `implementationPlan.md` | Humans only, in a shared session. Agents may **propose** a change (as a suggestion in their own `brain/` file — e.g. "recommend schema.md add a `severity` field") but must not edit these files directly. |
| Source code under `packages/{member-domain}/` | The owning member's agent, freely. |
| Shared/cross-cutting code (crawler core, queue setup, shared UI shell) | Any agent, but flag the change in your own `brain/` entry so others notice it in shared files. |

If a schema change is genuinely needed mid-project, the requesting agent
writes the proposal into its own `brain/` file; a human reviews and updates
`schema.md` manually, bumping its version number (see `schema.md` §versioning).

---

## 3. `brain/member-{x}.md` format (append-only, never edit past entries)

```markdown
## YYYY-MM-DD — Member {X}
- What was added/changed
- Any architectural decision made and why
- Blocked on: (if anything, reference the file/version blocking you)
- Affects shared files: (yes/no — name them if yes)
```

Rules:
- Always append to the **bottom** of the file.
- Never rewrite or delete a previous entry, even if it's now outdated —
  correctness note as a new entry instead ("Correction to 2026-08-20 entry: ...").
- Keep entries short — 3-6 bullets. This is a log, not a report.

---

## 4. `tasks/member-{x}.md` format

```markdown
### [{X}-###] Short task title
Status: todo | in-progress | blocked | done
Date: YYYY-MM-DD (date of last status change)
Depends on: (task ID or file+version, if any — e.g. "schema.md v1.2")
Notes: (one line, optional)
```

- Task IDs are permanent once assigned — never reuse or renumber.
- If Member B is blocked on Member A's work, B references A's task ID in
  B's *own* file ("Blocked on A-014") — never edit A's file to say so.

---

## 5. Coding conventions

- **Language:** TypeScript everywhere, `strict: true` in every `tsconfig.json`.
- **Formatting:** Prettier, default config, enforced via pre-commit hook.
- **Linting:** ESLint with `@typescript-eslint/recommended`.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for types/components,
  `kebab-case` for file names except React components (`PascalCase.tsx`).
- **No `any`** — if a type is genuinely unknown, use `unknown` and narrow it.
- **Checker functions** must conform exactly to the `Checker` interface in
  `schema.md` — this is what keeps the three members' checkers pluggable and
  conflict-free.
- **Every checker module lives in its own file**, one clause-group per file,
  under `packages/checkers/{domain}/`.

---

## 6. Git conventions

- **Branch naming:** `{member}/{task-id}-short-description`
  e.g. `a/A-014-contrast-checker`
- **Commit format:** `[{task-id}] short imperative description`
  e.g. `[A-014] add axe-core contrast ratio checker`
- **PRs:** short-lived (merge within 2-3 days), one task-ID per PR where possible.
- **Never** commit directly to `main` — always via PR, even for solo work.
- **Never** force-push to a shared branch.

---

## 7. Boundaries — what an agent must NOT do

- Do not edit another member's `brain/` or `tasks/` file.
- Do not edit `schema.md`, `design.md`, `requirements.md`, or
  `implementationPlan.md` directly — propose via `brain/`, human applies it.
- Do not modify another member's `packages/checkers/{domain}/` files without
  a task ID assigned to you for that domain.
- Do not introduce a new library/dependency without noting it in your
  `brain/` entry — the other two members need to know what's now part of
  the shared `package.json`.
