#!/usr/bin/env node
/**
 * Reflection Index Generator
 * 
 * Generates an index of all reflection documents in docs/reflections/
 * Run: node scripts/node/generate-reflection-index.js
 * 
 * Features:
 * - Extracts frontmatter (story_type, emotional_arc, date)
 * - Categorizes reflections (reflection, journey, saga, narrative)
 * - Generates cross-references
 * - Creates a searchable index.md
 */

import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = process.cwd();
const REFLECTIONS_DIR = path.join(PROJECT_ROOT, "docs", "reflections");
const INDEX_PATH = path.join(REFLECTIONS_DIR, "index.md");

// Story types from storyteller agent
const STORY_TYPES = {
  reflection: "Technical deep reflections on development process",
  journey: "Investigation/learning journey",
  saga: "Long-form technical saga spanning multiple sessions",
  narrative: "Technical narrative - telling the story of code",
};

/**
 * Extract YAML frontmatter from markdown
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(":").trim();
    }
  }

  return frontmatter;
}

/**
 * Extract title from markdown
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Untitled";
}

/**
 * Extract date from filename or frontmatter
 */
function extractDate(filename, frontmatter) {
  if (frontmatter.date) return frontmatter.date;

  // Extract from filename: reflection-YYYY-MM-DD-title.md
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) return dateMatch[1];

  return "unknown";
}

/**
 * Extract story type from frontmatter or filename
 */
function extractStoryType(filename, frontmatter) {
  if (frontmatter.story_type) return frontmatter.story_type;

  for (const type of Object.keys(STORY_TYPES)) {
    if (filename.includes(type)) {
      return type;
    }
  }

  return "reflection";
}

/**
 * Scan reflections directory
 */
function scanReflections() {
  if (!fs.existsSync(REFLECTIONS_DIR)) {
    console.error("❌ docs/reflections/ not found");
    return [];
  }

  const files = fs.readdirSync(REFLECTIONS_DIR);
  const reflections = [];

  for (const file of files) {
    if (!file.endsWith(".md") || file === "index.md") continue;

    const filepath = path.join(REFLECTIONS_DIR, file);
    const content = fs.readFileSync(filepath, "utf-8");
    const frontmatter = extractFrontmatter(content);

    reflections.push({
      filename: file,
      title: extractTitle(content),
      date: extractDate(file, frontmatter),
      storyType: extractStoryType(file, frontmatter),
      emotionalArc: frontmatter.emotional_arc || frontmatter.emotionalArc || "unknown",
      tags: frontmatter.tags
        ? frontmatter.tags.split(",").map((t) => t.trim())
        : [],
      summary: frontmatter.summary || content.slice(0, 200).replace(/[#*]/g, "").trim(),
    });
  }

  // Sort by date descending
  reflections.sort((a, b) => b.date.localeCompare(a.date));

  return reflections;
}

/**
 * Generate index markdown
 */
function generateIndex(reflections) {
  const now = new Date().toISOString().split("T")[0];

  let index = `# Reflection Index\n\n`;
  index += `> Auto-generated on ${now} | ${reflections.length} reflections\n\n`;

  // Summary stats
  const stats = {
    reflection: 0,
    journey: 0,
    saga: 0,
    narrative: 0,
  };

  for (const r of reflections) {
    stats[r.storyType] = (stats[r.storyType] || 0) + 1;
  }

  index += `## Summary\n\n`;
  index += `| Type | Count |\n`;
  index += `|------|-------|\n`;
  for (const [type, count] of Object.entries(stats)) {
    index += `| ${type} | ${count} |\n`;
  }
  index += "\n";

  // Group by story type
  for (const [storyType, description] of Object.entries(STORY_TYPES)) {
    const typeReflections = reflections.filter((r) => r.storyType === storyType);
    if (typeReflections.length === 0) continue;

    index += `## ${storyType.charAt(0).toUpperCase() + storyType.slice(1)}s\n\n`;
    index += `> ${description}\n\n`;

    for (const r of typeReflections) {
      index += `### ${r.title}\n\n`;
      index += `- **Date**: ${r.date}\n`;
      if (r.emotionalArc !== "unknown") {
        index += `- **Emotional Arc**: ${r.emotionalArc}\n`;
      }
      if (r.tags.length > 0) {
        index += `- **Tags**: ${r.tags.map((t) => `\`${t}\``).join(", ")}\n`;
      }
      index += `- **File**: [${r.filename}](./${r.filename})\n`;
      index += `\n${r.summary}...\n\n`;
      index += `---\n\n`;
    }
  }

  // Recent reflections (last 10)
  index += `## Recent Reflections\n\n`;
  index += `| Date | Title | Type |\n`;
  index += `|------|-------|------|\n`;

  for (const r of reflections.slice(0, 10)) {
    index += `| ${r.date} | [${r.title}](./${r.filename}) | ${r.storyType} |\n`;
  }

  index += `\n---\n\n`;
  index += `*This index is auto-generated. Run \`node scripts/node/generate-reflection-index.js\` to update.*\n`;

  return index;
}

/**
 * Main
 */
function main() {
  console.log("🔄 Generating reflection index...\n");

  const reflections = scanReflections();
  console.log(`Found ${reflections.length} reflections\n`);

  const index = generateIndex(reflections);
  fs.writeFileSync(INDEX_PATH, index);

  console.log(`✅ Index generated: ${INDEX_PATH}`);
  console.log(`   ${reflections.length} reflections indexed`);
}

// Run
main();
