#!/usr/bin/env node

/**
 * StringRay Framework Configuration Manager
 * Centralized configuration and setup utilities
 * 
 * Purpose: Manages StringRay framework configuration and development environment setup
 * 
 * Features:
 * - Create default configuration files
 * - Validate existing configuration
 * - Setup development environment
 * - Run setup commands with timeout handling
 * 
 * Usage:
 *   node scripts/config/utils.js <command>
 * 
 * Commands:
 *   init       - Create default configuration
 *   setup-dev  - Setup development environment
 *   validate   - Validate configuration
 * 
 * Examples:
 *   node scripts/config/utils.js init
 *   node scripts/config/utils.js validate
 * 
 * Author: StringRay Enforcer Agent
 * Version: 1.9.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigManager {
  constructor() {
    this.projectDir = process.cwd();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '⚙️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'config': '🔧'
    }[type] || '⚙️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  createDefaultConfig() {
    this.log('Creating default StringRay configuration...', 'config');
    
    const defaultConfig = {
      framework: {
        name: 'StringRay Framework',
        version: '1.9.0',
        buildMode: 'production',
        logLevel: 'info'
      },
      agents: {
        orchestrator: {
          enabled: true,
          maxComplexity: 100,
          timeout: 30000
        },
        enforcer: {
          enabled: true,
          strictMode: true,
          todoSystem: 'file-based'
        },
        testing: {
          parallelExecution: true,
          timeout: 120000,
          coverageThreshold: 85
        }
      },
      monitoring: {
        enabled: true,
        logRetention: '7d',
        healthChecks: true
      }
    };
    
    const configPath = path.join(this.projectDir, '.strrayrc.json');
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    this.log(`✅ Configuration saved to: ${configPath}`, 'success');
    
    return configPath;
  }

  validateConfig() {
    const configPath = path.join(this.projectDir, '.strrayrc.json');
    
    if (!fs.existsSync(configPath)) {
      this.log('Configuration file not found, creating default...', 'warning');
      return this.createDefaultConfig();
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.log('✅ Configuration loaded successfully', 'success');
      return config;
    } catch (error) {
      this.log(`❌ Failed to load configuration: ${error.message}`, 'error');
      return null;
    }
  }

  async setupDevelopment() {
    this.log('Setting up StringRay development environment...', 'config');
    
    const setupSteps = [
      { name: 'Install Dependencies', command: 'npm install' },
      { name: 'Build Framework', command: 'npm run build' },
      { name: 'Setup Hooks', command: 'node scripts/node/postinstall.cjs' },
      { name: 'Validate Setup', command: 'npm run validate' }
    ];

    for (const step of setupSteps) {
      try {
        this.log(`Running: ${step.name}`);
        await this.runCommand(step.command);
        this.log(`✅ ${step.name}: Completed`);
      } catch (error) {
        this.log(`❌ ${step.name}: Failed - ${error.message}`, 'error');
        return false;
      }
    }
    
    this.log('🎉 Development setup completed successfully!', 'success');
    return true;
  }

  runCommand(command, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, { 
        shell: true, 
        stdio: 'pipe',
        cwd: this.projectDir
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${command}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
}

// CLI interface
const configManager = new ConfigManager();
const command = process.argv[2];

switch (command) {
  case 'init':
    configManager.createDefaultConfig();
    break;
    
  case 'setup-dev':
    configManager.setupDevelopment();
    break;
    
  case 'validate':
    const config = configManager.validateConfig();
    if (config) {
      console.log('✅ Configuration is valid');
      process.exit(0);
    } else {
      console.log('❌ Configuration is invalid');
      process.exit(1);
    }
    break;
    
  default:
    console.log('StringRay Configuration Manager');
    console.log('====================================');
    console.log('Available commands:');
    console.log('  init       - Create default configuration');
    console.log('  setup-dev  - Setup development environment');
    console.log('  validate   - Validate configuration');
    console.log('');
    console.log('Usage: node scripts/config/utils.js <command>');
    process.exit(1);
}
