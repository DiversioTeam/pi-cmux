import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import { execCmux, identifyCaller } from "./cmux.js";

export type SplitDirection = "right" | "down";

export const SPLIT_BOOT_DELAY_MS = 250;

interface CmuxSplitResponse {
  surface_ref?: string;
}

function parseJson<T>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function openSplit(
  pi: ExtensionAPI,
  direction: SplitDirection,
  command: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const callerResult = await identifyCaller(pi);
  if (!callerResult.ok) {
    return callerResult;
  }

  const { workspaceRef, surfaceRef } = callerResult.caller;

  const splitResult = await execCmux(pi, [
    "--json",
    "new-split",
    direction,
    "--workspace",
    workspaceRef,
    "--surface",
    surfaceRef,
  ]);
  if (!splitResult.ok) {
    return { ok: false, error: splitResult.error || "Failed to create cmux split" };
  }

  const parsed = parseJson<CmuxSplitResponse>(splitResult.stdout);
  const newSurfaceRef = parsed?.surface_ref;
  if (!newSurfaceRef) {
    return {
      ok: false,
      error: `Created split, but could not parse surface_ref from: ${splitResult.stdout.trim().slice(0, 200)}`,
    };
  }

  await delay(SPLIT_BOOT_DELAY_MS);

  const respawnResult = await execCmux(pi, [
    "respawn-pane",
    "--workspace",
    workspaceRef,
    "--surface",
    newSurfaceRef,
    "--command",
    command,
  ]);
  if (!respawnResult.ok) {
    return {
      ok: false,
      error: respawnResult.error || "Failed to start command in the new split",
    };
  }

  return { ok: true };
}
