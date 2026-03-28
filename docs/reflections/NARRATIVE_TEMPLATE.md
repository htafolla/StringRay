# Narrative Template (v1.0)

## Telling the Story of Code, Architecture, or Systems

**Location:** `./docs/reflections/[descriptive-name]-narrative-YYYY-MM-DD.md`  
**Purpose:** Make technical systems accessible through narrative  
**When to Use:** Explaining architecture, documenting systems, making code understandable

---

## What Makes a Narrative Different

| Narrative | Journey | Deep Reflection |
|-----------|---------|-----------------|
| Explaining a system | Finding something | Processing experience |
| Code as protagonist | You as protagonist | You as protagonist |
| 1000-3000 words | 1500-4000 words | 2000-10000 words |
| "What is this?" | "What did I find?" | "What happened?" |

A narrative tells **the story of code** - making technical systems feel alive and understandable.

---

## The Structure

### Frontmatter (Required)
```yaml
---
story_type: narrative
emotional_arc: "problem → investigation → solution → meaning"
codex_terms: [5, 7, 32]  # Optional Codex references
---
```

### Recommended Structure

```markdown
# [System/Feature Name]: A Story

**Narrative | [Date] | StringRay v[X.X.X]**

---

## The Problem

[What needed to be solved]
[Why it mattered]
[Who it affected]

## The Investigation

[How the system was explored]
[What was discovered]
[Key technical findings]

## The Solution

[What was built]
[How it works]
[Technical details woven in]

## What It Means

[Why this matters]
[How it changes things]
[What this enables]
```

---

## Opening Approaches

Start by making the code feel alive:

```markdown
Every request that flows through StringRay passes through a single file first. That file is the processor-manager, and it's been waiting to tell you its story.

This is the tale of how a simple routing decision became the heart of an entire framework.
```

Or start with a question:

```markdown
How does a framework decide what to do with a request? In StringRay, the answer lives in a file called the Processor Manager.

This is its story.
```

---

## Making Code Feel Alive

Narratives should make technical systems feel like characters:

```markdown
The routing lexicon was the quiet one. It didn't generate events or process rules. It just... watched. But what it saw determined everything that followed.
```

Use active voice for code actions:

```markdown
The function receives a request, checks the lexicon for matching patterns, then routes to the appropriate processor based on what it finds.
```

Compare to:

```markdown
Requests are received and checked against the lexicon, then routed to processors based on pattern matching.
```

---

## Balancing Depth and Accessibility

Include technical details, but explain them:

```markdown
The processor-manager exports a `routeRequest()` function. This function takes a request object and returns a processor instance. Here's what happens inside:

1. It checks `request.type` to determine the request category
2. It looks up the category in the routing lexicon
3. It instantiates the matching processor class
4. It passes the request to the processor's `process()` method
```

Don't assume knowledge, but don't over-explain either.

---

## The Emotional Arc

**Problem** → **Investigation** → **Solution** → **Meaning**

This is a "problem-solution" narrative arc, not a personal journey. The focus is on the system, not you.

---

## When to Use This Template

Use the narrative template when:
- Explaining how a system works
- Documenting architecture decisions
- Making code accessible to others
- Telling the story of a feature
- Creating onboarding material

**Not for:**
- Personal reflection (use reflection template)
- Investigation/learning (use journey template)
- Multi-session epic (use saga template)

---

## Example Invocations

```
@storyteller write a narrative explaining how the processor system works

@storyteller tell the story of how routing evolved in StringRay

@storyteller write a narrative about the rules engine
```

---

## Length Guidelines

- **Minimum**: 1,000 words
- **Ideal**: 1,500-2,500 words
- **Maximum**: 3,000 words

Keep it accessible - this is for explaining systems to others.

---

## Golden Rules for Narratives

1. **Make code the protagonist** - The system is the hero of the story
2. **Explain the "why"** - Not just what, but why it matters
3. **Use concrete examples** - Show actual code, actual flows
4. **Keep it accessible** - Write for someone who doesn't know the system
5. **Stay focused** - One system, one story
6. **Include diagrams** - If relevant, explain the architecture visually
7. **End with meaning** - Don't just stop, explain why this matters

---

## Shareability

Narratives are often the most shareable story type. Consider adding a "tweet-sized" hook:

```markdown
## The One-Line Story

[One sentence that captures the essence]
```

---

*This template is for explaining technical systems through story. Let the code tell its own tale.*