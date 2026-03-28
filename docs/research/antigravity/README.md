# Antigravity Skills Integration

**Date:** 2026-03-23  
**Status:** ✅ Active  
**Type:** Skills Library Integration  
**Source:** [Antigravity Awesome Skills](https://github.com/sickn33/antigravity-awesome-skills)  
**License:** MIT  

---

## Overview

Antigravity is a curated collection of 946+ AI agent skills under MIT license. StringRay integrates a curated subset of these skills to extend its agent capabilities beyond the built-in 25 agents.

This is **not a runtime integration** - it's a skills library that adds specialized capabilities to the agent pool through the skill router.

---

## What It Is

| Aspect | Description |
|--------|-------------|
| **Type** | Skills library (static integration) |
| **Source** | Antigravity Awesome Skills repository |
| **License** | MIT |
| **Skills Installed** | 22 curated skills |
| **Total Available** | 946+ skills |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANTIGRAVITY INTEGRATION ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────────┐
   │   Antigravity   │  Source: https://github.com/sickn33/antigravity-awesome
   │  Awesome Skills │
   │    (946+ skills)│
   └────────┬────────┘
            │
            ▼ (Install Script)
   ┌─────────────────────────────────────────────────────────────────────┐
   │              .opencode/integrations/                               │
   │                                                                     │
   │  typescript-expert/SKILL.md    →  @typescript-expert              │
   │  python-patterns/SKILL.md      →  @python-patterns                  │
   │  react-patterns/SKILL.md     →  @react-patterns                   │
   │  go-patterns/SKILL.md         →  @go-patterns                       │
   │  rust-patterns/SKILL.md       →  @rust-patterns                     │
   │  docker-expert/SKILL.md       →  @docker-expert                    │
   │  aws-serverless/SKILL.md      →  @aws-serverless                   │
   │  vercel-deployment/SKILL.md  →  @vercel-deployment                 │
   │  vulnerability-scanner/      →  @vulnerability-scanner              │
   │  api-security-best-practices →  @api-security-best-practices       │
   │  copywriting/SKILL.md        →  @copywriting                       │
   │  pricing-strategy/SKILL.md   →  @pricing-strategy                   │
   │  seo-fundamentals/SKILL.md   →  @seo-fundamentals                   │
   │  rag-engineer/SKILL.md       →  @rag-engineer                      │
   │  prompt-engineering/SKILL.md →  @prompt-engineering                │
   │  brainstorming/SKILL.md      →  @brainstorming                      │
   │  planning/SKILL.md           →  @planning                           │
   │  ... (22 total)                                                       │
   └─────────────────────────────────────────────────────────────────────┘
            │
            ▼ (Skill Router)
   ┌─────────────────────────────────────────────────────────────────────┐
   │                    Task Skill Router                                │
   │                                                                     │
   │  "help me fix this TypeScript error"  →  typescript-expert         │
   │  "write landing page copy"            →  copywriting               │
   │  "set up AWS Lambda"                  →  aws-serverless            │
   └─────────────────────────────────────────────────────────────────────┘
```

---

## Installed Skills

### Language/Framework Skills (5)

| Skill | Description |
|-------|-------------|
| `typescript-expert` | TypeScript best practices, patterns, type system |
| `python-patterns` | Python idiomatic patterns, data structures |
| `react-patterns` | React patterns, hooks, performance |
| `go-patterns` | Go concurrency, idioms, standard library |
| `rust-patterns` | Rust ownership, lifetimes, safety |

### DevOps/Cloud Skills (3)

| Skill | Description |
|-------|-------------|
| `docker-expert` | Dockerfiles, best practices, optimization |
| `aws-serverless` | Lambda, SAM, Serverless Framework |
| `vercel-deployment` | Vercel deployment, edge functions |

### Security Skills (2)

| Skill | Description |
|-------|-------------|
| `vulnerability-scanner` | Security vulnerabilities, OWASP |
| `api-security-best-practices` | API security, authentication |

### Business/Marketing Skills (3)

| Skill | Description |
|-------|-------------|
| `copywriting` | Marketing copy, CTAs, conversions |
| `pricing-strategy` | Pricing models, tiers |
| `seo-fundamentals` | SEO basics, keywords |

### AI/Data Skills (2)

| Skill | Description |
|-------|-------------|
| `rag-engineer` | RAG architectures, embeddings |
| `prompt-engineering` | Prompt optimization, techniques |

### General Skills (2)

| Skill | Description |
|-------|-------------|
| `brainstorming` | Idea generation, workshops |
| `planning` | Project planning, roadmaps |

---

## Integration Points in StringRay

### 1. Skills Directory

```
.opencode/integrations/
├── typescript-expert/SKILL.md
├── python-patterns/SKILL.md
├── react-patterns/SKILL.md
├── go-patterns/SKILL.md
├── rust-patterns/SKILL.md
├── docker-expert/SKILL.md
├── aws-serverless/SKILL.md
├── vercel-deployment/SKILL.md
├── vulnerability-scanner/SKILL.md
├── api-security-best-practices/SKILL.md
├── copywriting/SKILL.md
├── pricing-strategy/SKILL.md
├── seo-fundamentals/SKILL.md
├── rag-engineer/SKILL.md
├── prompt-engineering/SKILL.md
├── brainstorming/SKILL.md
├── planning/SKILL.md
└── ... (others)
```

### 2. Task Skill Router

The skills are integrated via the task-skill-router which maps user prompts to appropriate skills:

```typescript
// In task-skill-router.ts
const ANTIGRAVITY_MAPPINGS = [
  { keywords: ['typescript', 'ts', 'type'], skill: 'typescript-expert', priority: 10 },
  { keywords: ['python', 'py'], skill: 'python-patterns', priority: 10 },
  { keywords: ['react', 'jsx', 'tsx'], skill: 'react-patterns', priority: 10 },
  // ... more mappings
];
```

### 3. Skill Invocation

Skills are invoked through natural conversation:

```
"help me fix this TypeScript error"
    → typescript-expert detected → code-reviewer invoked

"write landing page copy"
    → copywriting detected → growth-strategist invoked

"set up AWS Lambda"
    → aws-serverless detected → devops-engineer invoked
```

---

## How to Use

### Using Skills in Prompts

```bash
# Direct skill invocation
"@typescript-expert help me fix this type error"

# Via task description
"help me write a React component with best practices"
    → react-patterns skill activated
```

### Installing Additional Skills

```bash
# Install curated skills (default)
node scripts/integrations/install-antigravity-skills.js

# Install all 946+ skills
node scripts/integrations/install-antigravity-skills.js --full
```

---

## Configuration Options

### Install Script Options

| Option | Description |
|--------|-------------|
| `--curated` | Install only curated skills (22, default) |
| `--full` | Install all 946+ available skills |

### Skill Files

Each skill is a `SKILL.md` file with:
- **name**: Skill identifier
- **description**: What the skill does
- **metadata**: Additional configuration
- **content**: Skill documentation and patterns

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| None (build-time) | - | Installed via fetch at build time |

---

## Routing Priority

The task skill router uses keyword priority to determine which skill to invoke:

| Priority | Skills |
|----------|--------|
| 10 (highest) | Language skills (typescript, python, etc.) |
| 5 | DevOps and Security |
| 1 | Business and General |

**Note:** Order matters in the router. More specific patterns (like "rust") should come before general ones (like "typescript") to avoid incorrect matches.

---

## License

The Antigravity skills are licensed under MIT. See `LICENSE.antigravity` for full license text.

---

## Related Files

| File | Purpose |
|------|---------|
| `scripts/integrations/install-antigravity-skills.js.mjs` | Installation script |
| `LICENSE.antigravity` | License file for Antigravity skills |
| `.opencode/integrations/` | Installed skill files |
| `docs/reflections/antigravity-integration-journey-reflection-2026-02-26.md` | Development journey |

---

## Future Enhancements

- Add more curated skills from Antigravity
- Create custom skills based on Antigravity patterns
- Implement skill auto-update mechanism

---

**Status:** ✅ Active - Skills library integrated into StringRay agent pool