# Central Analytics Store - Quick Start Guide

**Purpose:** Get your project contributing anonymized data to the central analytics store for community learning benefits.

**Framework Version:** StringRay AI v1.15.1+

---

## What's New in v1.15.1

StringRay v1.15.1 features a modern **Facade Pattern** architecture that improves performance and reliability:

- **87% Code Reduction**: 8,230 → 1,218 lines of code
- **Facade Architecture**: Modular design with clean APIs
- **Better Performance**: Faster analytics processing and submission
- **100% Backward Compatible**: All existing analytics features work unchanged

No migration needed - your existing analytics configuration continues to work exactly as before.

---

## Overview

This guide walks through setting up your project to contribute anonymized reflections and AI logs to the StringRay Central Analytics Store, enabling the P9 Adaptive Pattern Learning system to benefit from community data.

## Prerequisites

- StringRay AI v1.15.1+ installed
- Project initialized with `npx strray-ai init`
- Basic understanding of privacy and data protection

## Step 1: Check Current Status

```bash
# Check if analytics is enabled
npx strray-ai analytics status

# Preview what data would be submitted (without actually submitting)
npx strray-ai analytics preview
```

## Step 2: Enable Analytics (Opt-In)

```bash
# Enable all analytics categories
npx strray-ai analytics enable

# Or enable specific categories only
npx strray-ai analytics enable --categories reflections,metrics
```

**What happens:**
- Creates `.opencode/consent.json` with your opt-in consent
- Generates anonymous project identifier
- Creates submission token for future uploads
- Starts background queue for data submission

## Step 3: Review Data to be Submitted

```bash
# Preview anonymized reflection data
npx strray-ai analytics preview --type reflection

# Preview anonymized metrics data  
npx strray-ai analytics preview --type metrics

# Preview everything that would be submitted
npx strray-ai analytics preview --all
```

**What gets anonymized:**
- ✅ Project names and file paths → Normalized to patterns
- ✅ Personal identifiers → Removed completely  
- ✅ Code snippets → Replaced with pattern descriptors
- ✅ IP addresses and timestamps → Normalized

**What gets preserved (for learning):**
- ✅ Agent performance metrics (success rates, confidence)
- ✅ Complexity ratings and outcomes
- ✅ Pattern effectiveness data
- ✅ Emotional/struggle patterns (anonymized)

## Step 4: Verify Data Submission

```bash
# Check if submissions are working
npx strray-ai analytics test

# View submission queue status
npx strray-ai analytics queue-status

# View community impact (if already contributing)
npx strray-ai analytics impact
```

## Step 5: Get Value Back

Once you're contributing, you automatically receive:

### 1. Improved Routing Patterns
```bash
# View community routing recommendations
npx strray-ai analytics recommendations
```

### 2. Community Benchmarks  
```bash
# Compare your project vs community
npx strray-ai analytics benchmarks
```

### 3. Early Warnings
```bash
# Check for any issues detected by community data
npx strray-ai analytics warnings
```

## Step 6: Disable Analytics (Opt-Out) Anytime

```bash
# Disable all analytics immediately
npx strray-ai analytics disable

# Disable specific categories only
npx strray-ai analytics disable --categories reflections
```

**What happens:**
- Immediate stop to all data submission
- Existing submission queue is cleared
- Consent status updated in `.opencode/consent.json`
- No further data is collected or submitted

## Configuration File

The `.opencode/consent.json` file controls your analytics participation:

```json
{
  "analyticsEnabled": true,
  "consentDate": "2026-03-12T10:30:00.000Z",
  "consentVersion": "1.9.0",
  "lastOptOut": null,
  "categories": {
    "reflections": true,
    "logs": true,
    "metrics": true,
    "patterns": true
  },
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Important:** Never share your `projectId` or submission tokens publicly.

## File Structure

After enabling analytics, your project will have this structure:

```
your-project/
├── .opencode/
│   ├── consent.json                     # ⚠️  Contains sensitive project ID
│   └── analytics/
│       ├── submission-queue.json         # Queued submissions
│       ├── local-metrics.json          # Local analytics cache
│       └── processed-submissions.json   # Successfully submitted
│
├── docs/
│   └── reflections/                 # Your reflection files
│       └── session-reflection.md
│
└── .gitignore                      # Ensures privacy files not committed
```

### Git Tree Visualizations

```bash
# View analytics configuration files (excluding sensitive data)
git ls-tree HEAD .opencode/

# Check which files are gitignored (should include consent files)
git check-ignore -v .opencode/consent.json

# Show analytics-related commits in project
git log --oneline --all --grep="analytics"

# Track changes to analytics configuration (should be empty if working)
git diff .opencode/consent.json

# View only non-sensitive analytics documentation
git ls-tree -r HEAD --name-only | grep -E "analytics|consent" | grep -v ".json"
```

### Expected .gitignore Entries

```bash
# Privacy-critical files (automatically added by analytics enable)
.opencode/consent.json
.opencode/analytics/*.json
.analytics/

# Local queue and cache files
.opencode/analytics/submission-queue.json
.opencode/analytics/local-metrics.json
.opencode/analytics/processed-submissions.json
```

**Verify privacy:**
```bash
# Ensure consent file is gitignored
git check-ignore .opencode/consent.json
# Should output: .opencode/consent.json

# Check if any sensitive files are tracked
git ls-files | grep -E "consent|submission-queue"
# Should output nothing
```

## Privacy Guarantee

### What We Collect
- Agent performance metrics (success rates, confidence scores)
- Complexity ratings and outcomes
- Pattern effectiveness data
- Anonymized emotional context indicators

### What We NEVER Collect
- Your project name or company information
- Actual code or file contents
- Personal names or email addresses
- IP addresses or precise timestamps
- API keys, secrets, or credentials

### Your Rights
- **Opt-in Required:** Nothing is submitted without explicit consent
- **Immediate Opt-Out:** Disable analytics anytime with one command
- **Data Deletion:** Request deletion of all your data
- **Transparency:** Full view of what data is submitted
- **Control:** Choose exactly what categories to contribute

## Troubleshooting

### Analytics Not Submitting

```bash
# Check consent status
npx strray-ai analytics status

# Test submission endpoint
npx strray-ai analytics test

# Check network connectivity
ping analytics.strray.ai

# View error logs
npx strray-ai analytics logs
```

### High Submission Failures

```bash
# Reduce submission frequency
npx strray-ai analytics config --set submission-interval=300

# Enable offline queue (submits when online)
npx strray-ai analytics config --enable offline-queue

# Clear stuck queue and retry
npx strray-ai analytics queue-clear
```

### Value Not Received

```bash
# Ensure you have enough submissions (min 10 for benchmarks)
npx strray-ai analytics impact

# Check if server is processing your data
npx strray-ai analytics status --verbose

# Wait 24-48 hours for first community insights
```

## Advanced Configuration

### Submission Frequency
```bash
# Set submission interval in seconds
npx strray-ai analytics config --set submission-interval=60

# Enable batch submissions (better for slow connections)
npx strray-ai analytics config --enable batch-mode
```

### Data Retention
```bash
# Set local retention period (days)
npx strray-ai analytics config --set retention-days=30

# Configure immediate cleanup on opt-out
npx strray-ai analytics config --enable immediate-cleanup
```

### Quality Control
```bash
# Enable local quality scoring before submission
npx strray-ai analytics config --enable quality-scoring

# Set minimum quality threshold
npx strray-ai analytics config --set min-quality-score=0.7
```

## Example Workflows

### Development Workflow
```bash
# Start day: Enable analytics
npx strray-ai analytics enable

# During development: Work normally
npx strray-ai build
npx strray-ai test

# Check status periodically
npx strray-ai analytics status

# End of day: Review contributions
npx strray-ai analytics impact
```

### Production Workflow
```bash
# Before deployment: Enable all analytics
npx strray-ai analytics enable --categories all

# Monitor in production
npx strray-ai analytics status --watch

# Get community insights
npx strray-ai analytics recommendations

# Handle any warnings
npx strray-ai analytics warnings --action-review
```

### Privacy-First Workflow
```bash
# Preview everything first
npx strray-ai analytics preview --all

# Enable only specific categories
npx strray-ai analytics enable --categories metrics,logs

# Exclude reflections (contains more personal content)
npx strray-ai analytics disable --categories reflections

# Monitor impact
npx strray-ai analytics impact
```

## Security Best Practices

1. **Never Share Tokens:** Keep submission tokens private
2. **Regular Review:** Check what's being submitted weekly
3. **Use HTTPS:** All submissions are encrypted
4. **Monitor Queue:** Check queue status periodically
5. **Update Regularly:** Keep framework updated for security patches

## Getting Help

- **Documentation:** `/docs/architecture/central-analytics-store.md`
- **Privacy Policy:** Check central store privacy documentation
- **Support:** Report issues in StringRay GitHub repository
- **Community:** Join discussions in community forums

## FAQ

**Q: Is my code being sent to the central store?**  
A: No. Code is never sent. Only pattern descriptors (e.g., "complex routing decision", "error recovery pattern") are transmitted.

**Q: Can I see exactly what's being submitted?**  
A: Yes. Use `npx strray-ai analytics preview --all` to see the exact data before submission.

**Q: What if I change my mind?**  
A: Simply run `npx strray-ai analytics disable` and submission stops immediately.

**Q: Is my data sold to third parties?**  
A: No. Data is used exclusively for improving StringRay's adaptive learning system.

**Q: How long is my data retained?**  
A: Data is retained for 90 days. You can request deletion anytime.

**Q: Do I have to participate to use StringRay?**  
A: No. StringRay works perfectly without central analytics. Participation is entirely optional.

**Q: What's the benefit of participating?**  
A: Better routing, community benchmarks, early warnings, and contributing to framework improvement.

**Q: Do I need to migrate for v1.15.1?**  
A: No. The v1.15.1 architecture refactoring is purely internal. Your existing analytics configuration continues to work exactly as before.

## Next Steps

1. **Try Preview:** Run `npx strray-ai analytics preview --all` to see what would be submitted
2. **Enable for Testing:** Try with specific categories first
3. **Monitor Impact:** Check community insights after a few days
4. **Provide Feedback:** Help improve the system with your experience

---

**Version:** 1.9.0  
**Framework Version:** StringRay AI v1.15.1  
**Architecture:** Facade Pattern (87% code reduction)  
**Last Updated:** 2026-03-12
