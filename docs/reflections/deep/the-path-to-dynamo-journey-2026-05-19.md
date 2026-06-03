---
story_type: journey
emotional_arc: "confidence -> confusion -> revelation -> frustration -> breakthrough -> satisfaction"
codex_terms: [7, 22, 41]
---

# The Path to Dynamo: How a Double-Dist Bug Led Us Through the Entire Governance Pipeline

It started with a simple question from Grok. "Versions match on paper, but the published tarball is corrupted." Someone had reproduced the exact error by running the binary the MCP client tries to spawn:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'.../node_modules/strray-ai/dist/dist/utils/shutdown-handler.js'
imported from
'.../node_modules/strray-ai/dist/mcps/knowledge-skills/code-review.server.js'
```

See that `dist/dist/`? That's the smoking gun. A double-dist. Somewhere, something was prepending an extra `dist/` into import paths, and the result was a published npm package that broke the moment any MCP server tried to import a utility module.

I figured this would take ten minutes. Find the transform, fix it, re-publish. Simple.

## The Prepare-Consumer Trap

The file was `scripts/node/prepare-consumer.cjs`. Line 43:

```javascript
content = content.replace(
  /from "\.\.\/\.\.\/core\//g,
  'from "../../dist/core/"'
);
content = content.replace(
  /from "\.\.\/\.\.\/utils\//g,
  'from "../../dist/utils/"'
);
```

The comment above it read: "In dev: mcps/ imports from ../../core/ (resolves to src/core/)". The reasoning was that since MCP servers end up at `dist/mcps/knowledge-skills/` and core files end up at `dist/core/`, you need the extra `dist/` in the path.

This would be correct — if the files were still in `src/`. But by the time `prepare-consumer` runs, TypeScript has already compiled them into `dist/mcps/knowledge-skills/`. From there, `../../core/` already resolves to `dist/core/`. Adding another `dist/` turns it into `../../dist/core/`, which resolves to `dist/dist/core/`.

The file at `dist/mcps/knowledge-skills/code-review.server.js` imports from `../../utils/shutdown-handler.js`, which correctly points to `dist/utils/shutdown-handler.js`. After the transform, it imports from `../../dist/utils/shutdown-handler.js`, which points to `dist/dist/utils/shutdown-handler.js`. Broken.

I deleted the entire `fixMCPServerImports()` function and its call site. The rest of `prepare-consumer.cjs` — `syncStrrayDir()`, `updatePathsInFile()`, `addJsExtensionsToDist()` — those were fine. One function was the entire problem.

Ten minutes, tops. I was feeling good.

## The Consumer Test That Changed Everything

I rebuilt, ran the prepare-consumer script, verified zero `dist/dist/` occurrences in the output. Clean. Then I ran the MCP servers directly:

```bash
node dist/mcps/knowledge-skills/code-review.server.js
```

Silence. No errors. Just waiting on stdin. That's success for an MCP server with StdioServerTransport.

I tested six servers. All clean. I did the full MCP handshake — initialize, notifications/initialized, tools/list — all returned valid responses. I actually invoked `analyze_code_quality` on the code-review server and got back 1044 characters of analysis. It was working.

So I bumped the version to 1.22.65 and published.

And then the user asked the question that turned this from a ten-minute fix into a full-day investigation:

"why is dynamo not avail that is the whole purpose triage and fix throughout"

## The Architecture I Barely Understood

The governance system has layers. At the top, the inference cycle calls `governExternalProposals()`, which calls the governance MCP server via `mcpClientManager.callServerTool("governance", "govern_proposals", ...)`. The governance MCP server delegates to `GovernanceService.govern()`, which:

1. Calls three skill servers (code-review, security-audit, researcher) with `analyze_proposal`
2. Calls an external Dynamo Solar SSOT endpoint
3. Merges the votes using a weighted PHI/TAU matrix

The Dynamo part was failing. When I tested directly, the governance server returned:

```json
{
  "external-dynamo": {
    "decision": "abstain",
    "confidence": 0.2,
    "reasoning": "InferenceGovernanceIntegration not available"
  }
}
```

Not available. The integration was never initialized.

I checked the activity log in the consumer test project:

```
governance-mcp-parse-failed - WARNING
{"textPreview":"Tool govern_proposals executed on governance server"}
```

Wait. That text — "Tool govern_proposals executed on governance server" — that's not a real response. That's a mock. A fallback. The MCP client wasn't even talking to the real governance server.

## The MCP Client's Secret Life

I traced through `mcp-client.js` in the installed package. The `callTool` method has this routing logic:

```javascript
const isGovernanceServer = ['code-review', 'security-audit', 'researcher'].includes(serverName);
const isGovernanceTool = toolName === 'analyze_proposal';
const preferReal = this.isPureMcpMode || isGovernanceServer || isGovernanceTool;
```

The `preferReal` flag controls whether the client actually spawns a subprocess and communicates via JSON-RPC. If `preferReal` is false, it falls through to simulation, then to a generic fallback that returns `"Tool ${toolName} executed on ${serverName} server"`.

Governance was not in the list. The governance MCP server was being treated as a non-critical server, so all `govern_proposals` calls were silently swallowed by the mock.

The fix was one word: `'governance'`. I added it to the `isGovernanceServer` array.

```typescript
const isGovernanceServer = ['code-review', 'security-audit', 'researcher', 'governance'].includes(serverName);
```

The user was clear: "no mocks. no fallbacks. works or fails." I couldn't agree more.

## The Chicken and the Egg

With the MCP client now routing governance calls to the real transport, the governance server would actually start as a subprocess. But it still couldn't reach Dynamo because the `InferenceGovernanceIntegration` was never initialized.

The governance server's `run()` method started the MCP transport and waited for messages. It never called `initializeGovernanceIntegration()`. The `GovernanceService.govern()` method checked `getGovernanceIntegration()?.isAvailable()` and, finding nothing, threw:

```
Dynamo Solar SSOT is required but InferenceGovernanceIntegration is not available
```

I added an `initializeGovernance()` method to the governance server that fires during startup:

```typescript
private async initializeGovernance(): Promise<void> {
  const config = featuresConfigLoader.loadConfig();
  const govConfig = config?.inference_governance;
  if (govConfig?.enabled) {
    await initializeGovernanceIntegration();
  }
}
```

It reads the features config from `.opencode/strray/features.json`. If `inference_governance.enabled` is true, it initializes the integration. This runs before the server even starts listening for MCP messages.

I did the same for `runHttp()` — the Streamable HTTP transport path used by Grok CLI.

## The Field Name That Broke Everything

With the integration initialized, the governance server started making HTTP calls to `https://mcp-production-80e2.up.railway.app/call_connected_tool`. I tested the endpoint directly with curl:

```bash
curl -s -X POST https://mcp-production-80e2.up.railway.app/call_connected_tool \
  -H "Content-Type: application/json" \
  -d '{"tool_name":"evaluate_governance","params":{"proposalId":"test-1","proposalText":"Test","agentReviews":[]}}'
```

It returned a perfectly valid response:

```json
{
  "success": true,
  "tool": "evaluate_governance",
  "result": {
    "proposalId": "test-1",
    "recommendation": "REJECT",
    "confidence": 0.84,
    "voteWeight": 1,
    "reasons": ["Signal below critical threshold (1 - TAU)"],
    ...
  }
}
```

But the governance client was throwing: "Invalid evaluate governance response structure."

I stared at the validation function for ten minutes. All the fields were there. `success`, `proposalId`, `recommendation`, `confidence`, `voteWeight`, `reasons`. Types matched. Everything should pass.

Then I saw it. Line 200:

```typescript
reasons: Array.isArray(result.reasoning)
  ? (result.reasoning as string[])
  : [result.reasoning as string],
```

`result.reasoning`. With an "ing" suffix. The API returns `reasons` (with an "s"). JavaScript's `undefined` is not an array, so it fell to the fallback: `[undefined]`. Then `r.reasons.every(r => typeof r === 'string')` returned false because `typeof undefined` is `"undefined"`, not `"string"`.

A single letter. The difference between `reasons` and `reasoning`. That tiny mismatch broke the entire Dynamo governance pipeline.

## The Moment It All Worked

I fixed the field name, rebuilt, copied the updated files to the consumer test project, and ran the governance server:

```bash
node node_modules/strray-ai/dist/mcps/governance.server.js
```

The MCP handshake returned clean. The `govern_proposals` call returned:

```
Overall: approve
Summary: {"total":1,"approved":1,"needsRevision":0,"rejected":0}
--- dynamo-test → approve (conf:0.83)
  code-review → approve (0.82)
  security-audit → approve (0.82)
  researcher → approve (0.70)
  external-dynamo → approve (0.89)
```

All four servers voted. `external-dynamo` — the real Dynamo Solar SSOT — returned `approve` with `0.89` confidence. The governance system was working end-to-end for the first time.

I sat there for a moment. This started as a ten-minute fix for a double-dist path and ended with me debugging four layers of a governance pipeline I'd never fully traced before. The MCP client routing. The governance server initialization. The HTTP client field validation. Each layer was a separate bug, each one independently sufficient to break the whole thing.

## The Release

I bumped to 1.22.66 and ran the release script. The pre-publish guard caught two test failures — one from our path resolution changes, one pre-existing flaky test. Fixed both, re-ran, 2199 tests passed. Published.

Then I ran the full consumer validation:

```
Health       → ✅ Framework ready, 42 agents, 16 MCPs, 45 skills
Validate     → ✅ v1.22.66, plugin OK, initialized in 2s
Status       ✅ Properly configured
Governance   → ✅ Approved: 1, Rejected: 0
```

Every check green. The published package, the consumer installation, the governance pipeline — all working.

## Key Takeaways

- **A single wrong function in a build script can corrupt every published artifact** — `fixMCPServerImports()` in `prepare-consumer.cjs` added `../../dist/` to paths that were already correct, creating `dist/dist/` across all 41 MCP servers. The code comment was wrong, and nobody noticed because the dev tree uses a different path.
- **Mock fallbacks hide real failures** — The MCP client silently returned "Tool X executed on Y server" when the governance server wasn't in the `isGovernanceServer` list. No error, no crash, just wrong data propagating upward. "No mocks, works or fails" is the right policy.
- **Field name drift between API producer and consumer** — The Dynamo endpoint returns `reasons` but the client checked `reasoning`. One character, zero test coverage, hours of debugging. API contracts need stricter enforcement.

## What Next?

- Audit all `field: string` casts in `governance-client.ts` against the actual API response schema — there may be more drift
- Add a governance integration E2E test that runs against the real Dynamo endpoint with `require_external: true` and validates the full response structure
- Track the pre-publish guard's test filter — the full suite takes 30s+ and the e2e inference test is flaky in shallow git environments

Related Codex terms: [codex.json](../../.opencode/strray/codex.json) — terms 7 (fail-fast), 22 (defensive coding), 41 (API contract validation)
Next story to write: The moment Dynŗamo voted — reflection on the first end-to-end governance cycle
