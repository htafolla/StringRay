import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';
import { frameworkLogger } from '../../core/framework-logger.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export function registerHermesCommands(hermesCmd: Command) {
  hermesCmd
    .command('install')
    .description('Install 0xRay as a Hermes Agent plugin (hooks + MCP servers)')
    .option('--dry-run', 'Show what would be done without making changes')
    .option('--force', 'Force reinstall even if already present')
    .action(async (options) => {
      await installForHermes({ dryRun: options.dryRun, force: options.force });
    });
}

interface HermesInstallOptions {
  force?: boolean;
  dryRun?: boolean;
}

async function installForHermes(options: HermesInstallOptions = {}): Promise<void> {
  frameworkLogger.log('hermes-integration', 'install-start', 'info', { options });

  const home = homedir();
  const targetPluginDir = path.join(home, '.hermes/plugins/strray-hermes');

  const possibleSources = [
    path.join(__dirname, '..', '..', '..', 'dist/integrations/hermes-agent'),
    path.join(__dirname, '..', '..', '..', 'src/integrations/hermes-agent'),
  ];

  let sourceDir = possibleSources.find(p => fs.existsSync(p));
  if (!sourceDir) {
    console.error('[Hermes] Could not locate the strray-hermes plugin inside the package.');
    return;
  }

  if (options.dryRun) {
    console.log(`[Hermes] Dry run: Would copy plugin from ${sourceDir} → ${targetPluginDir}`);
    return;
  }

  try {
    if (fs.existsSync(targetPluginDir) && !options.force) {
      console.log('[Hermes] strray-hermes plugin is already installed.');
      console.log('Use --force to reinstall.');
      return;
    }

    fs.mkdirSync(targetPluginDir, { recursive: true });
    for (const entry of fs.readdirSync(sourceDir)) {
      const src = path.join(sourceDir, entry);
      const dst = path.join(targetPluginDir, entry);
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dst, { recursive: true, force: true });
      } else {
        fs.copyFileSync(src, dst);
      }
    }
    frameworkLogger.log('hermes-integration', 'plugin-copied', 'info', { destination: targetPluginDir });
    console.log(`\x1b[32m✓ Copied Hermes plugin to ${targetPluginDir}\x1b[0m`);

    // Write after-install instructions
    const afterInstallPath = path.join(targetPluginDir, 'after-install.md');
    if (fs.existsSync(afterInstallPath)) {
      console.log(`\nSee ${afterInstallPath} for post-install steps.`);
    }

    console.log('\n✅ 0xRay is now installed as a Hermes Agent plugin!');
    console.log('Restart Hermes to load the plugin and its tools.');
    console.log('  Run: /strray status  (to verify)');

  } catch (err: any) {
    frameworkLogger.log('hermes-integration', 'install-error', 'error', { error: err.message });
    console.error('Failed to install Hermes plugin:', err.message);
  }

  frameworkLogger.log('hermes-integration', 'install-complete', 'info', {});
}
