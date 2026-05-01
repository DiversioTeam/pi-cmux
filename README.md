# @diversioteam/pi-cmux

[![CI](https://github.com/DiversioTeam/pi-cmux/actions/workflows/ci.yml/badge.svg)](https://github.com/DiversioTeam/pi-cmux/actions/workflows/ci.yml)
[![Workflow Security](https://github.com/DiversioTeam/pi-cmux/actions/workflows/workflow-security.yml/badge.svg)](https://github.com/DiversioTeam/pi-cmux/actions/workflows/workflow-security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Shared cmux primitives for Pi extensions.

This is a plain TypeScript library, not a Pi package. Install it as a normal npm dependency and import it from extension code.

## Why it exists

Multiple Pi extensions need the same cmux behaviors:

- detect whether Pi is running inside cmux
- identify the calling workspace and surface
- open splits and workspaces safely
- build hardened Pi and shell launch commands
- send native cmux notifications

Keeping that logic duplicated across extensions causes drift. This package centralizes the shared primitives.

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

## Quick example

```ts
import { buildPiCommand, isInsideCmux, openSplit } from "@diversioteam/pi-cmux";

if (isInsideCmux()) {
  await openSplit(pi, "right", buildPiCommand(process.cwd(), {
    prompt: "Review the current diff",
  }));
}
```

## Public API

- `isInsideCmux()`
- `identifyCaller(pi)`
- `execCmux(pi, args, timeout?)`
- `resolvePiLauncher()`
- `wrapSpawnedCommand(cmd, notice)`
- `shellEscape(value)`
- `buildPiCommand(cwd, { sessionFile?, prompt? })`
- `buildShellCommand(cwd, cmd)`
- `openSplit(pi, direction, command)`
- `openWorkspace(pi, { cwd, name?, command })`
- `notify(pi, title, subtitle, body, opts?)`
- `CMUX_TIMEOUT_MS`
- `SPLIT_BOOT_DELAY_MS`

## Development

```bash
npm install
npm run build
npm pack --dry-run
```

## Release

Publishing is driven by version tags:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The publish workflow verifies that the tag matches `package.json`, builds the package, publishes it to GitHub Packages, and creates a GitHub release with generated notes.

## Notes

- Public repo does not imply anonymous package install: GitHub Packages still requires auth.
- The published tarball intentionally contains only `dist/` plus standard package metadata files.
