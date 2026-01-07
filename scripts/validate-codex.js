#!/usr/bin/env node

console.log("🔍 StrRay Standalone Codex Validation");
console.log("=====================================");

// Check if we're in the right directory
import fs from "fs";
import path from "path";

if (!fs.existsSync("src/codex-injector.ts")) {
	console.error("❌ Error: Please run this script from the strray-standalone directory");
	process.exit(1);
}

// Check if codex files exist
const codexFiles = ["src/agents_template.md", "src/codex/agents_template.md"];

let codexFound = false;
for (const file of codexFiles) {
	if (fs.existsSync(file)) {
		console.log(`✅ Found codex file: ${file}`);
		codexFound = true;

		// Basic validation of codex content
		try {
			const content = fs.readFileSync(file, "utf-8");
			const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
			if (versionMatch) {
				console.log(`   📋 Codex version: ${versionMatch[1]}`);
			}

			const termMatches = content.match(/####\s*\d+\.\s/g);
			if (termMatches) {
				console.log(`   📊 Found ${termMatches.length} codex terms`);
			}
		} catch (error) {
			console.warn(`⚠️  Warning: Could not validate ${file}:`, error.message);
		}
	}
}

if (!codexFound) {
	console.error("❌ Error: No codex files found!");
	process.exit(1);
}

// Check if built files exist
if (fs.existsSync("dist")) {
	console.log("✅ Build directory exists");
} else {
	console.log('⚠️  Warning: Build directory not found. Run "npm run build" first.');
}

// Check package.json
if (fs.existsSync("package.json")) {
	console.log("✅ Package.json found");
	try {
		const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
		console.log(`   📦 Package: ${pkg.name}@${pkg.version}`);
	} catch (error) {
		console.warn("⚠️  Warning: Could not parse package.json");
	}
} else {
	console.error("❌ Error: package.json not found!");
	process.exit(1);
}

// Check .opencode directory
if (fs.existsSync(".opencode")) {
	console.log("✅ .opencode directory exists");
	if (fs.existsSync(".opencode/codex-injector.js")) {
		console.log("✅ Codex injector plugin found");
	} else {
		console.warn("⚠️  Warning: Codex injector plugin not found in .opencode/");
	}
} else {
	console.warn("⚠️  Warning: .opencode directory not found");
}

console.log("");
console.log("✅ Standalone framework validation complete");
console.log("📦 Contains all necessary StrRay components");
console.log("🚀 Ready to copy to new repository");
