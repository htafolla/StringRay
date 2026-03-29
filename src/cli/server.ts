import express, { Request, Response, NextFunction } from "express";
import { exec } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import { frameworkLogger } from "../core/framework-logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version dynamically from package.json
const packageJsonPath = join(__dirname, "..", "package.json");
const { version } = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const app = express();
const PORT = 3000;

// API key authentication
const API_KEY = process.env.STRRAY_API_KEY;

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) {
    // If no API key configured, allow access (development mode)
    return next();
  }

  const providedKey = req.headers["x-api-key"];

  if (!providedKey) {
    return res.status(401).json({ error: "API key required. Set STRRAY_API_KEY environment variable." });
  }

  if (providedKey !== API_KEY) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
}

// Lazy load security headers middleware
let securityMiddleware: any = null;
const getSecurityMiddleware = async () => {
  if (!securityMiddleware) {
    try {
      const { securityHeadersMiddleware } =
        await import("../security/security-headers");
      securityMiddleware = securityHeadersMiddleware.getExpressMiddleware();
    } catch (error) {
      frameworkLogger.log("cli-server", "security-middleware-unavailable", "warning", {
        message: "Security middleware not available, continuing without security headers",
      });
      securityMiddleware = (req: Request, res: Response, next: NextFunction) =>
        next(); // No-op middleware
    }
  }
  return securityMiddleware;
};

// Apply security headers middleware lazily
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const middleware = await getSecurityMiddleware();
    return middleware(req, res, next);
  } catch (error) {
    frameworkLogger.log("cli-server", "security-middleware-load-failed", "warning", {
      error,
      message: "Security middleware failed to load, continuing without it",
    });
    next();
  }
});

// Serve static files
app.use(express.static(join(__dirname, "public")));

// API endpoints
app.get("/api/status", requireAuth, (req: Request, res: Response) => {
  // Return framework status
    res.json({
    framework: "StringRay",
    version,
    status: "active",
    agents: 8,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/agents", requireAuth, (req: any, res: any) => {
  // Return agent configurations
  res.json({
    agents: [
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "testing-lead",
    ],
  });
});

// Performance monitoring middleware
app.use((req: any, res: any, next: any) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // Convert to milliseconds
    // HTTP request logging - operational, keep for monitoring
  });
  next();
});

// Add route for root path
app.get("/", (req: any, res: any) => {
  res.sendFile(join(__dirname, "..", "public", "index.html"));
});

// Add route for refactoring logs
app.get("/logs", requireAuth, async (req: Request, res: Response) => {
  const logPath = join(__dirname, "..", ".opencode", "REFACTORING_LOG.md");
  // Server debug logging - remove for production

  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf-8");
      res.setHeader("Content-Type", "text/markdown");
      res.send(content);
    } else {
      res
        .status(404)
        .send(
          "Refactoring log not found. The framework may not have generated any logs yet.",
        );
    }
  } catch (error) {
    // File read error - remove debug logging
    res.status(500).send("Server error reading log file.");
  }
});

app.listen(PORT, () => {
  // Auto-open browser
  const start =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${start} http://localhost:${PORT}`);
});
