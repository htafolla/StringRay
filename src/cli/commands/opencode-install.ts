import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { frameworkLogger } from '../../core/framework-logger.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export function registerOpencodeCommands(opencodeCmd: Command) {
  opencodeCmd
    .command('install')
    .description('Install 0xRay OpenCode plugin (agents, skills, hooks, config)')
    .option('--dry-run', 'Show what would be done without making changes')
    .option('--force', 'Force reinstall even if already present')
    .action(async (options) => {
      await installForOpencode({ dryRun: options.dryRun, force: options.force });
    });
}

interface OpencodeInstallOptions {
  force?: boolean;
  dryRun?: boolean;
}

const MERGE_FILES = new Set(["strray/features.json", "enforcer-config.json"]);
const SKIP_DIRS = new Set(["node_modules", "logs"]);
const KEEP_IF_EXISTS = new Set([".yml", ".yaml", ".md"]);

function deepMerge(src: any, dest: any): any {
  if (typeof src !== "object" || src === null) return dest !== undefined ? dest : src;
  if (Array.isArray(src)) return Array.isArray(dest) ? dest : src;
  const result: any = {};
  for (const key of Object.keys(src)) {
    result[key] = dest && typeof dest[key] !== "undefined" ? deepMerge(src[key], dest[key]) : src[key];
  }
  if (dest && typeof dest === "object") {
    for (const key of Object.keys(dest)) {
      if (!(key in src)) result[key] = dest[key];
    }
  }
  return result;
}

function copyDir(src: string, dest: string, relPath = ""): void {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const rel = path.join(relPath, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, rel);
    } else if (MERGE_FILES.has(rel)) {
      try {
        const srcData = JSON.parse(fs.readFileSync(srcPath, "utf8"));
        if (fs.existsSync(destPath)) {
          const destData = JSON.parse(fs.readFileSync(destPath, "utf8"));
          fs.writeFileSync(destPath, JSON.stringify(deepMerge(srcData, destData), null, 2));
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch {
        fs.copyFileSync(srcPath, destPath);
      }
    } else if (KEEP_IF_EXISTS.has(path.extname(srcPath)) && fs.existsSync(destPath)) {
      return;
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function installForOpencode(options: OpencodeInstallOptions = {}): Promise<void> {
  frameworkLogger.log('opencode-integration', 'install-start', 'info', { options });

  const opencodeSource = path.join(__dirname, '..', '..', '..', '.opencode');
  const opencodeDest = path.join(process.cwd(), '.opencode');

  if (!fs.existsSync(opencodeSource)) {
    console.error('[Opencode] Could not locate .opencode/ directory inside the package.');
    return;
  }

  if (options.dryRun) {
    console.log(`[Opencode] Dry run: Would copy ${opencodeSource} → ${opencodeDest}`);
    return;
  }

  try {
    if (fs.existsSync(opencodeDest) && !options.force) {
      console.log('[Opencode] .opencode/ directory already exists.');
      console.log('Use --force to reinstall.');
      return;
    }

    copyDir(opencodeSource, opencodeDest);
    frameworkLogger.log('opencode-integration', 'opencode-copied', 'info', { destination: opencodeDest });

    console.log(`\x1b[32m✓ Copied OpenCode config to .opencode/\x1b[0m`);
    console.log('\n✅ 0xRay OpenCode plugin installed!');
    console.log('Restart OpenCode or run `opencode` to load the plugin.');

  } catch (err: any) {
    frameworkLogger.log('opencode-integration', 'install-error', 'error', { error: err.message });
    console.error('Failed to install OpenCode plugin:', err.message);
  }

  frameworkLogger.log('opencode-integration', 'install-complete', 'info', {});
}
