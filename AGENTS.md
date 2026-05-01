# AGENTS.md — pi-cmux

## What This Repo Is

`@diversioteam/pi-cmux` is the single source of truth for cmux primitives used by Pi extensions. It provides hardened shell-command building, split pane launching, workspace tab creation, and notifications via the native cmux CLI.

## Why It Exists

Multiple Pi extensions need the same cmux operations. Keeping separate copies of that logic causes drift and hard-to-debug launch behavior. This library centralizes the shared primitives so extensions can stay small and consistent.

## Architecture

src/
├── index.ts      ← re-exports all public API
├── cmux.ts       ← execCmux, identifyCaller, isInsideCmux
├── launch.ts     ← resolvePiLauncher, wrapSpawnedCommand, buildPiCommand, buildShellCommand
├── split.ts      ← openSplit
├── workspace.ts  ← openWorkspace
├── notify.ts     ← notify
└── escape.ts     ← shellEscape

## Dependencies

- peer: @mariozechner/pi-coding-agent (for ExtensionAPI type only)
- dev: @mariozechner/pi-coding-agent, @types/node, typescript

## Commands

npm install
npm run build
npm publish
