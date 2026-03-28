/**
 * Test Auto-Creation Processor
 *
 * Post-processor that automatically creates test files for new code.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

import { PostProcessor } from "../processor-interfaces.js";
import { frameworkLogger } from "../../core/framework-logger.js";

export class TestAutoCreationProcessor extends PostProcessor {
  readonly name = "testAutoCreation";
  readonly priority = 60;

  protected async run(context: unknown): Promise<unknown> {
    const ctx = context as Record<string, unknown>;

    await frameworkLogger.log(
      "test-auto-creation-processor",
      "executing",
      "info",
      {
        operation: ctx.operation,
        filePath: this.getFilePath(ctx)?.slice(0, 100),
      },
    );

    try {
      // Import the existing test auto-creation processor
      const { testAutoCreationProcessor } = await import("../test-auto-creation-processor.js");

      // Execute the processor
      const result = await testAutoCreationProcessor.execute(context);

      return {
        success: result.success,
        processorName: result.processorName,
        duration: result.duration,
        data: result.data,
      };
    } catch (error) {
      await frameworkLogger.log(
        "test-auto-creation-processor",
        "error",
        "error",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      throw error;
    }
  }
}
