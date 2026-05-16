import { StringRayCodeReviewServer } from "./knowledge-skills/code-review.server.js";
import { StringRaySecurityAuditServer } from "./knowledge-skills/security-audit.server.js";
import { StringRayLibrarianServer } from "./researcher.server.js";

interface AnalyzeProposalArgs {
  proposalTitle?: string;
  proposalDescription?: string;
  evidence?: string[];
  proposalType?: string;
}

interface AnalyzeProposalResult {
  content: Array<{ type: string; text: string }>;
}

interface InProcessSkillHandler {
  analyzeProposal(args: AnalyzeProposalArgs): Promise<AnalyzeProposalResult>;
}

const instances = new Map<string, InProcessSkillHandler>();

function getCodeReview(): InProcessSkillHandler {
  if (!instances.has("code-review")) {
    const server = new StringRayCodeReviewServer();
    instances.set("code-review", {
      analyzeProposal: (args) => server.analyzeProposal(args) as Promise<AnalyzeProposalResult>,
    });
  }
  return instances.get("code-review")!;
}

function getSecurityAudit(): InProcessSkillHandler {
  if (!instances.has("security-audit")) {
    const server = new StringRaySecurityAuditServer();
    instances.set("security-audit", {
      analyzeProposal: (args) => server.analyzeProposal(args) as Promise<AnalyzeProposalResult>,
    });
  }
  return instances.get("security-audit")!;
}

function getResearcher(): InProcessSkillHandler {
  if (!instances.has("researcher")) {
    const server = new StringRayLibrarianServer();
    instances.set("researcher", {
      analyzeProposal: (args) => server.analyzeProposal(args) as Promise<AnalyzeProposalResult>,
    });
  }
  return instances.get("researcher")!;
}

const registry: Record<string, () => InProcessSkillHandler> = {
  "code-review": getCodeReview,
  "security-audit": getSecurityAudit,
  "researcher": getResearcher,
};

export async function callInProcessSkill(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<AnalyzeProposalResult> {
  const factory = registry[serverName];
  if (!factory) {
    throw new Error(`No in-process handler registered for server: ${serverName}`);
  }
  if (toolName !== "analyze_proposal") {
    throw new Error(`In-process skill registry only supports "analyze_proposal", got "${toolName}"`);
  }
  const handler = factory();
  return handler.analyzeProposal(args as AnalyzeProposalArgs);
}

export type { AnalyzeProposalArgs, AnalyzeProposalResult };
