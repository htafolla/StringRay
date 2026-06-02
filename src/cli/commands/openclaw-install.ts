import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { frameworkLogger } from '../../core/framework-logger.js';
import { OpenClawConfigLoader } from '../../integrations/openclaw/config.js';

export function registerOpenClawCommands(openclawCmd: Command) {
  openclawCmd
    .command('install')
    .description('Install 0xRay OpenClaw integration (config + API server setup)')
    .option('--dry-run', 'Show what would be done without making changes')
    .option('--force', 'Force reinstall even if already present')
    .action(async (options) => {
      await installForOpenClaw({ dryRun: options.dryRun, force: options.force });
    });
}

interface OpenClawInstallOptions {
  force?: boolean;
  dryRun?: boolean;
}

async function installForOpenClaw(options: OpenClawInstallOptions = {}): Promise<void> {
  frameworkLogger.log('openclaw-integration', 'install-start', 'info', { options });

  const configPath = path.join(process.cwd(), '.strray', 'config', 'openclaw.json');

  if (options.dryRun) {
    console.log(`[OpenClaw] Dry run: Would create config at ${configPath}`);
    return;
  }

  try {
    if (fs.existsSync(configPath) && !options.force) {
      console.log(`[OpenClaw] Config already exists at ${configPath}.`);
      console.log('Use --force to overwrite.');
      return;
    }

    const loader = new OpenClawConfigLoader(configPath);
    loader.createSampleConfig();

    const relative = path.relative(process.cwd(), configPath);
    console.log(`\x1b[32m✓ Created OpenClaw config at ${relative}\x1b[0m`);

    console.log('\n✅ 0xRay OpenClaw integration configured!');
    console.log('Edit the config file to set your gateway URL, auth token, and device ID.');
    console.log('');
    console.log('To initialize the integration in code:');
    console.log('  import { initializeOpenClawIntegration } from "strray-ai";');
    console.log('  const integration = await initializeOpenClawIntegration();');

  } catch (err: any) {
    frameworkLogger.log('openclaw-integration', 'install-error', 'error', { error: err.message });
    console.error('Failed to install OpenClaw integration:', err.message);
  }

  frameworkLogger.log('openclaw-integration', 'install-complete', 'info', {});
}
