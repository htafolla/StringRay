import type { AgentConfig } from "./types.js";
import { enforcer } from "./enforcer.js";
import { architect } from "./architect.js";
import { orchestrator } from "./orchestrator.js";
import { bugTriageSpecialist } from "./bug-triage-specialist.js";
import { codeReviewer } from "./code-reviewer.js";
import { securityAuditor } from "./security-auditor.js";
import { refactorer } from "./refactorer.js";
import { testArchitect } from "./test-architect.js";
import { sisyphusAgent } from "./sisyphus.js";
import { logMonitorAgent } from "./log-monitor.js";
import { librarian } from "./librarian.js";

export const builtinAgents: Record<string, AgentConfig> = {
  sisyphus: sisyphusAgent,
  enforcer,
  architect,
  orchestrator,
  "bug-triage-specialist": bugTriageSpecialist,
  "code-reviewer": codeReviewer,
  "security-auditor": securityAuditor,
  refactorer,
  "test-architect": testArchitect,
  "log-monitor": logMonitorAgent,
  librarian,
};

export {
  sisyphusAgent,
  enforcer,
  architect,
  orchestrator,
  bugTriageSpecialist,
  codeReviewer,
  securityAuditor,
  refactorer,
  testArchitect,
  logMonitorAgent,
  librarian,
};
