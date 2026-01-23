import type { AgentConfig } from "./types";
import { enforcer } from "./enforcer";
import { architect } from "./architect";
import { orchestrator } from "./orchestrator";
import { bugTriageSpecialist } from "./bug-triage-specialist";
import { codeReviewer } from "./code-reviewer";
import { securityAuditor } from "./security-auditor";
import { refactorer } from "./refactorer";
import { testArchitect } from "./test-architect";
import { logMonitorAgent } from "./log-monitor";
import { librarian } from "./librarian";

export const builtinAgents: Record<string, AgentConfig> = {
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
