import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StringRayCodeReviewServer } from "./knowledge-skills/code-review.server.js";
import { StringRaySecurityAuditServer } from "./knowledge-skills/security-audit.server.js";
import { StringRayLibrarianServer } from "./researcher.server.js";

interface AnalyzeProposalSkillArgs {
  proposalTitle?: string;
  proposalDescription?: string;
  evidence?: string[];
  proposalType?: string;
}

interface InProcessSkillHandler {
  analyzeProposal(args: AnalyzeProposalSkillArgs): Promise<CallToolResult>;
}

const instances = new Map<string, InProcessSkillHandler>();

function getCodeReview(): InProcessSkillHandler {
  if (!instances.has("code-review")) {
    instances.set("code-review", new StringRayCodeReviewServer() as unknown as InProcessSkillHandler);
  }
  return instances.get("code-review")!;
}

function getSecurityAudit(): InProcessSkillHandler {
  if (!instances.has("security-audit")) {
    instances.set("security-audit", new StringRaySecurityAuditServer() as unknown as InProcessSkillHandler);
  }
  return instances.get("security-audit")!;
}

function getResearcher(): InProcessSkillHandler {
  if (!instances.has("researcher")) {
    instances.set("researcher", new StringRayLibrarianServer() as unknown as InProcessSkillHandler);
  }
  return instances.get("researcher")!;
}

const registry = {
  "code-review": getCodeReview,
  "security-audit": getSecurityAudit,
  "researcher": getResearcher,
};

export async function callInProcessSkill(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const factory = registry[serverName as keyof typeof registry];
  if (!factory) {
    throw new Error(`No in-process handler registered for server: ${serverName}`);
  }
  if (toolName !== "analyze_proposal") {
    throw new Error(`In-process skill registry only supports "analyze_proposal", got "${toolName}"`);
  }
  const handler = factory();
  return handler.analyzeProposal(args);
}
