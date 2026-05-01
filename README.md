# @diversioteam/pi-cmux

[![CI](https://github.com/DiversioTeam/pi-cmux/actions/workflows/ci.yml/badge.svg)](https://github.com/DiversioTeam/pi-cmux/actions/workflows/ci.yml)
[![Workflow Security](https://github.com/DiversioTeam/pi-cmux/actions/workflows/workflow-security.yml/badge.svg)](https://github.com/DiversioTeam/pi-cmux/actions/workflows/workflow-security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Shared cmux primitives for Pi extensions.

This is a plain TypeScript library, not a Pi package. Install it as a normal npm dependency and import it from extension code.

## Why this package exists

This package provides a small, reusable set of cmux helpers for code that
needs to:

- detect whether it is running inside cmux
- identify the active workspace and surface
- open splits and workspaces safely
- build hardened Pi and shell launch commands
- send native cmux notifications

The point of the package is simple:

> make common cmux automation reliable and easy to reuse

## The problem it is solving

The highest-value bug class here is:

```text
open split
  -> spawn command in fresh pane
  -> pane immediately closes
  -> no clue what failed
```

That usually happens because a fresh pane is a weaker environment than the Pi
session that launched it:

- PATH may be different
- the `pi` binary may not be discoverable by name
- a short-lived failure may exit before the human can read it

`@diversioteam/pi-cmux` hardens that path by:

- reusing the current session's PATH
- resolving the safest Pi launcher it can find
- keeping failed panes open with a readable message
- centralizing the split/workspace launch flow in one place

## Mental model

```text
your code
  ├─ decides when a split/workspace/notification is useful
  └─ calls @diversioteam/pi-cmux
       ├─ cmux.ts       -> talk to cmux safely
       ├─ launch.ts     -> build reliable shell / Pi commands
       ├─ split.ts      -> open adjacent panes
       ├─ workspace.ts  -> open new workspace tabs
       ├─ notify.ts     -> send native cmux notifications
       └─ escape.ts     -> safe shell argument escaping
```

Another way to think about it:

```text
Your extension owns the UX decision.
pi-cmux owns the brittle terminal mechanics.
```

## Install

This package is published to GitHub Packages, so npm needs:

1. an `@diversioteam` registry mapping
2. a token with package read access

If you already install other `@diversioteam` packages from GitHub Packages
(such as `@diversioteam/diversio-ds`), you may already have this set up.
In that case, you can likely skip the `.npmrc` step below and just install the package.

### One-time npm setup (only if not already configured)

```bash
cat >> ~/.npmrc <<'EOF'
@diversioteam:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
EOF
```

### Install

If your shell or CI does not already provide `NPM_TOKEN`, export it first:

```bash
export NPM_TOKEN=...
npm install @diversioteam/pi-cmux
```

## Quick usage examples

### 1. Open a new Pi split

```ts
import { buildPiCommand, isInsideCmux, openSplit } from "@diversioteam/pi-cmux";

if (isInsideCmux()) {
  await openSplit(pi, "right", buildPiCommand(process.cwd(), {
    prompt: "Review the current diff",
  }));
}
```

Mental model:

```text
current Pi session
  -> ask cmux for the caller surface
  -> create a right-side split
  -> respawn that pane with a hardened Pi command
```

### 2. Open a shell-command split

```ts
import { buildShellCommand, openSplit } from "@diversioteam/pi-cmux";

await openSplit(pi, "down", buildShellCommand(process.cwd(), "npm test"));
```

Use this when you want a helper terminal lane instead of another Pi lane.

### 3. Open a workspace tab

```ts
import { buildPiCommand, openWorkspace } from "@diversioteam/pi-cmux";

await openWorkspace(pi, {
  cwd: process.cwd(),
  name: "Reviewer",
  command: buildPiCommand(process.cwd(), {
    prompt: "Review the migration for safety",
  }),
});
```

### 4. Send a native notification

```ts
import { notify } from "@diversioteam/pi-cmux";

await notify(pi, "Review finished", "backend", "No correctness issues found.");
```

## Why the launcher helpers matter

The most important helpers in this package are the command builders in
`launch.ts`.

### `resolvePiLauncher()`

This answers:

> "If I start Pi inside a brand-new shell right now, what command is least likely to fail?"

Resolution order:

```text
1. PI_CLI_PATH override
2. pi binary next to the current Node executable
3. plain `pi`
```

### `wrapSpawnedCommand()`

This answers:

> "How do I run a command in a fresh pane without losing the error instantly if it fails?"

It wraps the real command so the new shell:

- restores PATH
- runs the requested command
- prints a readable failure message if needed
- drops into an interactive shell on failure instead of closing immediately

### `buildPiCommand()`

This is the usual choice for a Pi-powered helper lane.

It composes:

```text
cd <cwd>
  -> restore PATH
  -> launch Pi
  -> optionally reuse a seeded session file
  -> optionally pass a prompt after `--`
```

### `buildShellCommand()`

This is the usual choice for commands like:

- `npm test`
- `npm run dev`
- `lazygit`
- `python manage.py shell`

## Public API

### Environment and cmux execution

- `isInsideCmux()`
- `identifyCaller(pi)`
- `execCmux(pi, args, timeout?)`
- `CMUX_TIMEOUT_MS`

### Launch-command building

- `resolvePiLauncher()`
- `wrapSpawnedCommand(cmd, notice)`
- `shellEscape(value)`
- `buildPiCommand(cwd, { sessionFile?, prompt? })`
- `buildShellCommand(cwd, cmd)`

### Pane and workspace creation

- `openSplit(pi, direction, command)`
- `openWorkspace(pi, { cwd, name?, command })`
- `SPLIT_BOOT_DELAY_MS`

### Notifications

- `notify(pi, title, subtitle, body, opts?)`

## Development

```bash
npm install
npm run build
npm pack --dry-run
```

Useful checks while editing:

```bash
# verify the compiled package surface
node --input-type=module -e 'import("./dist/index.js").then((m) => console.log(Object.keys(m).sort()))'

# inspect the exact tarball contents that would be published
npm pack --dry-run
```

## Release

Publishing is driven by version tags:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The publish workflow then:

```text
verify tag matches package.json
  -> build
  -> publish to GitHub Packages
  -> create GitHub release notes
```

## Notes

- Public repo does not imply anonymous package install: GitHub Packages still requires auth.
- The published tarball intentionally contains only `dist/` plus standard package metadata files.
- This package is intentionally small. Consumer extensions should own UX policy; this package should own the reusable cmux mechanics.
