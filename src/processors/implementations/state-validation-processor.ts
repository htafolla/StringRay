/**
 * State Validation Processor
 *
 * Validates state after operations to ensure consistency.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

import { PostProcessor } from "../processor-interfaces.js";
import { frameworkLogger } from "../../core/framework-logger.js";

export class StateValidationProcessor extends PostProcessor {
  readonly name = "stateValidation";
  readonly priority = 50;

  protected async run(context: unknown): Promise<unknown> {
    const ctx = context as Record<string, unknown>;
    const operation = (ctx.operation as string) || "modify";
    const filePath = this.getFilePath(ctx);

    await frameworkLogger.log(
      "state-validation-processor",
      "validating state",
      "info",
      { operation, filePath: filePath?.slice(0, 100) },
    );

    // Access state manager from context or through global
    let stateValid = true;
    let stateDetails: Record<string, unknown> = {};

    try {
      // Try to get state manager from context
      const stateManager = ctx.stateManager as
        | { get: (key: string) => unknown }
        | undefined;

      if (stateManager && typeof stateManager.get === "function") {
        const currentState = stateManager.get("session:active");
        stateValid = !!currentState;
        stateDetails = {
          hasActiveSession: stateValid,
          sessionState: currentState,
        };
      } else {
        // Check global state manager if available
        const globalState = (globalThis as Record<string, unknown>)
          .strRayStateManager as
          | { get: (key: string) => unknown }
          | undefined;
        if (globalState && typeof globalState.get === "function") {
          const currentState = globalState.get("session:active");
          stateValid = !!currentState;
          stateDetails = {
            hasActiveSession: stateValid,
            sessionState: currentState,
          };
        }
      }
    } catch (error) {
      await frameworkLogger.log(
        "state-validation-processor",
        "state validation error",
        "error",
        { error: error instanceof Error ? error.message : String(error) },
      );
      stateValid = false;
      stateDetails = { error: error instanceof Error ? error.message : String(error) };
    }

    await frameworkLogger.log(
      "state-validation-processor",
      "state validation completed",
      stateValid ? "info" : "warning",
      { stateValid, ...stateDetails },
    );

    return {
      stateValid,
      operation,
      filePath,
      details: stateDetails,
    };
  }
}
