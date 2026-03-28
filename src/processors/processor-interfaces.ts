/**
 * Processor Interface and Base Classes
 *
 * Defines the contract for all processors in the StringRay framework.
 * Replaces the switch statement anti-pattern in ProcessorManager with
 * polymorphic processor classes.
 *
 * @module processors/interfaces
 * @version 1.0.0
 */

import { ProcessorContext, ProcessorResult } from "./processor-types.js";

/**
 * Processor interface - all processors must implement this
 */
export interface IProcessor {
  /** Unique processor identifier */
  readonly name: string;

  /** Processor type: pre or post */
  readonly type: "pre" | "post";

  /** Execution priority (lower = earlier) */
  readonly priority: number;

  /** Whether processor is enabled */
  enabled: boolean;

  /**
   * Execute the processor
   * @param context Processor execution context
   * @returns Processor result
   */
  execute(context: ProcessorContext): Promise<ProcessorResult>;
}

/**
 * Base processor class with common functionality
 */
export abstract class BaseProcessor implements IProcessor {
  abstract readonly name: string;
  abstract readonly type: "pre" | "post";
  abstract readonly priority: number;
  enabled = true;

  /**
   * Execute the processor with error handling and metrics
   * @param context Processor execution context
   * @returns Processor result
   */
  async execute(context: ProcessorContext): Promise<ProcessorResult> {
    const startTime = Date.now();

    try {
      const data = await this.run(context);
      const duration = Date.now() - startTime;

      return {
        success: true,
        data,
        duration,
        processorName: this.name,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        processorName: this.name,
      };
    }
  }

  /**
   * Override this method in subclasses to implement processor logic
   * @param context Processor execution context
   * @returns Processor data
   */
  protected abstract run(context: ProcessorContext): Promise<unknown>;

  /**
   * Safely extract file path from context
   */
  protected getFilePath(context: ProcessorContext): string | undefined {
    return context.toolInput?.args?.filePath || context.filePath;
  }

  /**
   * Safely extract content from context
   */
  protected getContent(context: ProcessorContext): string | undefined {
    return context.toolInput?.args?.content;
  }
}

/**
 * Pre-processor base class
 */
export abstract class PreProcessor extends BaseProcessor {
  readonly type = "pre" as const;
}

/**
 * Post-processor base class
 */
export abstract class PostProcessor extends BaseProcessor {
  readonly type = "post" as const;
}

/**
 * Processor registry for managing processor instances
 */
export class ProcessorRegistry {
  private processors = new Map<string, IProcessor>();

  /**
   * Register a processor
   * @param processor Processor instance
   */
  register(processor: IProcessor): void {
    this.processors.set(processor.name, processor);
  }

  /**
   * Unregister a processor
   * @param name Processor name
   */
  unregister(name: string): void {
    this.processors.delete(name);
  }

  /**
   * Get a processor by name
   * @param name Processor name
   * @returns Processor instance or undefined
   */
  get(name: string): IProcessor | undefined {
    return this.processors.get(name);
  }

  /**
   * Get all registered processors
   * @returns Array of processors
   */
  getAll(): IProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Get processors by type
   * @param type Processor type
   * @returns Array of processors
   */
  getByType(type: "pre" | "post"): IProcessor[] {
    return this.getAll()
      .filter((p) => p.type === type)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if processor exists
   * @param name Processor name
   * @returns True if processor exists
   */
  has(name: string): boolean {
    return this.processors.has(name);
  }

  /**
   * Clear all processors
   */
  clear(): void {
    this.processors.clear();
  }
}

// Re-export ProcessorContext and ProcessorResult for convenience
export type { ProcessorContext, ProcessorResult } from "./processor-types.js";

// Singleton registry instance
export const processorRegistry = new ProcessorRegistry();
