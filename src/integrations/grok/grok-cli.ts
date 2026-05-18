/**
 * Grok CLI Integration for StringRay / 0xRay
 *
 * This module provides the integration points for using 0xRay with the official Grok CLI.
 *
 * Primary mechanism: MCP (Model Context Protocol)
 * Grok CLI can consume MCP servers. By registering the 0xRay MCP servers,
 * users get access to Governance, skills, and other capabilities directly inside Grok conversations.
 *
 * Recommended registration (via npx or Grok's tooling):
 *   npx strray-ai grok install
 *
 * This will help configure the user's Grok CLI to include the following MCP servers:
 * - governance (Dynamo Solar SSOT + real skill deliberation)
 * - All knowledge-skill MCP servers (code-review, security-audit, researcher, etc.)
 */

import { frameworkLogger } from '../../core/framework-logger.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ESM-compatible __dirname (this file is compiled to ESM)
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export interface GrokInstallOptions {
  force?: boolean;
  dryRun?: boolean;
}

export async function installForGrokCLI(options: GrokInstallOptions = {}): Promise<void> {
  frameworkLogger.log('grok-integration', 'install-start', 'info', { options });

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const targetPluginDir = path.join(home, '.grok/plugins/strray-ai');

  // Try to find the plugin source from the installed package
  const possibleSources = [
    path.join(__dirname, '..', '..', '..', 'src/integrations/grok/plugin/strray-ai'), // dev
    path.join(__dirname, '..', '..', '..', '.grok/plugins/strray-ai'), // after build
  ];

  let sourceDir = possibleSources.find(p => fs.existsSync(p));

  if (!sourceDir) {
    console.error('[Grok] Could not locate the strray-ai Grok plugin inside the package.');
    return;
  }

  if (options.dryRun) {
    console.log(`[Grok] Dry run: Would copy plugin from ${sourceDir} → ${targetPluginDir}`);
    return;
  }

  try {
    if (fs.existsSync(targetPluginDir) && !options.force) {
      console.log('[Grok] strray-ai Grok plugin is already installed.');
      console.log('Use --force to reinstall.');
      return;
    }

    fs.cpSync(sourceDir, targetPluginDir, { recursive: true, force: true });
    frameworkLogger.log('grok-integration', 'plugin-copied', 'info', { destination: targetPluginDir });

    console.log(`\x1b[32m✓ Copied Grok plugin to ${targetPluginDir}\x1b[0m`);

    // Attempt auto-trust (best effort)
    try {
      execSync(`grok plugins trust "${targetPluginDir}"`, { stdio: 'ignore' });
      console.log('\x1b[32m✓ Auto-trusted the strray-ai plugin with Grok CLI\x1b[0m');
    } catch {
      console.log('\nPlease run this command to fully trust the plugin:');
      console.log(`  grok plugins trust "${targetPluginDir}"`);
    }

    console.log('\n✅ 0xRay is now installed as a first-class Grok CLI plugin!');
    console.log('Restart Grok or run `grok` to load the new hooks and MCP servers.');

  } catch (err: any) {
    frameworkLogger.log('grok-integration', 'install-error', 'error', { error: err.message });
    console.error('Failed to install Grok plugin:', err.message);
  }

  frameworkLogger.log('grok-integration', 'install-complete', 'info', {});
}

export default {
  installForGrokCLI,
};
