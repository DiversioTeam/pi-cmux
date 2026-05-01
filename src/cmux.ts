import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

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

export function isInsideCmux(): boolean {
  return Boolean(
    process.env.CMUX_SOCKET_PATH &&
      process.env.CMUX_WORKSPACE_ID &&
      process.env.CMUX_SURFACE_ID,
  );
}

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
