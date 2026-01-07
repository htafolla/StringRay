/**
 * Base agent class for StrRay framework stub implementations
 */
export abstract class StrRayBaseAgent {
  protected name: string;
  protected capabilities: string[];

  constructor(name: string, capabilities: string[] = []) {
    this.name = name;
    this.capabilities = capabilities;
  }

  /**
   * Execute a task
   */
  abstract execute(task: any): Promise<any>;

  /**
   * Get agent capabilities
   */
  getCapabilities(): string[] {
    return this.capabilities;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }
}
