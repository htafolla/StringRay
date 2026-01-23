/**
 * Simple command runner utility for executing shell commands
 */
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
/**
 * Run a shell command and return the result
 */
export async function runCommand(command, options = {}) {
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: options.cwd || process.cwd(),
            env: { ...process.env, ...options.env },
            timeout: options.timeout || 30000, // 30 second default timeout
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });
        return {
            success: true,
            stdout: stdout.toString().trim(),
            stderr: stderr.toString().trim(),
            exitCode: 0,
        };
    }
    catch (error) {
        return {
            success: false,
            stdout: error.stdout?.toString().trim() || "",
            stderr: error.stderr?.toString().trim() || error.message || "Command failed",
            exitCode: error.code || 1,
        };
    }
}
/**
 * Run a command and throw on failure
 */
export async function runCommandStrict(command, options = {}) {
    const result = await runCommand(command, options);
    if (!result.success) {
        throw new Error(`Command failed: ${command}\n${result.stderr}`);
    }
    return result.stdout;
}
//# sourceMappingURL=command-runner.js.map