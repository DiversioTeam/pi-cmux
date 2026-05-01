import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import { CMUX_TIMEOUT_MS, execCmux } from "./cmux.js";

export async function notify(
  pi: ExtensionAPI,
  title: string,
  subtitle: string,
  body: string,
  options?: { timeout?: number },
): Promise<{ ok: boolean; error?: string }> {
  const result = await execCmux(
    pi,
    ["notify", "--title", title, "--subtitle", subtitle, "--body", body],
    options?.timeout ?? CMUX_TIMEOUT_MS,
  );

  if (!result.ok) {
    return { ok: false, error: result.error || "cmux notify failed" };
  }

  return { ok: true };
}
