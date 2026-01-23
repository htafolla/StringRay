/**
 * Import Resolver Utility
 * Dynamically resolves module imports across different environments
 *
 * This solves the systemic path resolution issue where hardcoded paths
 * break between development, built, and deployed environments.
 */

import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

export class ImportResolver {
  private static instance: ImportResolver;
  private currentDir: string;
  private projectRoot: string;
  private isDevelopment: boolean;
  private isBuilt: boolean;
  private isInstalled: boolean;
  private isTesting: boolean;

  private constructor() {
    this.currentDir = this.getCurrentDirectory();
    this.projectRoot = this.findProjectRoot();
    this.isDevelopment = this.detectDevelopment();
    this.isBuilt = this.detectBuilt();
    this.isInstalled = this.detectInstalled();
    this.isTesting = this.detectTesting();
  }

  static getInstance(): ImportResolver {
    if (!ImportResolver.instance) {
      ImportResolver.instance = new ImportResolver();
    }
    return ImportResolver.instance;
  }

  private getCurrentDirectory(): string {
    try {
      const currentFile = fileURLToPath(import.meta.url);
      return dirname(currentFile);
    } catch (error) {
      return process.cwd();
    }
  }

  private findProjectRoot(): string {
    let dir = this.currentDir;
    const maxDepth = 10;

    for (let i = 0; i < maxDepth; i++) {
      if (this.fileExists(join(dir, "package.json"))) {
        return dir;
      }
      const parent = dirname(dir);
      if (parent === dir) break; // Reached root
      dir = parent;
    }

    return process.cwd(); // Fallback
  }

  private fileExists(filePath: string): boolean {
    try {
      require.resolve(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private detectDevelopment(): boolean {
    return (
      this.currentDir.includes("/src/") ||
      this.currentDir.includes("\\src\\") ||
      process.env.NODE_ENV === "development" ||
      this.fileExists(join(this.projectRoot, "tsconfig.json"))
    );
  }

  private detectBuilt(): boolean {
    return (
      this.currentDir.includes("/dist/") ||
      this.currentDir.includes("\\dist\\") ||
      this.currentDir.includes("node_modules") ||
      !this.fileExists(join(this.projectRoot, "src"))
    );
  }

  private detectInstalled(): boolean {
    return (
      this.currentDir.includes("/node_modules/") ||
      this.currentDir.includes("\\node_modules\\") ||
      (this.currentDir.includes("strray") &&
        !this.currentDir.includes(this.projectRoot))
    );
  }

  private detectTesting(): boolean {
    return (
      process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true" ||
      this.currentDir.includes("/__tests__/") ||
      this.currentDir.includes("\\__tests__\\")
    );
  }

  /**
   * Resolve module import path for any module
   */
  resolveModulePath(moduleName: string, subPath: string = ""): string {
    const fullModuleName = subPath ? `${subPath}/${moduleName}` : moduleName;

    if (this.isTesting) {
      // In tests, prefer built versions to avoid import issues
      return `../dist/plugin/${fullModuleName}.js`;
    } else if (this.isDevelopment) {
      // In development, use source files
      return `../src/${fullModuleName}.ts`;
    } else if (this.isBuilt || this.isInstalled) {
      // In built/deployed environments, use compiled files
      return `../dist/plugin/${fullModuleName}.js`;
    } else {
      // Fallback - try built first, then source
      return `../dist/plugin/${fullModuleName}.js`;
    }
  }

  /**
   * Resolve agent import path (special case for agents)
   */
  resolveAgentPath(agentName: string): string {
    if (this.isDevelopment) {
      return `./agents/${agentName}.js`;
    } else if (this.isBuilt || this.isInstalled) {
      return `../agents/${agentName}.js`;
    } else {
      return `../agents/${agentName}.js`;
    }
  }

  /**
   * Dynamic import with comprehensive environment resolution
   */
  async importModule(moduleName: string, subPath: string = ""): Promise<any> {
    const primaryPath = this.resolveModulePath(moduleName, subPath);

    // Try primary path first
    try {
      return await import(primaryPath);
    } catch (error) {
      console.warn(
        `⚠️ Failed to import ${moduleName} from primary path: ${primaryPath}`,
      );

      // Try alternative paths based on environment
      const altPaths = this.generateAlternativePaths(moduleName, subPath);

      for (const altPath of altPaths) {
        try {
          return await import(altPath);
        } catch (altError) {
          continue;
        }
      }

      // Final fallback - try to resolve from project root
      try {
        const rootPath = join(
          this.projectRoot,
          "dist/plugin",
          subPath,
          `${moduleName}.js`,
        );
        return await import(rootPath);
      } catch (rootError) {
        throw new Error(
          `Cannot import module ${moduleName} from any path. Primary: ${primaryPath}, Alternatives tried: ${altPaths.length}`,
        );
      }
    }
  }

  /**
   * Generate alternative import paths for fallback
   */
  private generateAlternativePaths(
    moduleName: string,
    subPath: string,
  ): string[] {
    const fullModuleName = subPath ? `${subPath}/${moduleName}` : moduleName;
    const paths: string[] = [];

    if (this.isDevelopment) {
      // Development alternatives
      paths.push(
        `../dist/plugin/${fullModuleName}.js`,
        `../src/${fullModuleName}.ts`,
        `./${fullModuleName}.ts`,
        `../dist/${fullModuleName}.js`,
      );
    } else {
      // Built/deployed alternatives
      paths.push(
        `../src/${fullModuleName}.ts`,
        `../dist/plugin/${fullModuleName}.js`,
        `./${fullModuleName}.js`,
        `../dist/${fullModuleName}.js`,
      );
    }

    // Add absolute paths as last resort
    try {
      const absPath = resolve(
        this.projectRoot,
        "dist/plugin",
        subPath,
        `${moduleName}.js`,
      );
      paths.push(absPath);
    } catch {
      // Ignore absolute path generation errors
    }

    return [...new Set(paths)]; // Remove duplicates
  }

  /**
   * Get comprehensive environment information
   */
  getEnvironmentInfo(): {
    currentDir: string;
    projectRoot: string;
    isDevelopment: boolean;
    isBuilt: boolean;
    isInstalled: boolean;
    isTesting: boolean;
    nodeEnv: string | undefined;
  } {
    return {
      currentDir: this.currentDir,
      projectRoot: this.projectRoot,
      isDevelopment: this.isDevelopment,
      isBuilt: this.isBuilt,
      isInstalled: this.isInstalled,
      isTesting: this.isTesting,
      nodeEnv: process.env.NODE_ENV,
    };
  }
}

export const importResolver = ImportResolver.getInstance();
