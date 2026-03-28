# StringRay Documentation Index

**Version**: 1.14.0 | **Last Updated**: 2026-03-22

---

## Start Here

### For Agents (Essential Reading)
| Document | Purpose |
|----------|---------|
| [`../AGENTS.md`](../AGENTS.md) | **Main consumer guide** - how to work with StringRay |
| [`../AGENTS-consumer.md`](../AGENTS-consumer.md) | Simplified consumer version |

### For Developers
| Document | Purpose |
|----------|---------|
| [`README.md`](README.md) | Enterprise guide (v1.15.1) |
| [`ARCHITECTURE_UNIFIED.md`](ARCHITECTURE_UNIFIED.md) | System architecture |
| [`PIPELINE_TESTING_METHODOLOGY.md`](PIPELINE_TESTING_METHODOLOGY.md) | Testing methodology |
| [`pipeline-trees/`](pipeline-trees/) | Visual pipeline diagrams |

---

## By Topic

### Configuration & Setup
| Document |
|----------|
| [`CONFIGURATION.md`](CONFIGURATION.md) |
| [`ADDING_AGENTS.md`](ADDING_AGENTS.md) |
| [`AGENT_CONFIG.md`](AGENT_CONFIG.md) |

### Templates (Single Location)
| Document |
|----------|
| [`reference/templates/`](reference/templates/) - All templates |
| [`reference/templates/agents_template.md`](reference/templates/agents_template.md) |
| [`reference/templates/master-agent-template.md`](reference/templates/master-agent-template.md) |

### Testing & Quality
| Document |
|----------|
| [`PIPELINE_TESTING_METHODOLOGY.md`](PIPELINE_TESTING_METHODOLOGY.md) |
| [`pipeline-trees/`](pipeline-trees/) |
| [`governance/governance-systems-test-report.md`](governance/governance-systems-test-report.md) |

### Guides
| Document |
|----------|
| [`guides/getting-started/`](guides/getting-started/) |
| [`guides/installation/`](guides/installation/) |
| [`guides/configuration/`](guides/configuration/) |
| [`guides/troubleshooting/`](guides/troubleshooting/) |

---

## Quick Reference

| Need | Go To |
|------|-------|
| How to add an agent | [`ADDING_AGENTS.md`](ADDING_AGENTS.md) |
| How pipelines work | [`pipeline-trees/`](pipeline-trees/) |
| Testing methodology | [`PIPELINE_TESTING_METHODOLOGY.md`](PIPELINE_TESTING_METHODOLOGY.md) |
| Configuration options | [`CONFIGURATION.md`](CONFIGURATION.md) |
| Architecture overview | [`ARCHITECTURE_UNIFIED.md`](ARCHITECTURE_UNIFIED.md) |

---

## Directory Structure

```
docs/
├── README.md                   ← Enterprise guide (v1.15.1)
├── DOCS_INDEX.md               ← This index
├── AGENTS.md                  ← Consumer guide (root)
├── ARCHITECTURE_UNIFIED.md     ← Architecture overview
├── PIPELINE_TESTING_METHODOLOGY.md ← Testing guide
├── pipeline-trees/            ← Pipeline diagrams
│   ├── ROUTING_PIPELINE_TREE.md
│   ├── GOVERNANCE_PIPELINE_TREE.md
│   ├── BOOT_PIPELINE_TREE.md
│   ├── ORCHESTRATION_PIPELINE_TREE.md
│   ├── PROCESSOR_PIPELINE_TREE.md
│   └── REPORTING_PIPELINE_TREE.md
├── guides/                    ← How-to guides
├── reference/                 ← Technical reference
│   ├── templates/            ← Template files
│   └── api/                  ← API docs
├── framework/                 ← Framework docs
├── security/                  ← Security docs
├── performance/               ← Performance docs
├── operations/               ← Operations docs
├── archive/                   ← Archived docs
└── reflections/               ← Project reflections
```

---

## Current Version: v1.15.1

| Component | Count |
|-----------|-------|
| Pipeline tests | 6 (107 tests) |
| Unit tests | 2,521 |
| Processors | 13 (5 pre + 8 post) |
| Agents | 23+ |

---

## Archived/Duplicate Files

These are preserved in [`archive/`](archive/) for reference:
- `api/API_REFERENCE.md.backup`
- Old release notes (v1.7.x, v1.8.x)
- Legacy framework docs
- Superseded configuration guides

---

## Contributing

When adding docs:
1. Place in appropriate folder (see structure above)
2. Add version banner: `**Version**: 1.14.0`
3. Update this index
4. Archive outdated docs instead of deleting
