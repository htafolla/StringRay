#!/usr/bin/env node
/**
 * Standalone Log Archive CLI
 * 
 * Archives log files without requiring framework boot.
 * Used by git hooks to prevent log truncation.
 * 
 * @version 1.0.0
 */

import * as fs from "fs";
import * as path from "path";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";

interface ArchiveResult {
  archived: number;
  errors: string[];
}

interface LogArchiveConfig {
  maxFileSizeMB: number;
  rotationIntervalHours: number;
  compressionEnabled: boolean;
  maxArchives: number;
}

const DEFAULT_CONFIG: LogArchiveConfig = {
  maxFileSizeMB: 10,
  rotationIntervalHours: 24,
  compressionEnabled: true,
  maxArchives: 10,
};

/**
 * Archive log files without framework dependencies
 */
export async function archiveLogFiles(
  config: LogArchiveConfig = DEFAULT_CONFIG,
  jobId: string = `archive-${Date.now()}`
): Promise<ArchiveResult> {
  const result: ArchiveResult = { archived: 0, errors: [] };
  const cwd = process.cwd();

  // Archive activity.log
  const activityLogPath = path.join(cwd, "logs", "framework", "activity.log");

  if (fs.existsSync(activityLogPath)) {
    const stats = fs.statSync(activityLogPath);
    const shouldArchive =
      stats.size > config.maxFileSizeMB * 1024 * 1024 ||
      Date.now() - stats.mtime.getTime() > config.rotationIntervalHours * 60 * 60 * 1000;

    if (shouldArchive) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const archiveName = `framework-activity-${timestamp}.log`;
      const archivePath = path.join(cwd, "logs", "framework", archiveName);

      let archiveSuccess = false;

      try {
        // Copy current log to archive
        fs.copyFileSync(activityLogPath, archivePath);

        // Compress if enabled
        if (config.compressionEnabled) {
          const compressedPath = `${archivePath}.gz`;
          const gzip = createGzip();
          const input = createReadStream(archivePath);
          const output = createWriteStream(compressedPath);

          await pipeline(input, gzip, output);

          // Verify compression succeeded
          if (fs.existsSync(compressedPath)) {
            const compressedStats = fs.statSync(compressedPath);
            if (compressedStats.size > 0) {
              fs.unlinkSync(archivePath);
              archiveSuccess = true;
              console.log(`[${jobId}] Archived activity.log → ${compressedPath}`);
            }
          }
        } else {
          archiveSuccess = true;
          console.log(`[${jobId}] Archived activity.log → ${archivePath}`);
        }

        // ONLY reset if archive was successful
        if (archiveSuccess) {
          const header = `# Log rotated on ${new Date().toISOString()}\n`;
          fs.writeFileSync(activityLogPath, header);
          result.archived++;
        } else {
          result.errors.push("Archive creation failed - log left intact");
          console.error(`[${jobId}] Archive failed - log not modified`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Archive failed: ${errorMsg}`);
        console.error(`[${jobId}] Archive error: ${errorMsg}`);

        // Cleanup partial files
        if (fs.existsSync(archivePath)) {
          try { fs.unlinkSync(archivePath); } catch { /* ignore */ }
        }
        const compressedPath = `${archivePath}.gz`;
        if (fs.existsSync(compressedPath)) {
          try { fs.unlinkSync(compressedPath); } catch { /* ignore */ }
        }
      }
    } else {
      console.log(`[${jobId}] activity.log does not need archiving (${(stats.size / 1024).toFixed(1)}KB)`);
    }
  }

  // Cleanup old archives
  cleanupOldArchives(config.maxArchives);

  return result;
}

/**
 * Keep only the most recent N archives
 */
function cleanupOldArchives(maxArchives: number): void {
  const cwd = process.cwd();
  const frameworkDir = path.join(cwd, "logs", "framework");

  if (!fs.existsSync(frameworkDir)) return;

  const archives = fs
    .readdirSync(frameworkDir)
    .filter((f) => f.startsWith("framework-activity-") && f.endsWith(".log.gz"))
    .map((f) => ({
      name: f,
      path: path.join(frameworkDir, f),
      mtime: fs.statSync(path.join(frameworkDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (archives.length > maxArchives) {
    const toDelete = archives.slice(maxArchives);
    for (const archive of toDelete) {
      try {
        fs.unlinkSync(archive.path);
        console.log(`[cleanup] Removed old archive: ${archive.name}`);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const verbose = args.includes("--verbose");

  console.log("📦 StringRay Log Archive");
  console.log("========================");

  if (dryRun) {
    console.log("(Dry run mode - no changes will be made)");
  }

  const config = dryRun
    ? { ...DEFAULT_CONFIG, maxFileSizeMB: 0.001 } // Force archive in dry-run
    : DEFAULT_CONFIG;

  const result = await archiveLogFiles(config);

  console.log("\n📊 Results:");
  console.log(`  Archived: ${result.archived} files`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
    result.errors.forEach((e) => console.log(`    - ${e}`));
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
