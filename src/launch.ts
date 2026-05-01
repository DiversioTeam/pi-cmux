import { existsSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";

import { shellEscape } from "./escape.js";

/**
 * Resolve the safest command string for launching Pi from a fresh shell.
 *
 * Why this exists:
 * - a respawned cmux pane may not have the same PATH as the current session
 * - some environments launch Pi through a `node .../cli.js` entrypoint instead
 *   of a stable `pi` binary on PATH
 * - callers need one already-escaped command fragment they can compose into a
 *   larger `sh -lc` command
 *
 * Resolution order:
 * 1. `PI_CLI_PATH` override, if provided
 * 2. `pi` binary next to the current Node executable
 * 3. plain `pi` as a fallback
 */
export function resolvePiLauncher(): string {
  const explicit = process.env.PI_CLI_PATH?.trim();
  if (explicit) {
    try {
      if (!existsSync(explicit)) {
        return shellEscape(explicit);
      }

      const resolvedExplicit = realpathSync(explicit);
      if (resolvedExplicit.endsWith(".js")) {
        return `${shellEscape(process.execPath)} ${shellEscape(resolvedExplicit)}`;
      }

      return shellEscape(explicit);
    } catch {
      return shellEscape(explicit);
    }
  }

  const siblingCandidate = join(dirname(process.execPath), "pi");
  if (!existsSync(siblingCandidate)) {
    return "pi";
  }

  try {
    const resolvedSibling = realpathSync(siblingCandidate);
    if (resolvedSibling.endsWith(".js")) {
      return `${shellEscape(process.execPath)} ${shellEscape(resolvedSibling)}`;
    }

    return shellEscape(siblingCandidate);
  } catch {
    return "pi";
  }
}

/**
 * Wrap one child command so it behaves well inside a newly created pane.
 *
 * The wrapper does three important things:
 * 1. restores the current session's PATH inside the respawned shell
 * 2. runs the real command
 * 3. if the command fails immediately, keeps the pane open in an interactive
 *    shell with a readable error notice instead of letting the pane blink shut
 *
 * That last behavior is the main UX hardening this package provides. Without
 * it, "pane opened and instantly disappeared" failures are hard to diagnose.
 */
export function wrapSpawnedCommand(command: string, notice: string): string {
  const lines = [
    `PATH=${shellEscape(process.env.PATH ?? "")}`,
    "export PATH",
    command,
    "status=$?",
    'if [ "$status" -ne 0 ]; then printf "\\n[pi-cmux] %s\\n[pi-cmux] Exit status: %s\\n" ' + shellEscape(notice) + ' "$status"; exec "${SHELL:-/bin/sh}" -i; fi',
    'exit "$status"',
  ];

  return ["exec", "sh", "-lc", shellEscape(lines.join("; "))].join(" ");
}

/**
 * Build the exact shell command used to start Pi inside a new split/workspace.
 *
 * Mental model:
 *
 * ```text
 * cd <cwd>
 *   -> restore PATH
 *   -> launch the same Pi installation we are already running when possible
 *   -> optionally point Pi at a seeded session file
 *   -> optionally pass one prompt after `--`
 * ```
 *
 * The `--` separator matters. It prevents prompts beginning with `-` from being
 * misread as CLI flags.
 */
export function buildPiCommand(
  cwd: string,
  options?: { sessionFile?: string; prompt?: string },
): string {
  const parts = [resolvePiLauncher()];
  if (options?.sessionFile) {
    parts.push("--session", shellEscape(options.sessionFile));
  }
  const prompt = options?.prompt?.trim();
  if (prompt) {
    parts.push("--", shellEscape(prompt));
  }

  return [
    "cd",
    shellEscape(cwd),
    "&&",
    wrapSpawnedCommand(
      parts.join(" "),
      "Pi failed to stay open. Keeping this pane open for debugging.",
    ),
  ].join(" ");
}

/**
 * Build a shell-command lane that mirrors the current session's cwd and PATH.
 *
 * Use this for commands like `npm test`, `lazygit`, or `python manage.py shell`
 * when you want a helper pane that behaves like the current session rather than
 * a blank login shell.
 */
export function buildShellCommand(cwd: string, command: string): string {
  return [
    "cd",
    shellEscape(cwd),
    "&&",
    wrapSpawnedCommand(command, "Command failed. Keeping this pane open for debugging."),
  ].join(" ");
}
