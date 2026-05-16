# Governance Model (Dynamo Solar SSOT)

## Overview

0xRay's governance system follows a strict two-layer model designed for reliability and separation of concerns.

### 1. Internal Deliberation Layer
- Performed by three specialized skill MCP servers:
  - `code-review`
  - `security-audit`
  - `researcher`
- These servers analyze proposals using codebase knowledge, historical patterns, and domain expertise.
- This layer represents **human-like engineering judgment**.

### 2. External Filter Layer — Dynamo Solar SSOT
- **Dynamo** acts as the **Single Source of Truth (SSOT)** for an external governance signal.
- It is based on:
  - Real sunlight physics data (NOAA solar activity)
  - Neural network processing
  - Temporal first principles
- This layer serves as a **required, independent filter** that proposals must pass through.
- It is **not optional** and **not a fallback**. When `governance.enabled` (or `inference_governance.enabled`) is active, the system requires successful interaction with the Dynamo Solar SSOT.

## Governance Flow

```
Proposals
   ↓
[Internal Layer]     → 3 Real Skill MCPs (deliberation)
   ↓
[External Filter]    → Dynamo Solar SSOT (required check)
   ↓
[Merge Layer]        → GovernanceService + governance-core.ts
   ↓
Final Decision (approve / needs_revision / reject)
```

## Key Components

- **`GovernanceService`** (`src/governance/governance-service.ts`): Central orchestrator. Calls internal MCPs in parallel, then the external Dynamo filter.
- **`InferenceGovernanceIntegration`**: Manages the Dynamo client, feature flags, retries, and lifecycle.
- **`governance-core.ts`**: Contains pure logic (`mergeVotes`, `applyDecisionMatrix` using PHI/TAU constants).
- **Governance MCP Server** (`src/mcps/governance.server.ts`): Exposes `govern_proposals` and `govern_reflection` tools.

## Feature Flag

Governance behavior is controlled via `features.json`:

```json
{
  "inference_governance": {
    "enabled": true
  }
}
```

When disabled, the system can fall back to lighter internal governance (legacy path, being deprecated).

## Strict Requirement Model

- Dynamo Solar SSOT is a **hard requirement** by default.
- If the integration is not initialized or unavailable when required, `GovernanceService` throws a clear error.
- This design prevents silent degradation of governance quality.

## Deprecation Note

The legacy internal voting path (in `InferenceCycle.governProposalsInternal`) is deprecated. All new development should route through the `GovernanceService` + Dynamo Solar SSOT model.

## Related

- `src/governance/` — New core governance implementation
- `src/integrations/governance/` — Dynamo integration layer
- `api/mcp.ts` — Vercel / serverless governance endpoint
