# Antigravity Awesome Skills Integration

**Version**: 1.9.0 | **Framework**: StringRay AI

## Overview

StringRay integrates with [Antigravity Awesome Skills](https://github.com/sickn33/antigravity-awesome-skills) - the largest collection of AI agent skills with **946+ skills** for Claude Code, Gemini CLI, Cursor, and more.

With StringRay v1.15.1's **Facade Pattern Architecture**, skill integration is now more efficient and easier to manage through the **TaskSkillRouter facade**.

## License

Antigravity Awesome Skills is licensed under **MIT License**. StringRay includes curated skills with proper attribution. See `LICENSE.antigravity` for full license text.

---

## Installation

### Quick Install (Curated Skills - Recommended)

```bash
node scripts/integrations/install-antigravity-skills.js
```

This installs **17 curated skills** selected for quality and relevance:

| Category | Skills |
|----------|--------|
| **Languages** | typescript-expert, python-patterns, react-patterns, go-patterns, rust-patterns |
| **DevOps** | docker-expert, aws-serverless, vercel-deployment |
| **Security** | vulnerability-scanner, api-security-best-practices |
| **Business** | copywriting, pricing-strategy, seo-fundamentals |
| **AI/Data** | rag-engineer, prompt-engineering |
| **General** | brainstorming, planning |

### Full Installation (946+ Skills)

```bash
# Clone the full repository
git clone https://github.com/sickn33/antigravity-awesome-skills.git .opencode/skills-antigravity

# Or use the installer with --full flag
node scripts/integrations/install-antigravity-skills.js --full
```

---

## Usage with TaskSkillRouter Facade

StringRay v1.15.1's **TaskSkillRouter facade** automatically routes tasks to the appropriate Antigravity skill based on keywords in your prompts.

### How It Works

When you describe what you need, the TaskSkillRouter facade analyzes the task and routes to the appropriate skill:

```typescript
import { TaskSkillRouter } from "@strray/framework";

const router = new TaskSkillRouter(orchestrator);

// TaskSkillRouter automatically detects relevant skills
const route = await router.routeTask({
  task: "help me fix this TypeScript error",
  context: { projectType: "typescript" }
});
// Routes to: typescript-expert skill

const route2 = await router.routeTask({
  task: "write a Dockerfile for my API",
  context: { projectType: "nodejs" }
});
// Routes to: docker-expert skill

const route3 = await router.routeTask({
  task: "optimize this React component",
  context: { framework: "react" }
});
// Routes to: react-patterns skill
```

### Automatic Skill Detection

The TaskSkillRouter facade uses **intent classification** and **keyword extraction** modules to match tasks to skills:

| Your Input | Detected Skill | Confidence |
|------------|----------------|------------|
| "help me fix this TypeScript error" | typescript-expert | 0.95 |
| "write a Dockerfile for my API" | docker-expert | 0.92 |
| "analyze my landing page copy" | copywriting | 0.88 |
| "optimize this React component" | react-patterns | 0.94 |
| "set up AWS Lambda function" | aws-serverless | 0.91 |

### Facade-Based Skill Routing

```typescript
// Example: Complete skill routing workflow
const router = new TaskSkillRouter(orchestrator);

// Route with context
const route = await router.routeTask({
  task: "create a serverless API with AWS Lambda",
  context: {
    projectType: "nodejs",
    complexity: "medium",
    urgency: "normal"
  }
});

console.log(route);
// {
//   skill: "aws-serverless",
//   agent: "devops-engineer",
//   confidence: 0.93,
//   estimatedDuration: 120000,
//   modules: ["SkillMatcher", "AgentSelector", "ComplexityScorer"]
// }

// Execute via MCP Client facade
const mcpClient = new MCPClient(orchestrator);
const result = await mcpClient.callSkill(route.skill, {
  task: route.task,
  context: route.context
});
```

---

## Skill Categories

### 🖥️ Language & Framework Experts

- `typescript-expert` - TypeScript, JavaScript, type-level programming
- `python-patterns` - Python, FastAPI, Django, async patterns
- `react-patterns` - React, hooks, component design
- `go-patterns` - Go, concurrency, microservices
- `rust-patterns` - Rust, memory safety, performance

### ☁️ DevOps & Cloud

- `docker-expert` - Docker, containers, multi-stage builds
- `aws-serverless` - AWS Lambda, serverless architecture
- `vercel-deployment` - Vercel, edge functions, SSR

### 🔒 Security

- `vulnerability-scanner` - Security audits, vulnerability detection
- `api-security-best-practices` - API security, authentication

### 📈 Business & Marketing

- `copywriting` - Marketing copy, landing pages, CTAs
- `pricing-strategy` - Pricing models, monetization
- `seo-fundamentals` - SEO, search optimization

### 🤖 AI & Data

- `rag-engineer` - RAG systems, vector databases
- `prompt-engineering` - LLM prompting, optimization

### 💡 General

- `brainstorming` - Design thinking, structured ideation
- `planning` - Project planning, roadmaps

---

## Integration Architecture

### StringRay v1.15.1 Facade Pattern

```
┌─────────────────────────────────────────────┐
│         TaskSkillRouter Facade              │
│  (490 lines - intelligent routing)          │
└─────────────────────┬───────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│SkillMatcher  │ │Agent    │ │Complexity   │
│Module        │ │Selector │ │Scorer       │
└───────┬──────┘ └────┬────┘ └──────┬──────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│        MCP Client Facade                   │
│  (312 lines - unified skill execution)     │
└─────────────────────┬──────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│Server        │ │Protocol │ │Connection   │
│Discovery     │ │Handler  │ │Pool         │
└──────────────┘ └─────────┘ └─────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│      Antigravity Awesome Skills            │
│  (946+ skills via MCP protocol)            │
└────────────────────────────────────────────┘
```

### Skill Registration

Skills are automatically registered with the TaskSkillRouter facade:

```typescript
// During initialization
const router = new TaskSkillRouter(orchestrator);

// Antigravity skills are auto-registered
await router.registerSkills([
  {
    name: "typescript-expert",
    keywords: ["typescript", "javascript", "type", "ts"],
    capabilities: ["code-review", "type-fixing", "refactoring"]
  },
  {
    name: "docker-expert",
    keywords: ["docker", "container", "dockerfile"],
    capabilities: ["containerization", "deployment"]
  }
  // ... 946+ skills
]);
```

---

## Comparison: StringRay vs Antigravity

| Feature | StringRay | Antigravity |
|---------|-----------|-------------|
| Skills | 27 framework-specific + 946+ curated | 946+ general skills |
| Agents | 22 built-in | Works with all agents |
| Routing | TaskSkillRouter facade with ML | Manual selection |
| Codex | 60-term Universal Development Codex | N/A |
| Rules Engine | 30+ enforcement rules | N/A |
| Pre/Post Processors | Auto-creation, test-generation | N/A |
| Facade Pattern | ✅ Yes (v1.15.1) | N/A |
| License | MIT | MIT |

### When to Use What

**Use StringRay native skills when:**
- Working with the StringRay framework
- Need error prevention via Codex
- Want automated test generation
- Using built-in orchestration
- Need facade-based routing and management

**Use Antigravity skills when:**
- Need language-specific expertise (TypeScript, Python, Go, Rust)
- Working with cloud platforms (AWS, GCP, Vercel)
- Need security auditing
- Writing marketing copy
- Doing brainstorming/planning

**Use both together for maximum effectiveness:**
```typescript
// StringRay validates and orchestrates
const enforcer = new RuleEnforcer(orchestrator);
await enforcer.validate({ rules: ["codex-compliance"] });

// TaskSkillRouter selects best Antigravity skill
const router = new TaskSkillRouter(orchestrator);
const route = await router.routeTask({ task: "..." });

// MCP Client executes the skill
const mcpClient = new MCPClient(orchestrator);
const result = await mcpClient.callSkill(route.skill, params);
```

---

## Advanced Usage

### Custom Skill Registration

```typescript
// Register custom Antigravity-derived skill
const router = new TaskSkillRouter(orchestrator);

await router.registerSkill({
  name: "custom-graphql-expert",
  source: "antigrawesome-skills",
  keywords: ["graphql", "apollo", "schema"],
  capabilities: ["schema-design", "query-optimization"],
  priority: 0.8
});
```

### Skill-Specific Routing

```typescript
// Force specific skill usage
const route = await router.routeTask({
  task: "optimize database queries",
  skill: "database-expert",  // Force this skill
  context: { db: "postgresql" }
});
```

### Batch Skill Execution

```typescript
// Execute multiple skills in parallel
const mcpClient = new MCPClient(orchestrator);

const results = await mcpClient.batchCall([
  { skill: "typescript-expert", params: { code: "..." } },
  { skill: "docker-expert", params: { dockerfile: "..." } },
  { skill: "security-expert", params: { code: "..." } }
]);
```

---

## Performance Optimization

### Skill Caching

```typescript
// Enable skill result caching
const mcpClient = new MCPClient(orchestrator, {
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 100 // Max cached results
  }
});
```

### Connection Pooling

```typescript
// Optimize MCP connections for Antigravity skills
const mcpClient = new MCPClient(orchestrator, {
  connectionPool: {
    minConnections: 3,
    maxConnections: 15,
    idleTimeout: 60000
  }
});
```

### Routing Analytics

```typescript
// Analyze skill routing performance
const analytics = await router.getRoutingAnalytics();

console.log(`
  Total Routes: ${analytics.totalRoutes}
  Avg Confidence: ${analytics.averageConfidence}
  Cache Hit Rate: ${analytics.cacheHitRate}%
  Top Skills: ${analytics.topSkills.join(", ")}
`);
```

---

## Troubleshooting

### Skill Not Found

```bash
# Verify skill installation
ls .opencode/skills-antigravity/

# Check skill registration
npx strray-ai router list-skills

# Reinstall if needed
node scripts/integrations/install-antigravity-skills.js
```

### Routing Issues

```typescript
// Debug routing decisions
const route = await router.routeTask({
  task: "...",
  debug: true  // Enable debug mode
});

console.log(route.debugInfo);
// Shows: matched keywords, confidence scores, fallback used, etc.
```

### Performance Issues

```typescript
// Check skill execution performance
const metrics = await mcpClient.getMetrics();

console.log(`
  Avg Skill Latency: ${metrics.averageLatency}ms
  Cache Hit Rate: ${metrics.cacheHitRate}%
  Active Connections: ${metrics.activeConnections}
`);
```

---

## Attribution

Skills sourced from [Antigravity Awesome Skills](https://github.com/sickn33/antigravity-awesome-skills) under MIT License.

See `LICENSE.antigravity` for full license text.

## Resources

- [Antigravity Awesome Skills Repository](https://github.com/sickn33/antigravity-awesome-skills)
- [Skill Catalog](https://github.com/sickn33/antigravity-awesome-skills/blob/main/CATALOG.md)
- [Bundle Guide](https://github.com/sickn33/antigravity-awesome-skills/blob/main/docs/BUNDLES.md)
- [StringRay TaskSkillRouter Facade Documentation](https://stringray.dev/docs/facades/task-skill-router)

---

_Framework Version: 1.9.0 | Integration: Antigravity Awesome Skills | Last Updated: 2026-03-12_
