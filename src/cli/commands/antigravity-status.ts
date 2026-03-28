/**
 * Antigravity Status CLI Command
 *
 * Shows status of all installed skills.
 *
 * Usage: npx strray-ai antigravity status
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

interface SkillInfo {
  name: string;
  source: string;
  communitySource: string | null;
  license: string;
  category: string;
  path: string;
}

function getSkillsFromSkills(cwd: string): SkillInfo[] {
  const skills: SkillInfo[] = [];
  const skillsPath = join(cwd, ".opencode", "skills");

  if (!existsSync(skillsPath)) {
    return skills;
  }

  const dirs = readdirSync(skillsPath).filter((f) => {
    const skillPath = join(skillsPath, f, "SKILL.md");
    return existsSync(skillPath);
  });

  for (const dir of dirs) {
    const skillPath = join(skillsPath, dir, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");

    const sourceMatch = content.match(/^source:\s*(.+)/m);
    const sourceNameMatch = content.match(/^source_name:\s*(.+)/m);
    const licenseMatch = content.match(/License:\s*(.+)/m);

    const rawName = dir.includes("--") ? dir.split("--").slice(1).join("--") : dir;
    const communitySource = sourceNameMatch ? sourceNameMatch[1]!.trim() : null;

    skills.push({
      name: rawName,
      source: sourceMatch && sourceMatch[1] ? sourceMatch[1]!.trim() : "custom",
      communitySource,
      license: licenseMatch ? licenseMatch[1]!.trim() : "unknown",
      category: extractCategory(content),
      path: skillPath,
    });
  }

  return skills;
}

function extractCategory(content: string): string {
  const categoryMatch = content.match(/category:\s*(.+)/i);
  if (categoryMatch && categoryMatch[1]) {
    return categoryMatch[1].trim();
  }

  if (content.includes("typescript") || content.includes("python")) {
    return "language";
  }
  if (content.includes("security") || content.includes("audit")) {
    return "security";
  }
  if (content.includes("design") || content.includes("ui") || content.includes("frontend")) {
    return "design";
  }
  if (content.includes("memory") || content.includes("context")) {
    return "memory";
  }

  return "general";
}

export async function antigravityStatusCommand(): Promise<void> {
  const cwd = process.cwd();

  const skills = getSkillsFromSkills(cwd);
  const frameworkSkills = skills.filter((s) => s.source === "framework");
  const communitySkills = skills.filter((s) => s.source === "community");

  const communityBySource = communitySkills.reduce((acc, skill) => {
    const key = skill.communitySource || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(skill);
    return acc;
  }, {} as Record<string, SkillInfo[]>);

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║              Installed Skills Status            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  console.log(`Framework Skills: ${frameworkSkills.length}`);
  console.log(`Community Skills: ${communitySkills.length} (from ${Object.keys(communityBySource).length} sources)`);
  console.log(`Total: ${skills.length}`);
  console.log("");

  console.log("── Framework Skills ──");
  console.log("");
  frameworkSkills
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((skill) => {
      console.log(`  ${skill.name}`);
    });
  console.log("");

  if (Object.keys(communityBySource).length > 0) {
    console.log("── Community Skills (by source) ──");
    console.log("");
    Object.entries(communityBySource)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([source, sourceSkills]) => {
        console.log(`  ${source} (${sourceSkills.length})`);
        sourceSkills
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((skill) => {
            const licenseBadge = skill.license.toUpperCase().substring(0, 3);
            console.log(`    - ${skill.name} [${licenseBadge}]`);
          });
        console.log("");
      });
  }

  console.log("-".repeat(50));
}

export default antigravityStatusCommand;
