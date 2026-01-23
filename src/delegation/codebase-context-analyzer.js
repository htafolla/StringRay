import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../framework-logger";
export class CodebaseContextAnalyzer {
    projectRoot;
    memoryConfig;
    analysisCache = new Map();
    ignorePatterns = [
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /\.next/,
        /\.nuxt/,
        /\.vuepress/,
        /\.cache/,
        /\.temp/,
        /coverage/,
        /\.nyc_output/,
        /logs/,
        /\.DS_Store/,
        /Thumbs\.db/,
    ];
    supportedLanguages = {
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".py": "python",
        ".java": "java",
        ".cpp": "cpp",
        ".c": "c",
        ".cs": "csharp",
        ".php": "php",
        ".rb": "ruby",
        ".go": "go",
        ".rs": "rust",
        ".swift": "swift",
        ".kt": "kotlin",
        ".scala": "scala",
        ".clj": "clojure",
        ".hs": "haskell",
        ".ml": "ocaml",
        ".fs": "fsharp",
        ".elm": "elm",
        ".dart": "dart",
        ".vue": "vue",
        ".svelte": "svelte",
        ".astro": "astro",
    };
    constructor(projectRoot, memoryConfig) {
        this.projectRoot = projectRoot || process.cwd();
        // Default memory configuration for performance optimization
        this.memoryConfig = {
            maxFilesInMemory: 100, // Process max 100 files simultaneously
            maxFileSizeBytes: 1024 * 1024, // 1MB max file size to load
            enableStreaming: true, // Enable streaming for large files
            batchSize: 20, // Process 20 files per batch
            enableCaching: true, // Enable result caching
            cacheTtlMs: 5 * 60 * 1000, // 5 minute cache TTL
            enableConcurrentProcessing: true, // Enable concurrent processing
            concurrencyLimit: 10, // Max 10 concurrent file operations
            ...memoryConfig, // Override with user config
        };
    }
    /**
     * Perform comprehensive codebase analysis with memory optimization
     */
    async analyzeCodebase() {
        const jobId = `codebase-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await frameworkLogger.log("codebase-context-analyzer", "analysis-start", "info", {
            jobId,
            message: "Starting comprehensive codebase analysis",
            memoryConfig: this.memoryConfig,
        });
        const startTime = Date.now();
        const initialMemoryUsage = process.memoryUsage().heapUsed;
        try {
            const structure = await this.buildCodebaseStructure(jobId);
            const metrics = this.calculateContextMetrics(structure);
            const insights = this.generateInsights(structure, metrics);
            const recommendations = this.generateRecommendations(structure, metrics);
            const risks = this.identifyRisks(structure, metrics);
            const analysis = {
                structure,
                metrics,
                insights,
                recommendations,
                risks,
                scannedAt: new Date(),
            };
            const endTime = Date.now();
            const finalMemoryUsage = process.memoryUsage().heapUsed;
            const memoryDelta = finalMemoryUsage - initialMemoryUsage;
            await frameworkLogger.log("codebase-context-analyzer", "analysis-complete", "success", {
                jobId,
                files: structure.totalFiles,
                loc: structure.totalLinesOfCode,
                languages: Array.from(structure.languages.keys()),
                qualityScore: metrics.qualityScore,
                duration: endTime - startTime,
                memoryDeltaMB: Math.round((memoryDelta / 1024 / 1024) * 100) / 100,
                cacheHits: this.analysisCache.size,
            });
            return analysis;
        }
        catch (error) {
            const endTime = Date.now();
            const finalMemoryUsage = process.memoryUsage().heapUsed;
            await frameworkLogger.log("codebase-context-analyzer", "analysis-failed", "error", {
                jobId,
                error: error instanceof Error ? error.message : String(error),
                duration: endTime - startTime,
                finalMemoryMB: Math.round((finalMemoryUsage / 1024 / 1024) * 100) / 100,
            });
            throw error;
        }
    }
    /**
     * Get cached analysis result with intelligent invalidation
     */
    getCachedAnalysis(cacheKey) {
        if (!this.memoryConfig.enableCaching)
            return null;
        const cached = this.analysisCache.get(cacheKey);
        if (!cached)
            return null;
        // Check TTL
        if (Date.now() - cached.timestamp > this.memoryConfig.cacheTtlMs) {
            this.analysisCache.delete(cacheKey);
            return null;
        }
        // Intelligent cache validation - check if file still exists and hasn't changed
        const filePath = this.extractFilePathFromCacheKey(cacheKey);
        if (filePath) {
            try {
                const currentStats = fs.statSync(filePath);
                const cachedMtime = cached.data.lastModified?.getTime() || 0;
                if (currentStats.mtime.getTime() !== cachedMtime) {
                    // File has changed, invalidate cache
                    this.analysisCache.delete(cacheKey);
                    return null;
                }
            }
            catch (error) {
                // File no longer exists or inaccessible, remove from cache
                this.analysisCache.delete(cacheKey);
                return null;
            }
        }
        return cached.data;
    }
    /**
     * Set cached analysis result with size limits
     */
    setCachedAnalysis(cacheKey, data) {
        if (!this.memoryConfig.enableCaching)
            return;
        // Prevent cache from growing too large (keep last 1000 entries)
        if (this.analysisCache.size >= 1000) {
            const oldestKey = Array.from(this.analysisCache.keys())[0];
            if (oldestKey) {
                this.analysisCache.delete(oldestKey);
            }
        }
        this.analysisCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
        });
    }
    /**
     * Extract file path from cache key for validation
     */
    extractFilePathFromCacheKey(cacheKey) {
        const match = cacheKey.match(/^file:(.+?:\d+)$/);
        if (match && match[1]) {
            const parts = match[1].split(":");
            return parts[0] || null;
        }
        return null;
    }
    /**
     * Stream file content for large files to reduce memory usage
     */
    async streamFileContent(filePath) {
        return new Promise((resolve, reject) => {
            let content = "";
            const stream = fs.createReadStream(filePath, { encoding: "utf8" });
            stream.on("data", (chunk) => {
                content += chunk;
                // Prevent excessive memory usage during streaming
                if (content.length > this.memoryConfig.maxFileSizeBytes) {
                    stream.destroy();
                    reject(new Error("File too large for streaming"));
                }
            });
            stream.on("end", () => resolve(content));
            stream.on("error", reject);
        });
    }
    /**
     * Build complete codebase structure map with batching for memory efficiency
     */
    async buildCodebaseStructure(jobId) {
        const fileGraph = new Map();
        const modules = new Map();
        const dependencyGraph = new Map();
        const languages = new Map();
        const scanDirectory = async (dirPath, relativePath = "") => {
            try {
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                // Process files in batches to control memory usage
                const fileEntries = [];
                const dirEntries = [];
                // Separate files and directories for batch processing
                for (const entry of entries) {
                    const entryPath = path.join(dirPath, entry.name);
                    const entryRelativePath = path.join(relativePath, entry.name);
                    // Skip ignored patterns
                    if (this.ignorePatterns.some((pattern) => pattern.test(entryPath))) {
                        continue;
                    }
                    if (entry.isDirectory()) {
                        const isModule = this.isModuleDirectory(entryPath);
                        dirEntries.push({
                            path: entryPath,
                            relativePath: entryRelativePath,
                            isModule,
                        });
                    }
                    else if (entry.isFile()) {
                        fileEntries.push({
                            path: entryPath,
                            relativePath: entryRelativePath,
                        });
                    }
                }
                // Process directories first (may contain modules)
                for (const dirEntry of dirEntries) {
                    if (dirEntry.isModule) {
                        const moduleInfo = await this.analyzeModule(dirEntry.path, dirEntry.relativePath, jobId);
                        modules.set(dirEntry.relativePath, moduleInfo);
                    }
                    else {
                        await scanDirectory(dirEntry.path, dirEntry.relativePath);
                    }
                }
                // Process files with concurrent processing for better performance
                const concurrencyLimit = this.memoryConfig.enableConcurrentProcessing
                    ? Math.min(this.memoryConfig.concurrencyLimit || 10, this.memoryConfig.maxFilesInMemory)
                    : 1; // Sequential processing if concurrent disabled
                for (let i = 0; i < fileEntries.length; i += concurrencyLimit) {
                    const batch = fileEntries.slice(i, i + concurrencyLimit);
                    // Process batch concurrently with controlled parallelism
                    const batchPromises = batch.map(async ({ path: filePath, relativePath: fileRelativePath }) => {
                        try {
                            const fileInfo = await this.analyzeFile(filePath, fileRelativePath, jobId);
                            if (fileInfo) {
                                fileGraph.set(fileRelativePath, fileInfo);
                                // Update language counts
                                const lang = fileInfo.language;
                                languages.set(lang, (languages.get(lang) || 0) + 1);
                            }
                        }
                        catch (error) {
                            await frameworkLogger.log("codebase-context-analyzer", "batch-file-processing-error", "info", {
                                jobId,
                                filePath,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        }
                    });
                    await Promise.all(batchPromises);
                    // Yield control periodically to prevent blocking the event loop
                    if (i + concurrencyLimit < fileEntries.length) {
                        await new Promise((resolve) => setImmediate(resolve));
                    }
                }
            }
            catch (error) {
                await frameworkLogger.log("codebase-context-analyzer", "scan-directory-failed", "error", {
                    jobId,
                    dirPath,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        };
        await scanDirectory(this.projectRoot);
        // Build dependency relationships
        await this.buildDependencyGraph(fileGraph, dependencyGraph);
        const architecture = this.detectArchitecture(fileGraph, modules);
        return {
            rootPath: this.projectRoot,
            totalFiles: fileGraph.size,
            totalLinesOfCode: Array.from(fileGraph.values()).reduce((sum, file) => sum + file.linesOfCode, 0),
            languages,
            modules,
            fileGraph,
            dependencyGraph,
            architecture,
        };
    }
    /**
     * Analyze individual file for structure and dependencies with memory optimization
     */
    async analyzeFile(filePath, relativePath, jobId) {
        try {
            const stats = fs.statSync(filePath);
            const extension = path.extname(filePath).toLowerCase();
            const language = this.supportedLanguages[extension] || "other";
            const isSourceCode = language !== "other";
            if (!isSourceCode && !this.isConfigFile(relativePath)) {
                return null;
            }
            // Memory optimization: Check file size before loading
            if (stats.size > this.memoryConfig.maxFileSizeBytes) {
                await frameworkLogger.log("codebase-context-analyzer", "large-file-skipped", "info", {
                    jobId,
                    filePath,
                    size: stats.size,
                    maxSize: this.memoryConfig.maxFileSizeBytes,
                });
                // For large files, analyze metadata only (no content loading)
                return {
                    path: filePath,
                    relativePath,
                    size: stats.size,
                    extension,
                    language,
                    isSourceCode,
                    linesOfCode: Math.floor(stats.size / 50), // Rough estimate
                    imports: [],
                    exports: [],
                    dependencies: [],
                    lastModified: stats.mtime,
                };
            }
            // Lazy load content only when needed and within memory limits
            let content;
            let linesOfCode = 0;
            let imports = [];
            let exports = [];
            try {
                // Check cache first for performance
                const cacheKey = `file:${relativePath}:${stats.mtime.getTime()}`;
                const cached = this.getCachedAnalysis(cacheKey);
                if (cached) {
                    return {
                        path: filePath,
                        relativePath,
                        size: stats.size,
                        extension,
                        language,
                        isSourceCode,
                        linesOfCode: cached.linesOfCode,
                        imports: cached.imports,
                        exports: cached.exports,
                        dependencies: cached.imports,
                        lastModified: stats.mtime,
                        content: cached.content, // Lazy-loaded from cache
                    };
                }
                // Load content with streaming for large files if enabled
                content =
                    this.memoryConfig.enableStreaming && stats.size > 100 * 1024
                        ? await this.streamFileContent(filePath)
                        : fs.readFileSync(filePath, "utf8");
                linesOfCode = content.split("\n").length;
                const importExportData = await this.extractImportsExports(content, language, jobId);
                imports = importExportData.imports;
                exports = importExportData.exports;
                // Cache the analysis result
                if (this.memoryConfig.enableCaching) {
                    this.setCachedAnalysis(cacheKey, {
                        linesOfCode,
                        imports,
                        exports,
                        content,
                    });
                }
            }
            catch (contentError) {
                await frameworkLogger.log("codebase-context-analyzer", "content-loading-failed", "info", {
                    jobId,
                    filePath,
                    error: contentError instanceof Error
                        ? contentError.message
                        : String(contentError),
                });
                // Continue with metadata-only analysis
            }
            const result = {
                path: filePath,
                relativePath,
                size: stats.size,
                extension,
                language,
                isSourceCode,
                linesOfCode,
                imports,
                exports,
                dependencies: imports, // For now, imports are dependencies
                lastModified: stats.mtime,
            };
            // Only set content if it was successfully loaded
            if (content !== undefined) {
                result.content = content;
            }
            return result;
        }
        catch (error) {
            await frameworkLogger.log("codebase-context-analyzer", "file-analysis-failed", "error", {
                jobId,
                filePath,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    /**
     * Analyze module directory structure
     */
    async analyzeModule(dirPath, relativePath, jobId) {
        const files = [];
        const dependencies = new Set();
        const dependents = new Set();
        const scanModuleFiles = async (modulePath, moduleRelativePath) => {
            try {
                const entries = fs.readdirSync(modulePath, { withFileTypes: true });
                for (const entry of entries) {
                    const entryPath = path.join(modulePath, entry.name);
                    const entryRelativePath = path.join(moduleRelativePath, entry.name);
                    if (entry.isFile()) {
                        const fileInfo = await this.analyzeFile(entryPath, entryRelativePath, jobId);
                        if (fileInfo) {
                            files.push(fileInfo);
                            fileInfo.imports.forEach((dep) => dependencies.add(dep));
                            fileInfo.exports.forEach((exp) => dependents.add(exp));
                        }
                    }
                    else if (entry.isDirectory() &&
                        !this.ignorePatterns.some((pattern) => pattern.test(entry.name))) {
                        await scanModuleFiles(entryPath, entryRelativePath);
                    }
                }
            }
            catch (error) {
                await frameworkLogger.log("codebase-context-analyzer", "module-scan-failed", "error", {
                    jobId,
                    modulePath,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        };
        await scanModuleFiles(dirPath, relativePath);
        // Determine module type
        const moduleType = this.classifyModule(relativePath, files);
        // Find entry point
        const entryPoint = this.findEntryPoint(files);
        return {
            name: path.basename(relativePath),
            path: dirPath,
            files,
            entryPoint,
            dependencies: Array.from(dependencies),
            dependents: Array.from(dependents),
            type: moduleType,
        };
    }
    /**
     * Extract imports and exports from source code
     */
    async extractImportsExports(content, language, jobId) {
        const imports = [];
        const exports = [];
        try {
            switch (language) {
                case "typescript":
                case "javascript":
                    return this.extractJsTsImportsExports(content);
                case "python":
                    return this.extractPythonImportsExports(content);
                case "java":
                    return this.extractJavaImportsExports(content);
                default:
                    return { imports: [], exports: [] };
            }
        }
        catch (error) {
            await frameworkLogger.log("codebase-context-analyzer", "import-export-extraction-failed", "error", {
                jobId,
                language,
                error: error instanceof Error ? error.message : String(error),
            });
            return { imports: [], exports: [] };
        }
    }
    extractJsTsImportsExports(content) {
        const imports = [];
        const exports = [];
        // Import patterns
        const importPatterns = [
            /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
            /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        ];
        importPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1]) {
                    imports.push(match[1]);
                }
            }
        });
        // Export patterns
        const exportPatterns = [
            /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g,
            /export\s+{\s*([^}]+)\s*}/g,
            /export\s+default/g,
        ];
        exportPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1]) {
                    const exportsList = match[1]
                        .split(",")
                        .map((e) => {
                        const trimmed = e.trim();
                        const asSplit = trimmed.split(" as ");
                        return asSplit[0] || trimmed;
                    })
                        .filter(Boolean);
                    exports.push(...exportsList);
                }
                else {
                    exports.push("default");
                }
            }
        });
        return {
            imports: Array.from(new Set(imports)),
            exports: Array.from(new Set(exports)),
        };
    }
    extractPythonImportsExports(content) {
        const imports = [];
        const exports = [];
        // Import patterns
        const importPatterns = [/from\s+([^\s]+)\s+import/g, /import\s+([^\s]+)/g];
        importPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1]) {
                    imports.push(match[1]);
                }
            }
        });
        // Export patterns (Python doesn't have explicit exports, but __all__ can indicate public API)
        const allMatch = content.match(/__all__\s*=\s*\[([^\]]+)\]/);
        if (allMatch && allMatch[1]) {
            const exportsList = allMatch[1]
                .split(",")
                .map((e) => e.trim().replace(/['"]/g, ""))
                .filter(Boolean);
            exports.push(...exportsList);
        }
        return {
            imports: Array.from(new Set(imports)),
            exports: Array.from(new Set(exports)),
        };
    }
    extractJavaImportsExports(content) {
        const imports = [];
        const exports = [];
        // Import patterns
        const importPattern = /^import\s+([^;]+);/gm;
        let match;
        while ((match = importPattern.exec(content)) !== null) {
            if (match[1]) {
                imports.push(match[1]);
            }
        }
        // Export patterns (public classes/interfaces)
        const exportPattern = /(?:public\s+)?(?:class|interface|enum)\s+(\w+)/g;
        while ((match = exportPattern.exec(content)) !== null) {
            if (match[1]) {
                exports.push(match[1]);
            }
        }
        return {
            imports: Array.from(new Set(imports)),
            exports: Array.from(new Set(exports)),
        };
    }
    /**
     * Build dependency graph between files
     */
    async buildDependencyGraph(fileGraph, dependencyGraph) {
        for (const [filePath, fileInfo] of Array.from(fileGraph)) {
            const dependencies = new Set();
            for (const importPath of fileInfo.imports) {
                // Resolve relative imports
                if (importPath.startsWith("./") || importPath.startsWith("../")) {
                    try {
                        const resolvedPath = path.resolve(path.dirname(fileInfo.path), importPath);
                        const resolvedRelative = path.relative(this.projectRoot, resolvedPath);
                        // Check for file extensions
                        const possibleExtensions = [
                            "",
                            ".ts",
                            ".tsx",
                            ".js",
                            ".jsx",
                            ".py",
                            ".java",
                        ];
                        let foundFile = null;
                        for (const ext of possibleExtensions) {
                            const testPath = resolvedRelative + ext;
                            if (fileGraph.has(testPath) ||
                                fs.existsSync(path.join(this.projectRoot, testPath))) {
                                foundFile = testPath;
                                break;
                            }
                        }
                        if (foundFile) {
                            dependencies.add(foundFile);
                        }
                    }
                    catch (error) {
                        // Import resolution failed, skip
                    }
                }
                else {
                    // External dependency, add to graph for tracking
                    dependencies.add(importPath);
                }
            }
            dependencyGraph.set(filePath, dependencies);
        }
    }
    /**
     * Detect architectural patterns and framework usage
     */
    detectArchitecture(fileGraph, modules) {
        const frameworks = [];
        const patterns = [];
        let structure = "monolithic";
        const entryPoints = [];
        // Framework detection
        if (this.hasFramework(fileGraph, "react"))
            frameworks.push("React");
        if (this.hasFramework(fileGraph, "vue"))
            frameworks.push("Vue.js");
        if (this.hasFramework(fileGraph, "angular"))
            frameworks.push("Angular");
        if (this.hasFramework(fileGraph, "svelte"))
            frameworks.push("Svelte");
        if (this.hasFramework(fileGraph, "express"))
            frameworks.push("Express.js");
        if (this.hasFramework(fileGraph, "nestjs"))
            frameworks.push("NestJS");
        if (this.hasFramework(fileGraph, "nextjs"))
            frameworks.push("Next.js");
        if (this.hasFramework(fileGraph, "nuxt"))
            frameworks.push("Nuxt.js");
        // Pattern detection
        if (this.detectMVCPattern(fileGraph))
            patterns.push("MVC");
        if (this.detectRepositoryPattern(fileGraph))
            patterns.push("Repository");
        if (this.detectObserverPattern(fileGraph))
            patterns.push("Observer");
        if (this.detectFactoryPattern(fileGraph))
            patterns.push("Factory");
        // Structure detection
        if (modules.size > 5 && this.hasMicroservicesIndicators(fileGraph)) {
            structure = "microservices";
        }
        else if (modules.size > 0) {
            structure = "modular";
        }
        // Entry points detection
        for (const [filePath, fileInfo] of Array.from(fileGraph)) {
            if (this.isEntryPoint(filePath, fileInfo)) {
                entryPoints.push(filePath);
            }
        }
        return {
            framework: frameworks,
            patterns,
            structure,
            entryPoints,
        };
    }
    /**
     * Calculate comprehensive context metrics
     */
    calculateContextMetrics(structure) {
        const fileCount = structure.totalFiles;
        const linesOfCode = structure.totalLinesOfCode;
        const languages = Array.from(structure.languages.keys());
        // Calculate complexity based on various factors
        const complexity = this.calculateComplexityScore(structure);
        // Calculate coupling (interdependencies)
        const coupling = this.calculateCouplingScore(structure);
        // Calculate cohesion (internal dependencies within modules)
        const cohesion = this.calculateCohesionScore(structure);
        // Estimate test coverage (rough heuristic)
        const testCoverage = this.estimateTestCoverage(structure);
        // Architectural patterns
        const architecturalPatterns = structure.architecture.patterns;
        // Overall quality score
        const qualityScore = this.calculateQualityScore({
            fileCount,
            linesOfCode,
            complexity,
            coupling,
            cohesion,
            testCoverage,
            patterns: architecturalPatterns.length,
        });
        return {
            fileCount,
            linesOfCode,
            languages,
            complexity,
            coupling,
            cohesion,
            testCoverage,
            architecturalPatterns,
            qualityScore,
        };
    }
    calculateComplexityScore(structure) {
        let score = 0;
        // File count factor
        score += Math.min(structure.totalFiles / 10, 20);
        // Language diversity factor
        score += Math.min(structure.languages.size * 5, 15);
        // Module complexity
        score += Math.min(structure.modules.size * 2, 20);
        // Dependency complexity
        const totalDeps = Array.from(structure.dependencyGraph.values()).reduce((sum, deps) => sum + deps.size, 0);
        score += Math.min(totalDeps / 20, 25);
        // Framework complexity
        score += Math.min(structure.architecture.framework.length * 10, 20);
        return Math.min(Math.max(score, 0), 100);
    }
    calculateCouplingScore(structure) {
        const totalDeps = Array.from(structure.dependencyGraph.values()).reduce((sum, deps) => sum + deps.size, 0);
        const avgDeps = totalDeps / structure.totalFiles;
        // Normalize to 0-100 scale (higher coupling = higher score)
        return Math.min(avgDeps * 20, 100);
    }
    calculateCohesionScore(structure) {
        let totalCohesion = 0;
        let moduleCount = 0;
        for (const module of Array.from(structure.modules.values())) {
            if (module.files.length > 1) {
                // Calculate internal dependencies within module
                const internalDeps = module.files.reduce((sum, file) => {
                    const fileDeps = structure.dependencyGraph.get(file.relativePath) || new Set();
                    const internalCount = Array.from(fileDeps).filter((dep) => module.files.some((f) => f.relativePath === dep)).length;
                    return sum + internalCount;
                }, 0);
                const cohesion = internalDeps / (module.files.length * (module.files.length - 1));
                totalCohesion += Math.min(cohesion, 1);
                moduleCount++;
            }
        }
        return moduleCount > 0 ? (totalCohesion / moduleCount) * 100 : 50;
    }
    estimateTestCoverage(structure) {
        const testFiles = Array.from(structure.fileGraph.values()).filter((file) => file.relativePath.includes("test") ||
            file.relativePath.includes("spec")).length;
        const srcFiles = Array.from(structure.fileGraph.values()).filter((file) => file.isSourceCode &&
            !file.relativePath.includes("test") &&
            !file.relativePath.includes("spec")).length;
        if (srcFiles === 0)
            return 0;
        // Rough heuristic: assume 1 test file covers 3-5 source files
        const estimatedCoverage = Math.min(((testFiles * 4) / srcFiles) * 100, 100);
        return Math.round(estimatedCoverage);
    }
    calculateQualityScore(metrics) {
        // Weighted scoring system
        const weights = {
            complexity: -0.2, // Lower complexity is better
            coupling: -0.25, // Lower coupling is better
            cohesion: 0.2, // Higher cohesion is better
            testCoverage: 0.25, // Higher coverage is better
            patterns: 0.1, // More patterns is better
        };
        let score = 50; // Base score
        score += weights.complexity * Math.min(metrics.complexity, 50);
        score += weights.coupling * (100 - metrics.coupling);
        score += weights.cohesion * metrics.cohesion;
        score += weights.testCoverage * metrics.testCoverage;
        score += weights.patterns * Math.min(metrics.patterns * 10, 20);
        return Math.min(Math.max(Math.round(score), 0), 100);
    }
    /**
     * Generate insights based on analysis
     */
    generateInsights(structure, metrics) {
        const insights = [];
        // Size insights
        if (structure.totalFiles > 1000) {
            insights.push(`Large codebase with ${structure.totalFiles} files - consider modularization`);
        }
        else if (structure.totalFiles < 10) {
            insights.push("Small codebase - good candidate for rapid development");
        }
        // Language insights
        if (structure.languages.size > 3) {
            insights.push(`Polyglot codebase with ${structure.languages.size} languages`);
        }
        else if (structure.languages.size === 1) {
            insights.push("Single-language codebase - easier maintenance but potential skill limitations");
        }
        // Architecture insights
        if (structure.architecture.framework.length > 0) {
            insights.push(`Uses ${structure.architecture.framework.join(", ")} framework(s)`);
        }
        if (structure.architecture.patterns.length > 0) {
            insights.push(`Follows ${structure.architecture.patterns.join(", ")} architectural pattern(s)`);
        }
        // Quality insights
        if (metrics.qualityScore > 80) {
            insights.push("High-quality codebase with strong architectural foundations");
        }
        else if (metrics.qualityScore < 40) {
            insights.push("Codebase may benefit from refactoring and quality improvements");
        }
        if (metrics.testCoverage > 80) {
            insights.push("Excellent test coverage provides strong confidence in changes");
        }
        else if (metrics.testCoverage < 20) {
            insights.push("Low test coverage increases risk of undetected regressions");
        }
        return insights;
    }
    /**
     * Generate recommendations for improvement
     */
    generateRecommendations(structure, metrics) {
        const recommendations = [];
        if (metrics.testCoverage < 70) {
            recommendations.push("Increase test coverage to reduce regression risk");
        }
        if (metrics.coupling > 70) {
            recommendations.push("Reduce coupling through better separation of concerns");
        }
        if (metrics.cohesion < 30) {
            recommendations.push("Improve cohesion by grouping related functionality");
        }
        if (structure.modules.size === 0 && structure.totalFiles > 50) {
            recommendations.push("Consider modularizing the codebase for better maintainability");
        }
        if (structure.architecture.framework.length === 0 &&
            structure.totalFiles > 20) {
            recommendations.push("Consider adopting a framework to standardize development patterns");
        }
        if (metrics.complexity > 80) {
            recommendations.push("Consider breaking down complex components into smaller, focused units");
        }
        return recommendations;
    }
    /**
     * Identify potential risks and issues
     */
    identifyRisks(structure, metrics) {
        const risks = [];
        if (metrics.coupling > 80) {
            risks.push("High coupling increases change risk and maintenance complexity");
        }
        if (metrics.testCoverage < 30) {
            risks.push("Low test coverage poses significant risk for safe refactoring");
        }
        if (structure.dependencyGraph.size > 0) {
            // Check for circular dependencies (simplified check)
            const circularDeps = this.detectCircularDependencies(structure.dependencyGraph);
            if (circularDeps.length > 0) {
                risks.push(`${circularDeps.length} potential circular dependencies detected`);
            }
        }
        if (structure.languages.size > 5) {
            risks.push("High language diversity may complicate team composition and maintenance");
        }
        if (metrics.complexity > 90) {
            risks.push("Very high complexity indicates potential maintainability issues");
        }
        return risks;
    }
    // Helper methods
    isModuleDirectory(dirPath) {
        try {
            const entries = fs.readdirSync(dirPath);
            return (entries.some((entry) => {
                const ext = path.extname(entry);
                return this.supportedLanguages[ext];
            }) &&
                entries.some((entry) => entry === "package.json" ||
                    entry === "index.ts" ||
                    entry === "index.js"));
        }
        catch {
            return false;
        }
    }
    isConfigFile(filePath) {
        const configPatterns = [
            /package\.json$/,
            /tsconfig\.json$/,
            /webpack\.config\./,
            /\.eslintrc/,
            /\.prettierrc/,
            /Dockerfile/,
            /docker-compose\.yml/,
            /\.env/,
        ];
        return configPatterns.some((pattern) => pattern.test(filePath));
    }
    classifyModule(relativePath, files) {
        if (relativePath.includes("test") || relativePath.includes("spec")) {
            return "test";
        }
        if (relativePath.includes("docs") ||
            files.some((f) => f.extension === ".md")) {
            return "docs";
        }
        if (files.some((f) => ["package.json", "Dockerfile", "docker-compose.yml"].includes(path.basename(f.relativePath)))) {
            return "infrastructure";
        }
        if (files.some((f) => f.relativePath.includes("config") || f.relativePath.includes(".env"))) {
            return "config";
        }
        return "source";
    }
    findEntryPoint(files) {
        const entryCandidates = [
            "index.ts",
            "index.js",
            "main.ts",
            "main.js",
            "app.ts",
            "app.js",
        ];
        for (const candidate of entryCandidates) {
            const file = files.find((f) => path.basename(f.relativePath) === candidate);
            if (file)
                return file.relativePath;
        }
        // Fallback to first source file
        const sourceFile = files.find((f) => f.isSourceCode);
        return sourceFile?.relativePath;
    }
    hasFramework(fileGraph, framework) {
        for (const file of Array.from(fileGraph.values())) {
            if (file.content?.toLowerCase().includes(framework.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    detectMVCPattern(fileGraph) {
        const hasControllers = Array.from(fileGraph.keys()).some((path) => path.includes("controller"));
        const hasModels = Array.from(fileGraph.keys()).some((path) => path.includes("model"));
        const hasViews = Array.from(fileGraph.keys()).some((path) => path.includes("view"));
        return hasControllers && hasModels && hasViews;
    }
    detectRepositoryPattern(fileGraph) {
        return Array.from(fileGraph.keys()).some((path) => path.includes("repository"));
    }
    detectObserverPattern(fileGraph) {
        return Array.from(fileGraph.values()).some((file) => file.content?.includes("subscribe") ||
            file.content?.includes("observe"));
    }
    detectFactoryPattern(fileGraph) {
        return Array.from(fileGraph.keys()).some((path) => path.includes("factory"));
    }
    hasMicroservicesIndicators(fileGraph) {
        return Array.from(fileGraph.keys()).some((path) => path.includes("docker") ||
            path.includes("kubernetes") ||
            path.includes("service"));
    }
    isEntryPoint(filePath, fileInfo) {
        const entryIndicators = [
            "index.ts",
            "index.js",
            "main.ts",
            "main.js",
            "app.ts",
            "app.js",
            "server.ts",
            "server.js",
            "cli.ts",
            "cli.js",
        ];
        return (entryIndicators.includes(path.basename(filePath)) ||
            Boolean(fileInfo.content?.includes("#!/usr/bin/env")) ||
            Boolean(fileInfo.content?.includes("process.argv")));
    }
    detectCircularDependencies(dependencyGraph) {
        const circularDeps = [];
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (node) => {
            visited.add(node);
            recursionStack.add(node);
            const dependencies = dependencyGraph.get(node) || new Set();
            for (const dep of Array.from(dependencies)) {
                if (!visited.has(dep)) {
                    if (dfs(dep)) {
                        circularDeps.push(`${node} -> ${dep}`);
                        return true;
                    }
                }
                else if (recursionStack.has(dep)) {
                    circularDeps.push(`${node} -> ${dep}`);
                    return true;
                }
            }
            recursionStack.delete(node);
            return false;
        };
        for (const node of Array.from(dependencyGraph.keys())) {
            if (!visited.has(node)) {
                dfs(node);
            }
        }
        return circularDeps;
    }
}
// Export factory function for optimized analyzers
export const createCodebaseContextAnalyzer = (projectRoot, memoryConfig) => {
    return new CodebaseContextAnalyzer(projectRoot, memoryConfig);
};
//# sourceMappingURL=codebase-context-analyzer.js.map