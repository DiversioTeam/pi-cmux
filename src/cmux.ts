import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Default timeout for one cmux CLI round-trip.
 *
 * These calls should be quick metadata / control operations, not long-running
 * jobs. If one hangs, callers almost always want a readable failure instead of
 * waiting indefinitely.
 */
export const CMUX_TIMEOUT_MS = 5_000;

export interface CmuxCallerInfo {
  workspaceRef: string;
  surfaceRef: string;
}

interface CmuxIdentifyResponse {
  caller?: {
    workspace_ref?: string;
    surface_ref?: string;
  };
}

export interface CmuxExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

function parseJson<T>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

/**
 * Cheap environment check used as the first gate before attempting any cmux
 * behavior.
 *
 * This does not prove that every later cmux command will succeed. It only means
 * "this Pi process appears to be running inside a cmux-managed surface".
 */
export function isInsideCmux(): boolean {
  return Boolean(
    process.env.CMUX_SOCKET_PATH &&
      process.env.CMUX_WORKSPACE_ID &&
      process.env.CMUX_SURFACE_ID,
  );
}

/**
 * Execute one cmux command with normalized success/error shape.
 *
 * Why normalize here?
 * - extension code should think in terms of cmux operations, not child-process
 *   exit handling
 * - callers often want stderr, stdout, and a human-readable summary together
 * - keeping this logic in one place makes split/workspace/notify helpers easier
 *   to audit
 */
export async function execCmux(
  pi: ExtensionAPI,
  args: string[],
  timeout = CMUX_TIMEOUT_MS,
): Promise<CmuxExecResult> {
  const result = await pi.exec("cmux", args, { timeout });
  if (result.killed) {
    return {
      ok: false,
      stdout: result.stdout,
      stderr: result.stderr,
      error: "cmux command timed out",
    };
  }
  if (result.code !== 0) {
    return {
      ok: false,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.stderr.trim() || result.stdout.trim() || `cmux exited with code ${result.code}`,
    };
  }
  return {
    ok: true,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Ask cmux which workspace and surface launched the current Pi session.
 *
 * First principles:
 * - environment variables are only a hint that we are inside cmux
 * - cmux itself is the authoritative source for where a new split should be
 *   attached
 *
 * Higher-level helpers like `openSplit()` use this so they always target the
 * live parent surface rather than re-deriving that information themselves.
 */
export async function identifyCaller(
  pi: ExtensionAPI,
): Promise<{ ok: true; caller: CmuxCallerInfo } | { ok: false; error: string }> {
  const result = await execCmux(pi, ["--json", "identify"]);
  if (!result.ok) {
    return { ok: false, error: result.error || "Failed to identify cmux caller" };
  }

  const parsed = parseJson<CmuxIdentifyResponse>(result.stdout);
  const workspaceRef = parsed?.caller?.workspace_ref;
  const surfaceRef = parsed?.caller?.surface_ref;

  if (!workspaceRef || !surfaceRef) {
    return {
      ok: false,
      error: "This command must be run from inside a cmux surface",
    };
  }

  return {
    ok: true,
    caller: { workspaceRef, surfaceRef },
  };
}
