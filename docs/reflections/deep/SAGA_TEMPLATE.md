# Saga Template (v1.0)

## Long-Form Technical Saga Spanning Multiple Sessions

**Location:** `./docs/reflections/deep/[descriptive-name]-saga-YYYY-MM-DD.md`  
**Purpose:** Document epic technical journeys that span days or weeks  
**When to Use:** Multi-session efforts, major refactors, system-wide investigations, "hero's journey" narratives

---

## What Makes a Saga Different from a Deep Reflection

| Deep Reflection | Saga |
|-----------------|------|
| One extended session | Multiple sessions across days/weeks |
| Personal voice | Broader narrative with multiple players |
| 2000-10000 words | 5000-15000 words |
| Single emotional arc | Epic arc with chapters |
| You alone | You + other agents/people + system |

A saga feels like a novel. A deep reflection feels like a blog post.

---

## The Hero's Journey Structure

Sagas use the classic monomyth structure:

### Act 1: Departure
- **Ordinary World** - The everyday life before the challenge
- **Call to Adventure** - The inciting incident
- **Refusal of the Call** - Hesitation
- **Meeting the Mentor** - Guidance received
- **Crossing the Threshold** - Entering the new world

### Act 2: Initiation
- **Tests, Allies, Enemies** - Building the network
- **Approaching the Cave** - Near the crisis
- **Ordeal** - The major challenge
- **Reward** - Gaining the prize

### Act 3: Return
- **The Road Back** - Returning home
- **Resurrection** - Final test
- **Return with the Elixir** - Changed and renewed

---

## Template Sections

### Frontmatter (Required)
```yaml
---
story_type: saga
emotional_arc: "beginning → trials → climax → resolution"
codex_terms: [5, 7, 32]  # Optional Codex references
---
```

### Opening Chapter
Start with a scene that establishes the "Ordinary World":

```markdown
# The [Descriptive Title]

**Deep Saga | [Date] | StringRay v[X.X.X]**

---

It started when...

[Scene-setting opening - drop the reader into a moment]

[Establish what the system was like before the challenge]

[Introduce the inciting incident]
```

### Chapters (Natural Divisions)

Only add chapter headers when the story naturally divides:

```markdown
## Chapter 1: [Name]

[Continue the story...]

## Chapter 2: [Name]

[Continue...]

## The Climax

[The major turning point]

## Resolution

[How it ended, what was learned]

## Epilogue

[What changed, what's next]
```

### Closing Sections

```markdown
## Key Takeaways

- **key**: [Most important lesson]
- **technical**: [Technical insight]
- **emotional**: [Emotional takeaway]

## What Next?

- Read about [StringRay Codex Terms](../../.opencode/strray/codex.json)
- Explore [other stories](./)
- Invoke @storyteller to document your saga
```

---

## When to Use This Template

Use the saga template when:
- The effort spans multiple days/sessions
- There are multiple "players" (agents, humans, systems)
- The story has epic scope - major refactor, system redesign
- There's a clear "hero's journey" arc
- You want to tell a compelling long-form story

**Not for:**
- Quick single-session reflections (use TEMPLATE.md)
- Personal learning journeys (use journey template)
- Short technical narratives (use narrative template)

---

## Example Invocation

```
@storyteller write a saga about the great processor refactoring
```

This would produce a chapter-based narrative using the hero's journey structure.

---

## Length Guidelines

- **Minimum**: 5,000 words
- **Ideal**: 8,000-12,000 words
- **No maximum**: If the epic demands more, write more

---

## Golden Rules for Sagas

1. **Start with a scene** - Not a summary, drop readers into a moment
2. **Include multiple sessions** - Show the passage of time
3. **Give other agents/humans agency** - They're characters, not props
4. **Build to a climax** - The story should have a turning point
5. **End with transformation** - Show how things changed
6. **Add technical depth** - Code details, architecture decisions
7. **Include the messy truth** - Wrong turns, failures, doubts

---

*This template is for epic technical journeys. Let the story find its own form.*