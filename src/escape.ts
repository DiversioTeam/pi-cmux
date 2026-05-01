/**
 * Escape one argument for POSIX shell command composition.
 *
 * We intentionally keep this tiny and boring because nearly every higher-level
 * helper in this package eventually builds one `sh -lc` command string.
 * A quote bug here would mean:
 * - the wrong cwd
 * - the wrong prompt
 * - or the wrong child command
 *
 * We always return a single-quoted shell literal and escape embedded single
 * quotes using the standard close-quote / escaped-quote / reopen-quote shell
 * pattern.
 */
export function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
