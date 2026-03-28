/**
 * Consent Manager for StringRay Central Analytics
 *
 * Manages user consent for analytics data submission with granular
 * control over what categories can be shared.
 *
 * @version 1.0.0
 * @since 2026-03-06
 */

import * as fs from "fs/promises";
import * as path from "path";

export interface ConsentConfiguration {
  analyticsEnabled: boolean;
  consentDate: Date;
  consentVersion: string;
  lastOptOut: Date | undefined;
  categories: {
    reflections: boolean;
    logs: boolean;
    metrics: boolean;
    patterns: boolean;
  };
  projectId: string;
}

export interface ConsentCategory {
  name: string;
  description: string;
  enabled: boolean;
}

export class ConsentManager {
  private configPath: string;
  private config: ConsentConfiguration | null = null;
  private submissionQueue: any[] = [];
  
  constructor(configPath = ".opencode/consent.json") {
    this.configPath = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  }

  /**
   * Initialize consent manager - load existing config or create default
   */
  async initialize(): Promise<ConsentConfiguration> {
    try {
      await this.loadConfig();
      
      if (!this.config) {
        // Create default disabled configuration
        this.config = this.createDefaultConfig();
        await this.saveConfig();
      }
      
      return this.config!;
    } catch (error) {
      // If config doesn't exist, create default
      this.config = this.createDefaultConfig();
      await this.saveConfig();
      return this.config;
    }
  }

  /**
   * Enable analytics (opt-in)
   */
  async enableConsent(categories?: string[]): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }
    
    if (!this.config) {
      throw new Error("Failed to initialize consent configuration");
    }

    // Enable all categories if none specified
    const categoriesToEnable = categories || Object.keys(this.config.categories);
    
    // Enable main analytics flag
    this.config.analyticsEnabled = true;
    this.config.consentDate = new Date();
    this.config.consentVersion = "1.0";
    
    // Enable specified categories
    categoriesToEnable.forEach(cat => {
      if (this.config && cat in this.config.categories) {
        (this.config.categories as any)[cat] = true;
      }
    });

    // Generate project ID if not exists
    if (!this.config.projectId || this.config.projectId === "") {
      this.config.projectId = this.generateProjectId();
    }

    await this.saveConfig();
  }

  /**
   * Disable analytics (opt-out)
   */
  async disableConsent(): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }
    
    if (!this.config) {
      throw new Error("Failed to initialize consent configuration");
    }

    // Disable all analytics
    this.config.analyticsEnabled = false;
    this.config.lastOptOut = new Date();
    
    // Disable all categories
    Object.keys(this.config!.categories).forEach(cat => {
      (this.config!.categories as any)[cat] = false;
    });

    await this.saveConfig();
    
    // Clear submission queue
    await this.clearSubmissionQueue();
  }

  /**
   * Check if submission is allowed for a category
   */
  canSubmit(category: string): boolean {
    if (!this.config) {
      return false;
    }

    return this.config.analyticsEnabled &&
           (this.config.categories as any)[category] === true;
  }

  /**
   * Get current consent status
   */
  async getStatus(): Promise<ConsentConfiguration> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config) {
      throw new Error("Failed to load consent configuration");
    }

    return { ...this.config! };
  }

  /**
   * Enable specific category
   */
  async enableCategory(category: string): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config || !(category in this.config.categories)) {
      throw new Error(`Invalid category: ${category}`);
    }

    (this.config!.categories as any)[category] = true;
    await this.saveConfig();
  }

  /**
   * Disable specific category
   */
  async disableCategory(category: string): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }

    if (!this.config || !(category in this.config.categories)) {
      throw new Error(`Invalid category: ${category}`);
    }

    (this.config!.categories as any)[category] = false;
    await this.saveConfig();
  }

  /**
   * Get all categories with their status
   */
  getCategories(): ConsentCategory[] {
    if (!this.config) {
      return [];
    }

    const categoryInfo: Record<string, string> = {
      reflections: "Anonymized reflection data for pattern learning",
      logs: "Framework activity logs for performance analysis",
      metrics: "Agent performance and routing metrics",
      patterns: "P9 pattern learning data and insights"
    };

    return Object.entries(this.config.categories).map(([name, enabled]) => ({
      name,
      description: categoryInfo[name] || "",
      enabled: enabled as boolean
    }));
  }

  /**
   * Generate anonymous project ID
   */
  private generateProjectId(): string {
    // Generate UUID-like identifier
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `project-${timestamp}-${random}`;
  }

  /**
   * Create default disabled configuration
   */
  private createDefaultConfig(): ConsentConfiguration {
    return {
      analyticsEnabled: false,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: false,
        logs: false,
        metrics: false,
        patterns: false
      },
      projectId: this.generateProjectId()
    };
  }

  /**
   * Load configuration from file
   */
  private async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(configData);

      // Convert date strings back to Date objects
      if (this.config!.consentDate) {
        this.config!.consentDate = new Date(this.config!.consentDate as any);
      }
      if (this.config!.lastOptOut) {
        this.config!.lastOptOut = new Date(this.config!.lastOptOut as any);
      }
    } catch (error) {
      // Config doesn't exist or is invalid
      this.config = null;
    }
  }

  /**
   * Save configuration to file
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error("No configuration to save");
    }

    // Ensure directory exists
    const configDir = path.dirname(this.configPath);
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch {
      // Directory already exists
    }

    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
  }

  /**
   * Clear submission queue
   */
  private async clearSubmissionQueue(): Promise<void> {
    const queuePath = path.join(path.dirname(this.configPath), "analytics", "submission-queue.json");
    
    try {
      await fs.writeFile(queuePath, "[]", "utf-8");
      this.submissionQueue = [];
    } catch (error) {
      // Queue directory doesn't exist yet, which is fine
    }
  }

  /**
   * Add item to submission queue
   */
  async queueSubmission(data: any): Promise<void> {
    if (!this.canSubmit("all")) {
      throw new Error("Analytics is disabled or category not enabled");
    }

    this.submissionQueue.push(data);
    await this.saveSubmissionQueue();
  }

  /**
   * Save submission queue to file
   */
  private async saveSubmissionQueue(): Promise<void> {
    const queueDir = path.join(path.dirname(this.configPath), "analytics");
    const queuePath = path.join(queueDir, "submission-queue.json");

    try {
      await fs.mkdir(queueDir, { recursive: true });
      await fs.writeFile(queuePath, JSON.stringify(this.submissionQueue, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save submission queue:", error);
    }
  }
}