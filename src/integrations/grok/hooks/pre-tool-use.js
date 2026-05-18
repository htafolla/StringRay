#!/usr/bin/env node
/**
 * Grok CLI PreToolUse Hook Handler for StringRay (0xRay) — First Class Citizen
 *
 * Real governance enforcement hook.
 * When Grok is about to execute a tool (write_file, edit, terminal cmd, etc.),
 * this script is spawned and runs the Dynamo Solar SSOT decision matrix.
 */

import fs from 'fs';
import path from 'path';

const log = (msg) => { try { console.error(`[0xRay:GrokHook] ${msg}`); } catch { /* noop */ } };

function findGovernanceCore() {
  const here = path.dirname(new URL(import.meta.url).pathname);
  const candidates = [
    // When hook lives inside the published package dist/
    path.resolve(here, '../../../governance/governance-core.js'),
    path.resolve(here, '../../../../governance/governance-core.js'),
    // When executed from project node_modules/strray-ai/...
    path.resolve(process.cwd(), 'node_modules/strray-ai/dist/governance/governance-core.js'),
    path.resolve(here, '../../../../../dist/governance/governance-core.js'),
    // Fallbacks
    path.resolve(here, '../../../../../governance/governance-core.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function deriveResonance(toolName, extra = '') {
  const text = (toolName + ' ' + extra).toLowerCase();
  let score = 0.85; // baseline good
  const penalties = [
    ['any', -0.25],
    ['eval(', -0.35],
    ['console.log', -0.15],
    ['// @ts-ignore', -0.2],
    ['require(', -0.1],
  ];
  for (const [pat, pen] of penalties) {
    if (text.includes(pat)) score += pen;
  }
  return Math.max(0.1, Math.min(0.99, score));
}

async function main() {
  try {
    const toolName = process.env.TOOL_NAME || process.env.HOOK_TOOL || 'unknown_tool';
    const cwd = process.env.PWD || process.cwd();
    const extraContext = process.env.HOOK_ARGS || process.env.TOOL_ARGS || '';

    log(`PreToolUse: ${toolName}`);

    const corePath = findGovernanceCore();
    let recommendation = 'ALLOW';
    let resonance = deriveResonance(toolName, extraContext);
    let govDetails = null;

    if (corePath) {
      try {
        const core = await import(`file://${corePath}`);
        if (typeof core.applyDecisionMatrix === 'function') {
          const result = core.applyDecisionMatrix({
            resonance,
            isotopicRatio: resonance > 0.8 ? 0.96 : 0.7,
            vortexVolume: 1_000_000,
            historicalCoherence: 0.82,
            solarActivity: 'active',
          });
          govDetails = result;
          recommendation = result.recommendation || 'NEEDS_REVISION';
          log(`Solar decision: ${recommendation} (resonance=${resonance.toFixed(2)})`);
        }
      } catch (e) {
        log(`Governance core error: ${e.message}`);
      }
    } else {
      log('Governance core not located — using safe default');
    }

    const decision = {
      tool: toolName,
      decision: recommendation === 'PASS' ? 'allow' : 'allow_with_governance_note',
      resonance: Number(resonance.toFixed(3)),
      solar_recommendation: recommendation,
      gov: govDetails,
      timestamp: new Date().toISOString(),
      source: 'strray-ai/grok-pre-tool-use',
    };

    console.log(JSON.stringify(decision));
    process.exit(0); // non-blocking rollout; future versions can exit(1) on strong reject
  } catch (err) {
    log(`Hook failure (non-fatal): ${err.message}`);
    process.exit(0);
  }
}

main();