/**
 * Config Path Resolver
 *
 * Centralizes all StringRay config file path resolution.
 * Supports STRRAY_CONFIG_DIR env var for custom config roots,
 * making .opencode/ completely optional for environments like Hermes Agent.
 *
 * Resolution order (per file type):
 *   1. STRRAY_CONFIG_DIR/<relative_path>     (if env var set)
 *   2. .strray/<relative_path>                (preferred lightweight root)
 *   3. .opencode/strray/<relative_path>       (legacy OpenCode root)
 *   4. null                                   (callers fall back to built-in defaults)
 *
 * For state/data directories, uses:
 *   1. STRRAY_CONFIG_DIR/state                 (if env var set)
 *   2. .strray/state
 *   3. .opencode/state                         (legacy)
 *   4. .strray/state                           (default — always writable)
 */

import { existsSync } from "fs";
import { join, resolve } from "path";

/** Environment variable name for custom config root */
export const STRRAY_CONFIG_DIR_ENV = "STRRAY_CONFIG_DIR";

/** Resolved config directories, cached per projectRoot */
const _resolvedConfigDirs = new Map<string, string>();

/**
 * Detect the best available config directory.
 * Scans in priority order and caches the first one that exists (or the first default).
 */
export function getConfigDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  const cached = _resolvedConfigDirs.get(root);
  if (cached) return cached;
  const envDir = process.env[STRRAY_CONFIG_DIR_ENV];

  // Priority candidates
  const candidates: Array<{ dir: string; source: string }> = [];

  if (envDir) {
    // Explicit env override — always use this even if it doesn't exist yet
    const resolved = resolve(root, envDir);
    candidates.push({ dir: resolved, source: "env" });
  }

  candidates.push({ dir: join(root, ".strray"), source: "dot-strray" });
  candidates.push({ dir: join(root, ".opencode", "strray"), source: "dot-opencode" });

  // Return the first that exists, or the highest-priority default
  for (const c of candidates) {
    if (existsSync(c.dir)) {
      _resolvedConfigDirs.set(root, c.dir);
      return c.dir;
    }
  }

  // Nothing exists — use highest priority default (env > .strray > .opencode)
  const defaultDir = candidates[0]!;
  _resolvedConfigDirs.set(root, defaultDir.dir);
  return defaultDir.dir;
}

/**
 * Resolve a specific config file path using the standard priority chain.
 * Returns null if no suitable path is found (caller should use defaults).
 *
 * @param relativePath - Path relative to config dir (e.g., "features.json")
 * @param projectRoot  - Optional project root override
 */
export function resolveConfigPath(relativePath: string, projectRoot?: string): string | null {
  const root = projectRoot || process.cwd();
  const envDir = process.env[STRRAY_CONFIG_DIR_ENV];

  const candidates: string[] = [];

  if (envDir) {
    candidates.push(resolve(root, envDir, relativePath));
  }
  candidates.push(join(root, ".strray", relativePath));
  candidates.push(join(root, ".opencode", "strray", relativePath));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Return highest-priority default path even if it doesn't exist
  // (callers will handle missing file gracefully)
  return candidates[0] ?? null;
}

/**
 * Get the state persistence directory (the parent directory for state.json).
 * Similar logic to resolveConfigPath but for the state/ subdirectory.
 */
export function resolveStateDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  const envDir = process.env[STRRAY_CONFIG_DIR_ENV];

  const candidates: string[] = [];
  if (envDir) {
    candidates.push(join(root, envDir, "state"));
  }
  candidates.push(join(root, ".strray", "state"));
  candidates.push(join(root, ".opencode", "state"));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Default: use highest-priority path (will be auto-created by StateManager)
  return candidates[0]!;
}

/**
 * Get the state persistence FILE path (e.g. .opencode/state/state.json).
 * Prefer this over resolveStateDir when you need a file path for fs.writeFileSync.
 */
export function resolveStateFilePath(projectRoot?: string): string {
  return join(resolveStateDir(projectRoot), "state.json");
}

/**
 * Get the profiles storage directory.
 */
export function resolveProfilesDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  const envDir = process.env[STRRAY_CONFIG_DIR_ENV];

  const candidates: string[] = [];
  if (envDir) {
    candidates.push(join(root, envDir, "profiles"));
  }
  candidates.push(join(root, ".strray", "profiles"));
  candidates.push(join(root, ".opencode", "strray", "profiles"));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0]!;
}

/**
 * Resolve codex.json path.
 * Has additional fallback locations beyond the standard config dir.
 */
export function resolveCodexPath(projectRoot?: string): string[] {
  const root = projectRoot || process.cwd();
  const envDir = process.env[STRRAY_CONFIG_DIR_ENV];

  const candidates: string[] = [];
  if (envDir) {
    candidates.push(join(root, envDir, "codex.json"));
  }
  candidates.push(join(root, ".strray", "codex.json"));
  candidates.push(join(root, ".opencode", "strray", "codex.json"));
  // Additional fallback locations (for standalone usage)
  candidates.push(join(root, "codex.json"));
  candidates.push(join(root, "src", "codex.json"));
  candidates.push(join(root, "docs", "agents", "codex.json"));

  return candidates;
}

/**
 * Get the logs directory for framework logging.
 */
export function resolveLogDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd();

  // Logs always go to logs/framework/ regardless of config dir
  return join(root, "logs", "framework");
}

/**
 * Reset the cached config dir (useful for testing).
 */
export function resetConfigDirCache(): void {
  _resolvedConfigDirs.clear();
}
