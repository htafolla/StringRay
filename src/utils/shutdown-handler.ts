/**
 * Graceful Shutdown Handler
 * 
 * Centralized shutdown handling for MCP servers.
 * Extracts common shutdown patterns to reduce code duplication.
 * 
 * @version 1.0.0
 * @since 2026-03-22
 */

import { frameworkLogger } from "../core/framework-logger.js";

export interface ShutdownOptions {
  serverName: string;
  server: { close: () => Promise<void> } | null;
  shutdownTimeout?: number;
}

export interface ShutdownHandler {
  cleanup: (signal: string) => Promise<void>;
  stop: () => void;
}

/**
 * Creates a graceful shutdown handler for MCP servers
 * 
 * @param options - Configuration for the shutdown handler
 * @returns ShutdownHandler with cleanup and stop methods
 */
export function createGracefulShutdown(options: ShutdownOptions): ShutdownHandler {
  const { serverName, server, shutdownTimeout = 5000 } = options;
  let isShuttingDown = false;

  const cleanup = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    await frameworkLogger.log(
      serverName,
      "shutdown-initiated",
      "info",
      { signal }
    );

    // Force exit after timeout
    const timeout = setTimeout(() => {
      frameworkLogger.log(serverName, "shutdown-timeout", "error", { message: "Graceful shutdown timeout, forcing exit..." });
      process.exit(1);
    }, shutdownTimeout);

    try {
      if (server && typeof server.close === "function") {
        await server.close();
      }
      clearTimeout(timeout);
      await frameworkLogger.log(
        serverName,
        "shutdown-complete",
        "info",
        { message: `${serverName} shut down gracefully` }
      );
      process.exit(0);
    } catch (error) {
      clearTimeout(timeout);
      frameworkLogger.log(serverName, "shutdown-error", "error", { message: `Error during ${serverName} shutdown: ${error instanceof Error ? error.message : String(error)}` });
      process.exit(1);
    }
  };

  const stop = (): void => {
    cleanup("manual-stop");
  };

  // Register signal handlers
  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));
  process.on("SIGHUP", () => cleanup("SIGHUP"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    frameworkLogger.log(serverName, "uncaught-exception", "error", { message: `Uncaught Exception: ${error instanceof Error ? error.message : String(error)}` });
    cleanup("uncaughtException");
  });

  // Handle unhandled rejections
  process.on("unhandledRejection", (reason, promise) => {
    frameworkLogger.log(serverName, "unhandled-rejection", "error", { message: `Unhandled Rejection at: ${String(promise)} reason: ${String(reason)}` });
    cleanup("unhandledRejection");
  });

  // Monitor parent process (opencode) and shutdown if it dies
  const checkParent = async (): Promise<void> => {
    try {
      process.kill(process.ppid, 0);
      setTimeout(checkParent, 1000);
    } catch {
      await frameworkLogger.log(
        serverName,
        "parent-process-died",
        "info",
        { message: "Parent process (opencode) died, shutting down..." }
      );
      cleanup("parent-process-death");
    }
  };

  // Start parent monitoring after 2 seconds
  setTimeout(checkParent, 2000);

  return { cleanup, stop };
}
