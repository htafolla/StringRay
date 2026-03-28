/**
 * Configuration Loader
 * 
 * Loads MCP server configurations from various sources including
 * JSON configuration files.
 * 
 * Extracted from mcp-client.ts as part of Phase 2 refactoring.
 */

import * as fs from 'fs';
import * as path from 'path';
import { IServerConfig } from '../types/index.js';

/**
 * Result of a configuration load operation
 */
export interface ConfigLoadResult {
  success: boolean;
  configs?: IServerConfig[];
  error?: string;
}

/**
 * Loads MCP server configurations from files
 */
export class ConfigLoader {
  private configPaths: string[] = [
    '.mcp.json',
    '.opencode/mcp.json',
    'mcp.config.json',
  ];

  /**
   * Load configurations from available config files
   * Returns empty array if no config file exists (this is valid)
   */
  async load(): Promise<ConfigLoadResult> {
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf-8');
          const parsed = JSON.parse(content);
          
          // Handle both array format and object with servers property
          const configs: IServerConfig[] = Array.isArray(parsed) 
            ? parsed 
            : parsed.servers || [];
          
          return { success: true, configs };
        } catch (error) {
          return {
            success: false,
            error: `Failed to load ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    }
    
    // No config file is OK - return empty array
    return { success: true, configs: [] };
  }

  /**
   * Add a custom config path to search
   */
  addConfigPath(configPath: string): void {
    this.configPaths.push(configPath);
  }

  /**
   * Get all configured config paths
   */
  getConfigPaths(): string[] {
    return [...this.configPaths];
  }

  /**
   * Reset config paths to defaults
   */
  resetConfigPaths(): void {
    this.configPaths = [
      '.mcp.json',
      '.opencode/mcp.json',
      'mcp.config.json',
    ];
  }

  /**
   * Load configuration from a specific file path
   */
  async loadFromPath(filePath: string): Promise<ConfigLoadResult> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Config file not found: ${filePath}`,
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      const configs: IServerConfig[] = Array.isArray(parsed) 
        ? parsed 
        : parsed.servers || [];
      
      return { success: true, configs };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if any config file exists
   */
  hasConfigFile(): boolean {
    return this.configPaths.some(path => fs.existsSync(path));
  }
}

/**
 * Default singleton instance of the config loader
 */
export const defaultConfigLoader = new ConfigLoader();
