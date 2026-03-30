import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, cpSync, rmSync } from "fs";
import { join, basename, dirname } from "path";
import { execSync } from "child_process";
import { getConfigDir } from "../../core/config-paths.js";

interface RegistrySource {
  name: string;
  url: string;
  description?: string | undefined;
  license?: string | undefined;
}

interface LocalRegistry {
  sources: RegistrySource[];
}

function getLocalRegistryPath(): string {
  return join(process.cwd(), ".opencode", "strray", "skill-registry.json");
}

function getBundledRegistry(): LocalRegistry | null {
  const paths = [
    join(process.cwd(), "src", "skills", "registry.json"),
    join(process.cwd(), "node_modules", "strray-ai", "src", "skills", "registry.json"),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, "utf-8"));
    }
  }
  return null;
}

function getRegistry(): LocalRegistry {
  const bundled = getBundledRegistry();
  const localPath = getLocalRegistryPath();

  if (existsSync(localPath)) {
    const local = JSON.parse(readFileSync(localPath, "utf-8")) as LocalRegistry;
    if (bundled) {
      const names = new Set(bundled.sources.map((s) => s.name));
      for (const s of local.sources) {
        if (!names.has(s.name)) bundled.sources.push(s);
      }
      return bundled;
    }
    return local;
  }

  return bundled ?? { sources: [] };
}

function findSource(name: string): RegistrySource | undefined {
  return getRegistry().sources.find((s) => s.name === name || s.url === name);
}

function resolveSourcePrefix(sourceArg: string, source?: RegistrySource): string {
  if (source?.name) return source.name;
  const match = sourceArg.match(/\/([^/]+?)(?:\.git)?$/);
  return match?.[1] ?? sourceArg.replace(/[^a-zA-Z0-9-]/g, "-");
}

function cleanSourceSkills(skillsDir: string, sourcePrefix: string): number {
  let removed = 0;
  const prefix = `${sourcePrefix}--`;
  if (!existsSync(skillsDir)) return 0;
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith(prefix)) {
      rmSync(join(skillsDir, entry.name), { recursive: true });
      removed++;
    }
  }
  return removed;
}

function extractRepoSlug(url: string): { owner: string; repo: string } | null {
  const https = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (https) return { owner: https[1]!, repo: https[2]! };
  return null;
}

function cloneRepo(url: string, targetDir: string): string {
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true });
  }
  mkdirSync(targetDir, { recursive: true });

  const tarPath = join(targetDir, "_repo.tar.gz");
  const extracted = join(targetDir, "_repo");

  const slug = extractRepoSlug(url);
  if (!slug) {
    execSync(`git clone --depth 1 ${url} "${extracted}"`, { stdio: "pipe" });
    return extracted;
  }

  const errors: string[] = [];

  // Prefer gh repo clone when authenticated (faster, handles auth seamlessly)
  let hasGh = false;
  try {
    execSync("gh auth status --hostname github.com", { stdio: "pipe", timeout: 5000 });
    hasGh = true;
  } catch { /* gh not installed or not authenticated */ }

  if (hasGh) {
    try {
      console.log(`  Cloning via gh...`);
      execSync(`gh repo clone ${slug.owner}/${slug.repo} "${extracted}" -- --depth 1`, { stdio: "pipe", timeout: 60000 });
      return extracted;
    } catch (ghErr: unknown) {
      const stderr = (ghErr as { stderr?: Buffer })?.stderr?.toString("utf-8") || "";
      errors.push(`  gh repo clone: ${stderr.split("\n").filter((l: string) => l.includes("Error:"))[0]?.trim() || (ghErr as Error).message.split("\n")[0]}`);
    }
  }

  // Fallback: tarball download (public repos)
  for (const branch of ["main", "master"]) {
    const archiveUrl = `https://codeload.github.com/${slug.owner}/${slug.repo}/tar.gz/${branch}`;
    try {
      execSync(`curl -fsSL "${archiveUrl}" -o "${tarPath}"`, { stdio: "pipe", timeout: 30000 });
      if (!existsSync(tarPath) || require("fs").statSync(tarPath).size < 100) {
        if (existsSync(tarPath)) require("fs").unlinkSync(tarPath);
        errors.push(`  ${branch}: downloaded empty file (repo may not exist)`);
        continue;
      }
      execSync(`tar -xzf "${tarPath}" -C "${targetDir}"`, { stdio: "pipe" });
      require("fs").unlinkSync(tarPath);
      const dirName = `${slug.repo}-${branch}`;
      const repoDir = join(targetDir, dirName);
      if (existsSync(repoDir)) return repoDir;
      const dirs = readdirSync(targetDir).filter((f: string) =>
        f.startsWith(slug.repo + "-") && f !== "_repo.tar.gz"
      );
      if (dirs.length > 0) return join(targetDir, dirs[0]!);
      errors.push(`  ${branch}: archive extracted but repo directory not found`);
    } catch (tarErr: unknown) {
      if (existsSync(tarPath)) {
        try { require("fs").unlinkSync(tarPath); } catch { /* ignore */ }
      }
      errors.push(`  tarball (${branch}): ${(tarErr as Error).message.split("\n")[0]}`);
    }
  }

  // Last resort: git clone (HTTPS then SSH)
  const httpsUrl = url;
  const sshUrl = url.replace(/^https:\/\/github\.com\//, "git@github.com:");

  for (const [proto, gitUrl] of [["HTTPS", httpsUrl], ["SSH", sshUrl]] as const) {
    try {
      execSync(`git clone --depth 1 ${gitUrl} "${extracted}"`, { stdio: "pipe", timeout: 30000 });
      return extracted;
    } catch (gitErr: unknown) {
      const stderr = (gitErr as { stderr?: Buffer })?.stderr?.toString("utf-8") || "";
      if (stderr.includes("Authentication failed") || stderr.includes("Invalid username")) {
        errors.push(`  git ${proto}: authentication failed — your GitHub token/credentials are expired or misconfigured`);
      } else if (stderr.includes("Permission denied")) {
        errors.push(`  git ${proto}: permission denied — repo may be private`);
      } else if (stderr.includes("not found")) {
        errors.push(`  git ${proto}: repository not found`);
      } else {
        errors.push(`  git ${proto}: ${stderr.split("\n").filter((l: string) => l.includes("fatal:"))[0]?.trim() || (gitErr as Error).message.split("\n")[0]}`);
      }
    }
  }

  console.log("");
  console.log("  Download failed after 4 attempts:");
  for (const e of errors) console.log(e);
  console.log("");
  console.log("  To fix git authentication:");
  console.log("    1. Run: gh auth login");
  console.log("    2. Or update your GitHub token: git credential-osxkeychain erase");
  console.log("    3. Or use SSH: ssh-keygen -t ed25519 && gh ssh-key add");
  console.log("");

  throw new Error(`Failed to download ${url}. See errors above.`);
}

type RepoFormat = "skill-folders" | "flat-md" | "single-md" | "unknown";

const SKILL_PLATFORMS = [".opencode", ".claude", ".codex", ".cursor", ".gemini", ".kiro", ".pi", ".trae", ".trae-cn", ".agents", ".continue", ".factory", ".windsurf"];

function detectFormat(repoDir: string): { format: RepoFormat; root: string } {
  if (existsSync(join(repoDir, "skills"))) {
    const entries = readdirSync(join(repoDir, "skills"), { withFileTypes: true })
      .filter((d) => d.isDirectory());
    if (entries.some((d) => existsSync(join(repoDir, "skills", d.name, "SKILL.md")))) {
      return { format: "skill-folders", root: join(repoDir, "skills") };
    }
  }

  for (const platform of SKILL_PLATFORMS) {
    const platformSkillsDir = join(repoDir, platform, "skills");
    if (existsSync(platformSkillsDir)) {
      const entries = readdirSync(platformSkillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory());
      if (entries.some((d) => existsSync(join(platformSkillsDir, d.name, "SKILL.md")))) {
        return { format: "skill-folders", root: platformSkillsDir };
      }
    }
  }

  const entries = readdirSync(repoDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const entry of entries) {
    const nestedSkillsDir = join(repoDir, entry.name, "skills");
    if (existsSync(nestedSkillsDir)) {
      const nestedEntries = readdirSync(nestedSkillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory());
      if (nestedEntries.some((d) => existsSync(join(nestedSkillsDir, d.name, "SKILL.md")))) {
        return { format: "skill-folders", root: nestedSkillsDir };
      }
    }
  }

  const subdirs = readdirSync(repoDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "integrations" && d.name !== "examples" && d.name !== "scripts" && d.name !== "node_modules");

  for (const dir of subdirs) {
    const mdFiles = readdirSync(join(repoDir, dir.name))
      .filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "CONTRIBUTING.md" && f !== "LICENSE");
    if (mdFiles.length > 0) {
      const sample = readFileSync(join(repoDir, dir.name, mdFiles[0]!), "utf-8");
      if (/^---\s*\n\s*name:/m.test(sample)) {
        return { format: "flat-md", root: repoDir };
      }
    }
  }

  const rootMds = readdirSync(repoDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "CONTRIBUTING.md" && f !== "LICENSE");
  if (rootMds.length > 0) {
    const sample = readFileSync(join(repoDir, rootMds[0]!), "utf-8");
    if (/^---\s*\n\s*name:/m.test(sample)) {
      return { format: "flat-md", root: repoDir };
    }
  }

  if (existsSync(join(repoDir, "CLAUDE.md"))) {
    return { format: "single-md", root: repoDir };
  }

  return { format: "unknown", root: repoDir };
}

function extractFrontmatter(content: string): { name: string; description: string; body: string } {
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  const descMatch = content.match(/^description:\s*(.+)$/m);
  const body = content.replace(/^---[\s\S]*?---\n?/, "").trim();
  return {
    name: nameMatch ? nameMatch[1]!.trim() : "",
    description: descMatch ? descMatch[1]!.trim() : "",
    body,
  };
}

function installSkillFolders(sourceRoot: string, skillsDir: string, sourcePrefix: string, sourceUrl: string, license: string): number {
  let count = 0;
  const dirs = readdirSync(sourceRoot, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const d of dirs) {
    const skillMd = join(sourceRoot, d.name, "SKILL.md");
    if (!existsSync(skillMd)) continue;

    const { name, description, body } = extractFrontmatter(readFileSync(skillMd, "utf-8"));
    const finalName = name || d.name;
    const finalDesc = description;

    const destDir = join(skillsDir, `${sourcePrefix}--${d.name}`);
    mkdirSync(destDir, { recursive: true });

    if (finalName && finalDesc) {
      writeFileSync(
        join(destDir, "SKILL.md"),
        `---\nname: ${finalName}\ndescription: ${finalDesc}\nsource: community\nsource_name: ${sourcePrefix}\nattribution: |\n  Originally from ${sourceUrl}\n  License: ${license || "unknown"}\n---\n\n${body}\n`,
      );
    } else {
      cpSync(skillMd, join(destDir, "SKILL.md"));
    }

    for (const f of readdirSync(join(sourceRoot, d.name))) {
      if (f !== "SKILL.md") {
        const src = join(sourceRoot, d.name, f);
        const dest = join(destDir, f);
        try { cpSync(src, dest, { recursive: true }); } catch { /* skip */ }
      }
    }
    count++;
  }
  return count;
}

function installFlatMd(repoDir: string, skillsDir: string, sourcePrefix: string, sourceUrl: string, license: string): number {
  let count = 0;
  const subdirs = readdirSync(repoDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "integrations" && d.name !== "examples" && d.name !== "scripts" && d.name !== "node_modules");

  for (const cat of subdirs) {
    const catDir = join(repoDir, cat.name);
    const mdFiles = readdirSync(catDir).filter(
      (f) => f.endsWith(".md") && f !== "README.md" && f !== "CONTRIBUTING.md" && f !== "LICENSE",
    );

    for (const mdFile of mdFiles) {
      const content = readFileSync(join(catDir, mdFile), "utf-8");
      const { name, description, body } = extractFrontmatter(content);
      if (!name) continue;

      let slug = basename(mdFile, ".md");
      const prefixMatch = slug.match(new RegExp(`^${cat.name}-`));
      if (prefixMatch) slug = slug.slice(prefixMatch[0]!.length);
      if (!slug) continue;

      const destDir = join(skillsDir, `${sourcePrefix}--${slug}`);
      mkdirSync(destDir, { recursive: true });
      writeFileSync(
        join(destDir, "SKILL.md"),
        `---\nname: ${name}\ndescription: ${description}\nsource: community\nsource_name: ${sourcePrefix}\nattribution: |\n  Originally from ${sourceUrl}\n  License: ${license || "unknown"}\n---\n\n${body}\n`,
      );
      count++;
    }
  }
  return count;
}

export async function skillInstallCommand(
  sourceArg?: string,
  options?: { force?: boolean; path?: string },
): Promise<void> {
  const registry = getRegistry();
  const skillsDir = join(getConfigDir(), "skills");

  if (!sourceArg) {
    console.log("\n  Recommended Starter Packs");
    console.log("  ────────────────────────\n");
    console.log("  Minimal Viable Power (3 sources):");
    console.log("    npx strray-ai skill:install superpowers");
    console.log("    npx strray-ai skill:install anthropic-skills");
    console.log("    npx strray-ai skill:install ui-ux-pro-max");
    console.log("    → 80% of daily gains for most devs\n");
    console.log("  Full Pro Setup (5 sources):");
    console.log("    npx strray-ai skill:install superpowers");
    console.log("    npx strray-ai skill:install anthropic-skills");
    console.log("    npx strray-ai skill:install antigravity");
    console.log("    npx strray-ai skill:install impeccable");
    console.log("    npx strray-ai skill:install ui-ux-pro-max");
    console.log("    → The current meta for power users\n");
    console.log("  Agency / Team Mode (4 sources):");
    console.log("    npx strray-ai skill:install agency-agents");
    console.log("    npx strray-ai skill:install superpowers");
    console.log("    npx strray-ai skill:install antigravity");
    console.log("    npx strray-ai skill:install ui-ux-pro-max");
    console.log();
    console.log("  Add specialized sources as needed:");
    console.log("    Web3    → npx strray-ai skill:install ai-web3-security");
    console.log("    Vue     → npx strray-ai skill:install vuejs-nuxt");
    console.log("    Gemini  → npx strray-ai skill:install gemini-skills");
    console.log("    MiniMax → npx strray-ai skill:install minimax");
    console.log();
    console.log("  Re-install to update community skills:");
    console.log("    npx strray-ai skill:install <source-name>   # removes old, installs fresh");
    console.log();
    console.log("  Available sources:\n");
    for (const s of registry.sources) {
      const installed = existsSync(join(skillsDir, `${s.name}--`));
      console.log(`    ${s.name.padEnd(22)} [${installed ? "installed" : "available"}] ${s.license ? `(${s.license})` : ""}`);
      console.log(`    ${"".padEnd(22)} ${s.url}`);
      if (s.description) console.log(`    ${"".padEnd(22)} ${s.description}`);
      console.log();
    }
    console.log("  Usage:");
    console.log("    npx strray-ai skill:install <source-name>");
    console.log("    npx strray-ai skill:install <github-url>");
    console.log("    npx strray-ai skill:install <url> --path <subdir>");
    console.log();
    console.log("  Community skills are namespaced (e.g., agency-agents--code-review)");
    console.log("  Framework skills are never overwritten.");
    console.log("  Re-installing a source refreshes all its skills.");
    return;
  }

  const source = findSource(sourceArg);
  const url = source?.url || sourceArg;
  const license = source?.license || "unknown";
  const sourcePrefix = resolveSourcePrefix(sourceArg, source);

  mkdirSync(skillsDir, { recursive: true });

  const removed = cleanSourceSkills(skillsDir, sourcePrefix);
  if (removed > 0) {
    console.log(`  Removed ${removed} existing skills from ${sourcePrefix} (re-install)`);
  }

  const tmpDir = join(process.cwd(), ".opencode", "_tmp", "install");
  console.log(`  Downloading ${url}...`);
  const repoDir = cloneRepo(url, tmpDir);

  const searchDir = options?.path ? join(repoDir, options.path) : repoDir;
  const { format, root } = detectFormat(searchDir);

  let count = 0;
  if (format === "skill-folders") {
    count = installSkillFolders(root, skillsDir, sourcePrefix, url, license);
  } else if (format === "flat-md") {
    count = installFlatMd(root, skillsDir, sourcePrefix, url, license);
  } else if (format === "single-md") {
    console.log("  Note: This repo uses CLAUDE.md format (tool/package), not SKILL.md format.");
    console.log("  Skipping installation - consider installing via the project's native CLI.");
    count = 0;
  } else {
    console.log("  Could not detect skill format. Looking for SKILL.md folders at root...");
    count = installSkillFolders(searchDir, skillsDir, sourcePrefix, url, license);
    if (count === 0) {
      count = installFlatMd(searchDir, skillsDir, sourcePrefix, url, license);
    }
  }

  execSync(`rm -rf "${tmpDir}"`, { stdio: "pipe" });
  console.log(`  Installed ${count} skills (${format}) → .opencode/skills/${sourcePrefix}--*/`);
  if (removed > 0) {
    console.log(`  (refreshed: ${removed} removed, ${count} installed)`);
  }

  const total = readdirSync(skillsDir).filter((d) =>
    existsSync(join(skillsDir, d, "SKILL.md")),
  ).length;
  console.log(`  Total skills available: ${total}`);
}

export async function skillRegistryCommand(
  action?: string,
  args?: Record<string, string>,
): Promise<void> {
  if (!action || action === "list") {
    const registry = getRegistry();
    const localPath = getLocalRegistryPath();
    const localNames = existsSync(localPath)
      ? new Set(JSON.parse(readFileSync(localPath, "utf-8")).sources.map((s: RegistrySource) => s.name))
      : new Set<string>();

    console.log("\n  Skills Registry\n  ===============\n");
    if (registry.sources.length === 0) {
      console.log("  No sources.\n");
      return;
    }
    for (const s of registry.sources) {
      const origin = localNames.has(s.name) ? "local" : "bundled";
      console.log(`    ${s.name.padEnd(22)} [${origin}] ${s.license ? `(${s.license})` : ""}`);
      console.log(`    ${"".padEnd(22)} ${s.url}`);
      if (s.description) console.log(`    ${"".padEnd(22)} ${s.description}`);
      console.log();
    }
    return;
  }

  if (action === "add") {
    const name = args?.name;
    const url = args?.url;
    if (!name || !url) {
      console.log("\n  Usage: npx strray-ai skill:registry add --name <name> --url <url>\n");
      console.log("  Options:");
      console.log("    --name <name>          Unique source name");
      console.log("    --url <github-url>     Repository URL");
      console.log("    --desc <description>   Short description");
      console.log("    --license <license>    License (e.g. MIT, Apache-2.0)");
      return;
    }

    const localPath = getLocalRegistryPath();
    let existing = { sources: [] } as LocalRegistry;
    if (existsSync(localPath)) {
      existing = JSON.parse(readFileSync(localPath, "utf-8"));
    }

    const src: RegistrySource = {
      name,
      url,
      description: args?.desc || args?.description,
      license: args?.license,
    };

    const idx = existing.sources.findIndex((s) => s.name === name);
    if (idx >= 0) {
      existing.sources[idx] = src;
      console.log(`  Updated: ${name}`);
    } else {
      existing.sources.push(src);
      console.log(`  Added: ${name}`);
    }

    mkdirSync(dirname(localPath), { recursive: true });
    writeFileSync(localPath, JSON.stringify(existing, null, 2) + "\n");
    console.log(`  Saved to ${localPath}`);
    return;
  }

  if (action === "remove") {
    const name = args?.name || args?.["_"]?.[0];
    if (!name) {
      console.log("  Usage: npx strray-ai skill:registry remove --name <name>");
      return;
    }

    const localPath = getLocalRegistryPath();
    if (!existsSync(localPath)) {
      console.log(`  "${name}" not found in local registry.`);
      return;
    }

    const existing = JSON.parse(readFileSync(localPath, "utf-8")) as LocalRegistry;
    const idx = existing.sources.findIndex((s) => s.name === name);
    if (idx < 0) {
      console.log(`  "${name}" not found in local registry.`);
      return;
    }

    existing.sources.splice(idx, 1);
    writeFileSync(localPath, JSON.stringify(existing, null, 2) + "\n");
    console.log(`  Removed: ${name}`);
    return;
  }

  console.log(`  Unknown action: ${action}`);
  console.log("  Usage: npx strray-ai skill:registry [list|add|remove]");
}
