---
source: framework
name: storyteller
description: "Write deep narrative reflections, sagas, journeys, and technical stories using the current session's full context"
category: documentation
---

# Storyteller Skill

Write narrative-style reflections and journey documents that capture the human experience of development work. This skill runs in the caller's session context -- use the conversation history and what just happened as the primary source material.

## Story Types

| Type | When to Use | Save To | Length |
|------|-------------|---------|--------|
| `reflection` | Single-session work, bug fixes, targeted implementations | `docs/reflections/{topic}-reflection.md` | 2,000-5,000 words |
| `saga` | Multi-session journeys, major architectural changes | `docs/reflections/deep/{topic}-journey-YYYY-MM-DD.md` | 5,000-15,000 words |
| `journey` | Investigation/learning journeys, research deep-dives | `docs/reflections/deep/{topic}-journey-YYYY-MM-DD.md` | 1,500-4,000 words |
| `narrative` | Technical narrative -- telling the story of code/architecture | `docs/reflections/{topic}-narrative.md` | 1,000-3,000 words |

**Naming:** `{descriptive-name}-{type}-YYYY-MM-DD.md` (e.g., `routing-system-removal-journey-2026-03-26.md`)

## Frontmatter

```yaml
---
story_type: bug_fix | feature_development | architectural_decision | reflection | saga | journey | narrative
emotional_arc: "frustration -> confusion -> breakthrough -> satisfaction"
codex_terms: [5, 7, 32]  # Related Codex term numbers
---
```

## Voice Guidelines

**The foundational voice: Warmly Candid**

- Conversational first, precise second
- Vulnerable without being performative
- Confident without being dismissive
- Curious as a default stance

**Vocabulary:** Plain English by default ("use" not "utilize", "fix" not "remediate"). Use domain language when it's standard and more precise. Introduce specialized terms clearly on first use.

**Tone by context:**
- Describing a problem: slightly frustrated, relatable
- Breakthrough moment: wondering, almost giddy
- Reflecting on failure: honest, slightly embarrassed
- Explaining a lesson: thoughtful, wise

## What Makes Good Reflections

**Start with a scene, not a summary.** Drop the reader into a specific moment.

**Include the messy truth.** Dead ends, wrong turns, the frustration that led to breakthrough. The reader should feel like they were there.

**Go long.** Tell the whole story. 2,000 words minimum -- don't cut short what deserves full treatment.

**Let the story find its own form.** Use headers only when the narrative naturally divides. Never force Phase 1/2/3 structure.

**Technical details woven in, not bolted on.** Code snippets, file paths, and error messages should appear naturally as part of the narrative.

## What to Avoid

**AI-sound patterns:**
- "First, let me explain..." / "In conclusion..."
- "It could be argued that perhaps..."
- Generic emotional statements ("I felt frustration")
- Hollow insights ("This taught me patience")
- Over-polished transitions ("Here's what really got me -- what he did NEXT")

**Structural anti-patterns:**
- Executive Summary sections
- Phase 1/2/3 structures
- Bullet point lists (except in Key Takeaways)
- Tables unless truly necessary
- Filling boxes because required

**Writing anti-patterns:**
- Repetitive sentence starts or phrases
- Throat-clearing ("In this document...")
- Passive voice when active is stronger
- Forced metaphors

## Required End Sections

**Key Takeaways** (bullet-style with bold labels):
```markdown
## Key Takeaways

- **Most important lesson** -- One sentence
- **Technical insight** -- One sentence
- **Emotional takeaway** -- One sentence
```

**What Next?** (actionable):
```markdown
## What Next?

- Related Codex terms: [codex.json](../../.opencode/strray/codex.json)
- Next story to write: [suggestion]
```

## Opening Prompts

When stuck on how to begin:
- "It was [time]. [Scene-setting detail]..."
- "The problem seemed simple at first..."
- "I remember the exact moment I realized I'd been approaching this completely wrong..."
- "Have you ever spent so long on a problem that you forgot what the problem actually was?"
- "You won't believe what happened next..."

## Quality Checklist

- [ ] Minimum 2,000 words
- [ ] Opens with a scene, not a summary
- [ ] Includes dead ends and wrong turns
- [ ] Technical details are accurate (verify file names, error messages)
- [ ] No AI-sound patterns
- [ ] Key Takeaways section present
- [ ] What Next section with CTAs
- [ ] Frontmatter with story_type and emotional_arc
- [ ] Saved to correct directory with correct naming

## Fact-Checking

Before finalizing, verify:
- Agent roles and capabilities match actual implementation
- File paths and code references are correct
- Error messages quoted accurately
- Framework version numbers are correct
