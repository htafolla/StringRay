# Journey Template (v1.0)

## Investigation/Learning Journey Documentation

**Location:** `./docs/reflections/[descriptive-name]-journey-YYYY-MM-DD.md`  
**Purpose:** Document investigation or learning experiences  
**When to Use:** Explorations, bug investigations, learning new systems, technical discovery

---

## What Makes a Journey Different

| Journey | Deep Reflection | Saga |
|---------|-----------------|------|
| Focused exploration | Full session recap | Multi-session epic |
| Finding something new | Processing experience | Telling an epic |
| 1500-4000 words | 2000-10000 words | 5000-15000 words |
| Personal voice | Personal voice | Broad narrative |
| "What did I discover?" | "What did I learn?" | "What happened?" |

A journey is about **discovery** - finding something you didn't know.

---

## The Structure

### Frontmatter (Required)
```yaml
---
story_type: journey
emotional_arc: "curiosity → investigation → breakthrough → understanding"
codex_terms: [5, 7, 32]  # Optional Codex references
---
```

### Recommended Sections

```markdown
# [Descriptive Title]

**Journey | [Date] | StringRay v[X.X.X]**

---

## The Question

[What you wanted to find out]
[Why it mattered]
[What you expected to find]

## The Investigation

[How you explored]
[What you tried]
[Dead ends and wrong turns]
[Surprises along the way]

## The Discovery

[What you actually found]
[The breakthrough moment]
[What surprised you]
[Technical details]

## What It Means

[The insight]
[Why it matters]
[How this changes things]

## What Next

[Applications]
[Questions this raises]
[Where to go from here]
```

---

## Opening Approaches

Start with the question that drove the journey:

```markdown
It started with a question I couldn't shake: [the question]

I had a theory: [your hypothesis]

Or maybe I was just curious about: [what sparked exploration]
```

Or start with a moment of confusion:

```markdown
Something wasn't adding up.

The logs showed [X] but the code did [Y]. I couldn't figure out why.
```

---

## Including the Messy Parts

Journeys should include:
- Dead ends you tried
- Wrong assumptions
- Times you went backward
- Things that didn't work

This makes the discovery more meaningful.

```markdown
I tried looking at it from the wrong angle first...

My initial hypothesis was completely off because...

But then something caught my eye...
```

---

## The Emotional Arc

**Curiosity** → **Investigation** → **Breakthrough** → **Understanding**

Each phase should feel distinct:
- The spark that started it
- The exploration process
- The "aha" moment
- The new understanding

---

## When to Use This Template

Use the journey template when:
- You're investigating something specific
- You set out to find/understand something
- There's a clear discovery moment
- The focus is on learning, not just doing
- Single session or focused exploration

**Not for:**
- Multi-day epics (use saga template)
- Post-session processing (use reflection template)
- Telling a broad narrative (use deep reflection)

---

## Example Invocations

```
@storyteller write a journey about discovering how routing works

@storyteller document the journey of figuring out why tests failed

@storyteller write a journey exploring the new skill system
```

---

## Length Guidelines

- **Minimum**: 1,500 words
- **Ideal**: 2,500-3,500 words
- **Maximum**: 4,000 words

Keep it focused - a journey is about one exploration.

---

## Golden Rules for Journeys

1. **Start with the question** - Make it clear what you were trying to find
2. **Show the exploration** - Include dead ends, wrong turns
3. **Build to discovery** - The breakthrough should feel earned
4. **Explain what it means** - Don't just report findings
5. **Stay personal** - "I discovered...", not "it was discovered"
6. **Keep it focused** - One journey, one discovery
7. **Include technical detail** - Code, logs, architecture

---

## Pixar Story Spine Alternative

For simpler journeys, use the Pixar Story Spine:

```
Once upon a time there was ___. (Setup - what prompted the question)
Every day, ___. (Normal - what you knew before)
One day ___. (Inciting event - what sparked investigation)
Because of that, ___. (Chain - what you tried)
Because of that, ___. (Chain - what you found)
Because of that, ___. (Chain - dead ends)
Until finally ___. (Resolution - the discovery)
And ever since then ___. (New normal - what it means)
```

---

*This template is for focused exploration and discovery. Let the story find its own form.*