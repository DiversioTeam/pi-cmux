import { existsSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";

import { shellEscape } from "./escape.js";

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

export function buildShellCommand(cwd: string, command: string): string {
  return [
    "cd",
    shellEscape(cwd),
    "&&",
    wrapSpawnedCommand(command, "Command failed. Keeping this pane open for debugging."),
  ].join(" ");
}
