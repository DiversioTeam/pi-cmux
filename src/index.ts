/**
 * Stable public surface for `@diversioteam/pi-cmux`.
 *
 * Keep this file intentionally explicit. Future readers should be able to scan
 * one place and answer two questions quickly:
 * - what does the package promise to consumers?
 * - which lower-level modules are implementation details vs public API?
 */
export {
  CMUX_TIMEOUT_MS,
  execCmux,
  identifyCaller,
  isInsideCmux,
  type CmuxCallerInfo,
  type CmuxExecResult,
} from "./cmux.js";
export {
  buildPiCommand,
  buildShellCommand,
  resolvePiLauncher,
  wrapSpawnedCommand,
} from "./launch.js";
export { shellEscape } from "./escape.js";
export { openSplit, SPLIT_BOOT_DELAY_MS, type SplitDirection } from "./split.js";
export { notify } from "./notify.js";
export { openWorkspace, type OpenWorkspaceOptions } from "./workspace.js";
