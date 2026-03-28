# Deep Reflection: MCP Server Initialize Protocol Issue

## Executive Summary

This document captures the critical discovery that MCP (Model Context Protocol) servers require an explicit `initialize` handshake before accepting tool calls, and how this affected StringRay's test auto-creation functionality.

---

## The Problem

### Symptoms Observed

1. **Test Auto-Creation Failing**: When creating new `.ts` files, the test auto-creation processor was not creating test files
2. **File Scanning Issues**: The fallback file scanning wasn't finding newly created files
3. **MCP Timeouts**: When MCP was called, it would timeout after 25 seconds

### Initial Misdiagnosis

We initially blamed:
- Missing filePath in OpenCode hook context
- Slow MCP server startup
- File scanner not being recursive
- Age limits in file scanning

### Root Cause

The MCP protocol **requires** an `initialize` request before accepting tool calls. Without this handshake:

1. MCP servers wait indefinitely for initialization
2. Tool calls are queued but not processed
3. After 25 second timeout, the call fails

---

## The Technical Details

### MCP Protocol Flow

```
Client → Server: initialize { protocolVersion, capabilities, clientInfo }
Server → Client: { protocolVersion, capabilities, serverInfo }
Client → Server: tools/call { name, arguments }
Server → Client: { content: [...] }
```

### What Was Missing

The original code sent tool calls directly:

```typescript
// ❌ BROKEN - No initialize
const mcpRequest = {
  jsonrpc: "2.0",
  id: jobId,
  method: "tools/call",
  params: { name: toolName, arguments: args },
};
serverProcess.stdin.write(JSON.stringify(mcpRequest));
```

### The Fix

```typescript
// ✅ FIXED - Send initialize first
const initializeRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "strray-mcp-client", version: "1.15.1" },
  },
};

// Wait for response, then send tool call
if (response.id === 1 && response.result) {
  serverProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
}
```

---

## Impact Analysis

### What Was Affected

| Component | Impact | Severity |
|-----------|--------|----------|
| Test Auto-Creation | Tests not generated | High |
| Code Review Integration | Tools timing out | High |
| Security Audit | Tools timing out | High |
| Rule Enforcement | Agent fixes timing out | Medium |
| All MCP Tool Calls | Potential failures | High |

### Estimated Scope

- **15+ MCP tool invocations** across the codebase
- **Multiple MCP servers**: testing-strategy, code-review, security-audit, skill-invocation, etc.
- **All post-processors** using MCP for agent delegation

---

## Why This Was Overlooked

### 1. MCP SDK Abstraction

The `@modelcontextprotocol/sdk` provides abstractions that handle initialization in typical use cases (stdio server mode). Our custom implementation bypassed these abstractions.

### 2. Single Server Testing Works

When testing MCP servers manually with:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node server.js
```

The SDK auto-initializes. But real tool calls need explicit initialization.

### 3. No Error Messages

MCP servers don't return clear errors - they just wait or return generic JSON-RPC errors.

---

## The Fix Implementation

### Location
`src/mcps/mcp-client.ts` - `executeRealMCPCall` method

### Key Changes

1. **Initialize Request**: Send initialize before tool calls
2. **Response Handling**: Parse response lines to detect initialization complete
3. **Sequential Processing**: Wait for initialize response before sending tool request
4. **Error Handling**: Proper cleanup on timeout

### Testing Verification

```bash
# Before fix - timeout
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call",...}' | node server.js
# → Timeout after 25s

# After fix - works
echo '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' 
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call",...}' | node server.js
# → Returns immediately
```

---

## Lessons Learned

### 1. Protocol Compliance Matters

MCP is a relatively new protocol. The initialize handshake is mandatory but not always documented clearly.

### 2. Centralize MCP Communication

All MCP tool invocations should go through a single client. This makes fixes like this one affect all servers.

### 3. Add Integration Tests for MCP

Unit tests mock MCP responses. We need integration tests that actually spawn MCP servers.

### 4. Logging Is Critical

Without detailed logging, we spent hours guessing. The framework logger was essential for debugging.

---

## Future Recommendations

### 1. MCP Client Factory

Create a dedicated `MCPClientFactory` that ensures consistent initialization across all servers.

### 2. Health Checks

Add MCP server health check that verifies initialization works.

### 3. Timeout Configuration

Make timeouts configurable per server type.

### 4. Protocol Version Negotiation

Support different MCP protocol versions.

---

## Verification Commands

```bash
# Test any MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' > /tmp/init.json
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"generate-test-file","arguments":{...}}}' > /tmp/call.json

cat /tmp/init.json /tmp/call.json | node dist/mcps/knowledge-skills/testing-strategy.server.js
```

---

## Conclusion

The MCP initialize issue was a subtle but critical bug affecting multiple core features. The fix is now centralized in `executeRealMCPCall`, benefiting all 15+ MCP tool invocations across StringRay.

This experience highlights the importance of:
- Understanding underlying protocols
- Centralizing infrastructure code
- Comprehensive integration testing
- Detailed logging for debugging

---

*Reflection created: 2026-02-26*
*Version: 1.6.6*
*Related issue: Test auto-creation MCP timeout*
