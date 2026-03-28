/**
 * StringRay AI v1.3.4 - Security Module Index
 * Unified exports for the comprehensive security system
 */

// Core security components
export {
  SecurityMiddleware,
  securityMiddleware,
} from "./security-middleware.js";
export { SecurityScanner, securityScanner } from "./security-scanner.js";
export {
  PromptSecurityValidator,
  promptSecurityValidator,
} from "./prompt-security-validator.js";

// Additional security components
export * from "./security-headers.js";
export * from "./security-hardening-system.js";
export * from "./security-hardener.js";
// Removed: secure-authentication-system.js (unused - 1305 lines of dead code)
export * from "./security-auditor.js";
export * from "./examples.js";
