import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import { execCmux } from "./cmux.js";

export interface OpenWorkspaceOptions {
  cwd: string;
  name?: string;
  command: string;
}

export async function openWorkspace(
  pi: ExtensionAPI,
  options: OpenWorkspaceOptions,
): Promise<{ ok: true; workspaceRef: string } | { ok: false; error: string }> {
  const args: string[] = ["new-workspace", "--cwd", options.cwd, "--command", options.command];
  if (options.name) {
    args.push("--name", options.name);
  }

  const result = await execCmux(pi, args);
  if (!result.ok) {
    return { ok: false, error: result.error || "Failed to create cmux workspace" };
  }

  const match = result.stdout.match(/^OK\s+(workspace:\d+)/m);
  if (!match) {
    return {
      ok: false,
      error: `Created workspace, but could not parse ref from: ${result.stdout.trim().slice(0, 200)}`,
    };
  }

  return { ok: true, workspaceRef: match[1] };
}
