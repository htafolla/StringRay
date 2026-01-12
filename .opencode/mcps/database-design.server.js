/**
 * StrRay Database Design MCP Server
 *
 * Knowledge skill for database architecture, schema optimization,
 * query performance analysis, and data modeling best practices
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
class StrRayDatabaseDesignServer {
    server;
    constructor() {
        this.server = new Server({
            name: "strray-database-design",
            version: "1.0.0",
        });
        this.setupToolHandlers();
        console.log("StrRay Database Design MCP Server initialized");
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "analyze_schema",
                        description: "Analyze database schema for optimization opportunities and best practices",
                        inputSchema: {
                            type: "object",
                            properties: {
                                schemaFile: {
                                    type: "string",
                                    description: "Path to schema definition file (SQL, migration, or ORM model)",
                                },
                                databaseType: {
                                    type: "string",
                                    enum: ["postgresql", "mysql", "sqlite", "mongodb", "redis"],
                                    description: "Database type for specific optimizations",
                                },
                                includeIndexes: {
                                    type: "boolean",
                                    description: "Include index recommendations in analysis",
                                    default: true,
                                },
                            },
                            required: ["schemaFile"],
                        },
                    },
                    {
                        name: "optimize_query",
                        description: "Analyze and optimize SQL queries for better performance",
                        inputSchema: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "SQL query to analyze and optimize",
                                },
                                schemaContext: {
                                    type: "string",
                                    description: "Schema context or file path for better analysis",
                                },
                                databaseType: {
                                    type: "string",
                                    enum: ["postgresql", "mysql", "sqlite"],
                                    description: "Database type for query optimization",
                                },
                            },
                            required: ["query"],
                        },
                    },
                    {
                        name: "design_data_model",
                        description: "Design optimal data model for given requirements",
                        inputSchema: {
                            type: "object",
                            properties: {
                                requirements: {
                                    type: "string",
                                    description: "Business requirements and data access patterns",
                                },
                                entities: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "List of main entities/business objects",
                                },
                                relationships: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            from: { type: "string" },
                                            to: { type: "string" },
                                            type: {
                                                type: "string",
                                                enum: ["one-to-one", "one-to-many", "many-to-many"],
                                            },
                                        },
                                    },
                                    description: "Entity relationships",
                                },
                                databaseType: {
                                    type: "string",
                                    enum: ["postgresql", "mysql", "mongodb", "redis"],
                                    description: "Target database type",
                                },
                            },
                            required: ["requirements", "entities"],
                        },
                    },
                    {
                        name: "migrate_schema",
                        description: "Generate migration scripts for schema changes",
                        inputSchema: {
                            type: "object",
                            properties: {
                                currentSchema: {
                                    type: "string",
                                    description: "Current schema definition",
                                },
                                targetSchema: {
                                    type: "string",
                                    description: "Target schema definition",
                                },
                                databaseType: {
                                    type: "string",
                                    enum: ["postgresql", "mysql", "sqlite"],
                                    description: "Database type for migration",
                                },
                                safeMode: {
                                    type: "boolean",
                                    description: "Generate rollback scripts and safety checks",
                                    default: true,
                                },
                            },
                            required: ["currentSchema", "targetSchema"],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case "analyze_schema":
                    return await this.analyzeSchema(args);
                case "optimize_query":
                    return await this.optimizeQuery(args);
                case "design_data_model":
                    return await this.designDataModel(args);
                case "migrate_schema":
                    return await this.migrateSchema(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    async analyzeSchema(args) {
        const { schemaFile, databaseType = "postgresql", includeIndexes = true, } = args;
        try {
            if (!fs.existsSync(schemaFile)) {
                throw new Error(`Schema file not found: ${schemaFile}`);
            }
            const content = fs.readFileSync(schemaFile, "utf-8");
            const extension = path.extname(schemaFile).toLowerCase();
            const schema = this.parseSchema(content, extension, databaseType);
            const analysis = this.analyzeSchemaDesign(schema, databaseType);
            if (includeIndexes) {
                analysis.indexes = this.generateIndexRecommendations(schema, databaseType);
            }
            const issues = this.identifySchemaIssues(schema, databaseType);
            const recommendations = this.generateSchemaRecommendations(issues, schema, databaseType);
            return {
                content: [
                    {
                        type: "text",
                        text: `Database Schema Analysis for ${schemaFile}:\n\n` +
                            `📊 SCHEMA OVERVIEW\n` +
                            `Database Type: ${databaseType.toUpperCase()}\n` +
                            `Tables: ${schema.tables.length}\n` +
                            `Relationships: ${schema.relationships.length}\n` +
                            `Constraints: ${schema.constraints.length}\n` +
                            (includeIndexes
                                ? `Index Recommendations: ${analysis.indexes.length}\n\n`
                                : "\n") +
                            `🔍 KEY FINDINGS\n${issues
                                .slice(0, 5)
                                .map((issue) => `${this.getIssueSeverityIcon(issue.severity)} ${issue.table ? `${issue.table}.` : ""}${issue.column || "Schema"}: ${issue.description}`)
                                .join("\n")}\n\n` +
                            `💡 OPTIMIZATION RECOMMENDATIONS\n${recommendations
                                .slice(0, 5)
                                .map((rec, i) => `${i + 1}. ${rec}`)
                                .join("\n")}\n\n` +
                            `📈 PERFORMANCE METRICS\n` +
                            `Normalization Score: ${this.calculateNormalizationScore(schema)}/100\n` +
                            `Indexing Coverage: ${this.calculateIndexingCoverage(analysis.indexes, schema)}%\n` +
                            `Relationship Complexity: ${this.assessRelationshipComplexity(schema.relationships)}`,
                    },
                ],
                data: { schema, analysis, issues, recommendations },
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error analyzing schema: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async optimizeQuery(args) {
        const { query, schemaContext, databaseType = "postgresql" } = args;
        try {
            const analysis = this.analyzeQuery(query, databaseType);
            // Load schema context if provided
            let schema = null;
            if (schemaContext) {
                try {
                    if (fs.existsSync(schemaContext)) {
                        const schemaContent = fs.readFileSync(schemaContext, "utf-8");
                        const extension = path.extname(schemaContext).toLowerCase();
                        schema = this.parseSchema(schemaContent, extension, databaseType);
                    }
                }
                catch (e) {
                    // Schema context loading failed, continue without it
                }
            }
            const optimizations = this.generateQueryOptimizations(analysis, schema, databaseType);
            const performanceScore = this.calculateQueryPerformanceScore(analysis, optimizations);
            return {
                content: [
                    {
                        type: "text",
                        text: `Query Optimization Analysis:\n\n` +
                            `🔍 QUERY ANALYSIS\n` +
                            `Database: ${databaseType.toUpperCase()}\n` +
                            `Tables Involved: ${analysis.tables.join(", ") || "None identified"}\n` +
                            `Operations: ${analysis.operations.join(", ") || "None identified"}\n` +
                            `Estimated Cost: ${analysis.estimatedCost}\n\n` +
                            `📊 PERFORMANCE SCORE: ${performanceScore}/100\n\n` +
                            `⚡ OPTIMIZATION OPPORTUNITIES\n${optimizations
                                .slice(0, 5)
                                .map((opt, i) => `${i + 1}. ${opt}`)
                                .join("\n")}\n\n` +
                            `🔧 RECOMMENDED IMPROVEMENTS\n${analysis.recommendations
                                .slice(0, 3)
                                .map((rec, i) => `${i + 1}. ${rec}`)
                                .join("\n")}`,
                    },
                ],
                data: { analysis, optimizations, performanceScore },
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error optimizing query: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async designDataModel(args) {
        const { requirements, entities, relationships = [], databaseType = "postgresql", } = args;
        try {
            const model = this.generateDataModel(requirements, entities, relationships, databaseType);
            const validation = this.validateDataModel(model, databaseType);
            const recommendations = this.generateModelRecommendations(model, validation);
            return {
                content: [
                    {
                        type: "text",
                        text: `Data Model Design for ${databaseType.toUpperCase()}:\n\n` +
                            `📋 REQUIREMENTS SUMMARY\n${requirements.substring(0, 200)}${requirements.length > 200 ? "..." : ""}\n\n` +
                            `🏗️ PROPOSED DATA MODEL\n` +
                            `Entities: ${model.tables.length}\n` +
                            `Relationships: ${model.relationships.length}\n` +
                            `Indexes: ${model.indexes.length}\n\n` +
                            `📊 TABLES\n${model.tables
                                .map((table) => `• ${table.name} (${table.columns.length} columns, ~${table.estimatedRows} rows)`)
                                .join("\n")}\n\n` +
                            `🔗 RELATIONSHIPS\n${model.relationships
                                .map((rel) => `• ${rel.fromTable} → ${rel.toTable} (${rel.type})`)
                                .join("\n")}\n\n` +
                            `💡 DESIGN RECOMMENDATIONS\n${recommendations
                                .slice(0, 5)
                                .map((rec, i) => `${i + 1}. ${rec}`)
                                .join("\n")}`,
                    },
                ],
                data: { model, validation, recommendations },
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error designing data model: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async migrateSchema(args) {
        const { currentSchema, targetSchema, databaseType = "postgresql", safeMode = true, } = args;
        try {
            const current = this.parseSchemaString(currentSchema, databaseType);
            const target = this.parseSchemaString(targetSchema, databaseType);
            const changes = this.compareSchemas(current, target);
            const migrationScript = this.generateMigrationScript(changes, databaseType, safeMode);
            const rollbackScript = safeMode
                ? this.generateRollbackScript(changes, databaseType)
                : null;
            return {
                content: [
                    {
                        type: "text",
                        text: `Schema Migration Script (${databaseType.toUpperCase()}):\n\n` +
                            `📊 CHANGES DETECTED\n` +
                            `Tables to Add: ${changes.addTables.length}\n` +
                            `Tables to Drop: ${changes.dropTables.length}\n` +
                            `Columns to Add: ${changes.addColumns.length}\n` +
                            `Columns to Modify: ${changes.modifyColumns.length}\n` +
                            `Indexes to Add: ${changes.addIndexes.length}\n\n` +
                            `🔄 MIGRATION SCRIPT\n\`\`\`sql\n${migrationScript}\n\`\`\`\n\n` +
                            (rollbackScript
                                ? `↩️ ROLLBACK SCRIPT\n\`\`\`sql\n${rollbackScript}\n\`\`\`\n\n`
                                : "") +
                            `⚠️ SAFETY NOTES\n` +
                            `• Always backup data before running migrations\n` +
                            `• Test migrations on staging environment first\n` +
                            `• Review generated scripts carefully\n` +
                            (changes.hasDataLoss
                                ? `• ⚠️ This migration may result in data loss!\n`
                                : ""),
                    },
                ],
                data: {
                    changes,
                    migrationScript,
                    rollbackScript,
                    hasDataLoss: changes.hasDataLoss,
                },
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error generating migration: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    parseSchema(content, extension, databaseType) {
        // Simplified schema parsing - in production this would be more sophisticated
        const tables = [];
        const relationships = [];
        if (extension === ".sql") {
            // Parse SQL CREATE TABLE statements
            const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
            let match;
            while ((match = createTableRegex.exec(content)) !== null) {
                const tableName = match[1];
                const tableContent = match[2];
                if (!tableName || !tableContent)
                    continue;
                const columns = this.parseTableColumns(tableContent, databaseType);
                const primaryKey = this.extractPrimaryKey(tableContent);
                tables.push({
                    name: tableName,
                    columns,
                    primaryKey,
                    estimatedRows: 1000, // Default estimate
                    accessPatterns: [],
                });
            }
            // Extract foreign keys for relationships
            relationships.push(...this.extractRelationships(content, databaseType));
        }
        return {
            tables,
            relationships,
            indexes: [],
            constraints: [],
        };
    }
    parseSchemaString(schemaString, databaseType) {
        return this.parseSchema(schemaString, ".sql", databaseType);
    }
    parseTableColumns(tableContent, databaseType) {
        const columns = [];
        const columnRegex = /(\w+)\s+([A-Z]+(?:\([^)]*\))?)(?:\s+(NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|REFERENCES\s+\w+\([^)]*\)))*/gi;
        let match;
        while ((match = columnRegex.exec(tableContent)) !== null) {
            const [, name, type, constraints] = match;
            if (name && type) {
                columns.push({
                    name,
                    type,
                    nullable: !constraints || !constraints.includes("NOT NULL"),
                    constraints: constraints
                        ? constraints.split(/\s+/).filter((c) => c)
                        : [],
                    usage: constraints && constraints.includes("PRIMARY KEY")
                        ? "primary"
                        : constraints && constraints.includes("REFERENCES")
                            ? "foreign"
                            : "data",
                });
            }
        }
        return columns;
    }
    extractPrimaryKey(tableContent) {
        const pkRegex = /PRIMARY\s+KEY\s*\(([^)]+)\)/i;
        const match = pkRegex.exec(tableContent);
        return match && match[1]
            ? match[1].split(",").map((col) => col.trim())
            : [];
    }
    extractRelationships(content, databaseType) {
        const relationships = [];
        const fkRegex = /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/gi;
        let match;
        while ((match = fkRegex.exec(content)) !== null) {
            const [, fromCol, toTable, toCol] = match;
            if (fromCol && toTable && toCol) {
                relationships.push({
                    fromTable: "", // Would need table context
                    toTable,
                    fromColumn: fromCol,
                    toColumn: toCol,
                    type: "one-to-many", // Default assumption
                    cardinality: "1:N",
                });
            }
        }
        return relationships;
    }
    analyzeSchemaDesign(schema, databaseType) {
        return {
            normalizationLevel: this.assessNormalization(schema),
            indexingStrategy: this.evaluateIndexing(schema),
            relationshipComplexity: this.assessRelationshipComplexity(schema.relationships),
            performanceConsiderations: this.identifyPerformanceIssues(schema, databaseType),
        };
    }
    assessNormalization(schema) {
        // Simplified normalization assessment
        let score = 100;
        // Check for repeating groups (denormalization)
        schema.tables.forEach((table) => {
            const dataColumns = table.columns.filter((col) => col.usage === "data");
            if (dataColumns.length > 15) {
                score -= 20; // Too many columns in one table
            }
        });
        return Math.max(0, score);
    }
    evaluateIndexing(schema) {
        const tablesWithIndexes = schema.tables.filter((table) => table.columns.some((col) => col.usage === "primary" || col.usage === "foreign")).length;
        const indexCoverage = (tablesWithIndexes / schema.tables.length) * 100;
        return `${indexCoverage.toFixed(1)}% of tables have indexed relationships`;
    }
    assessRelationshipComplexity(relationships) {
        const complexity = relationships.length;
        if (complexity < 5)
            return "Simple";
        if (complexity < 15)
            return "Moderate";
        return "Complex - Consider denormalization or CQRS";
    }
    identifyPerformanceIssues(schema, databaseType) {
        const issues = [];
        schema.tables.forEach((table) => {
            if (table.columns.length > 50) {
                issues.push(`${table.name} has ${table.columns.length} columns - consider vertical partitioning`);
            }
            const textColumns = table.columns.filter((col) => col.type.toLowerCase().includes("text") ||
                col.type.toLowerCase().includes("varchar"));
            if (textColumns.length > 5) {
                issues.push(`${table.name} has ${textColumns.length} text columns - monitor for performance`);
            }
        });
        return issues;
    }
    generateIndexRecommendations(schema, databaseType) {
        const recommendations = [];
        schema.relationships.forEach((rel) => {
            recommendations.push({
                table: rel.fromTable,
                columns: [rel.fromColumn],
                type: "btree",
                reason: `Foreign key relationship to ${rel.toTable}`,
                impact: "high",
            });
        });
        // Add recommendations for common query patterns
        schema.tables.forEach((table) => {
            const indexedColumns = table.columns.filter((col) => col.usage === "primary" || col.usage === "foreign");
            // Recommend composite indexes for common patterns
            if (indexedColumns.length > 1) {
                recommendations.push({
                    table: table.name,
                    columns: indexedColumns.map((col) => col.name),
                    type: "btree",
                    reason: "Composite index for primary/foreign key queries",
                    impact: "medium",
                });
            }
        });
        return recommendations;
    }
    identifySchemaIssues(schema, databaseType) {
        const issues = [];
        schema.tables.forEach((table) => {
            // Check for missing primary keys
            if (table.primaryKey.length === 0) {
                issues.push({
                    table: table.name,
                    column: null,
                    description: "Table missing primary key",
                    severity: "error",
                });
            }
            // Check for nullable foreign keys
            table.columns.forEach((col) => {
                if (col.usage === "foreign" && col.nullable) {
                    issues.push({
                        table: table.name,
                        column: col.name,
                        description: "Foreign key column allows NULL values",
                        severity: "warning",
                    });
                }
            });
            // Check for tables with too many columns
            if (table.columns.length > 30) {
                issues.push({
                    table: table.name,
                    column: null,
                    description: `Table has ${table.columns.length} columns - consider normalization`,
                    severity: "info",
                });
            }
        });
        return issues;
    }
    generateSchemaRecommendations(issues, schema, databaseType) {
        const recommendations = [];
        const errorCount = issues.filter((i) => i.severity === "error").length;
        const warningCount = issues.filter((i) => i.severity === "warning").length;
        if (errorCount > 0) {
            recommendations.push(`Fix ${errorCount} critical schema issues before deployment`);
        }
        if (warningCount > 0) {
            recommendations.push(`Address ${warningCount} schema warnings for better performance`);
        }
        if (schema.tables.length > 20) {
            recommendations.push("Consider microservices architecture for large schemas");
        }
        const relationshipCount = schema.relationships.length;
        if (relationshipCount > 10) {
            recommendations.push("Review complex relationships - consider denormalization for read-heavy workloads");
        }
        return recommendations;
    }
    calculateNormalizationScore(schema) {
        return this.assessNormalization(schema);
    }
    calculateIndexingCoverage(indexes, schema) {
        const tablesWithIndexes = new Set(indexes.map((idx) => idx.table)).size;
        return Math.round((tablesWithIndexes / schema.tables.length) * 100);
    }
    analyzeQuery(query, databaseType) {
        const analysis = {
            query,
            tables: [],
            operations: [],
            estimatedCost: 0,
            recommendations: [],
            optimizationOpportunities: [],
        };
        // Extract tables
        const tableRegex = /(?:FROM|JOIN|UPDATE|INSERT\s+INTO|DELETE\s+FROM)\s+(\w+)/gi;
        let match;
        while ((match = tableRegex.exec(query)) !== null) {
            if (match[1] && !analysis.tables.includes(match[1])) {
                analysis.tables.push(match[1]);
            }
        }
        // Identify operations
        if (query.toUpperCase().includes("SELECT"))
            analysis.operations.push("SELECT");
        if (query.toUpperCase().includes("INSERT"))
            analysis.operations.push("INSERT");
        if (query.toUpperCase().includes("UPDATE"))
            analysis.operations.push("UPDATE");
        if (query.toUpperCase().includes("DELETE"))
            analysis.operations.push("DELETE");
        // Check for common issues
        if (query.toUpperCase().includes("SELECT *")) {
            analysis.recommendations.push("Avoid SELECT * - specify required columns");
            analysis.optimizationOpportunities.push("Column selection optimization");
        }
        if (query.toUpperCase().includes("WHERE") &&
            !query.toUpperCase().includes("INDEX")) {
            analysis.recommendations.push("Consider adding indexes for WHERE clause columns");
            analysis.optimizationOpportunities.push("Index optimization");
        }
        // Estimate cost (simplified)
        analysis.estimatedCost = query.length * 0.1 + analysis.tables.length * 10;
        return analysis;
    }
    generateQueryOptimizations(analysis, schema, databaseType) {
        const optimizations = [];
        if (analysis.query.toUpperCase().includes("SELECT *")) {
            optimizations.push("Replace SELECT * with specific column names to reduce data transfer");
        }
        if (analysis.operations.includes("SELECT") && analysis.tables.length > 3) {
            optimizations.push("Consider breaking complex joins into smaller queries or use denormalized views");
        }
        if (analysis.query.toUpperCase().match(/WHERE\s+.*\s+LIKE\s+['"]%.*%['"]/)) {
            optimizations.push("LIKE queries with leading wildcards cannot use indexes - consider full-text search");
        }
        if (schema) {
            // Schema-aware optimizations would go here
            optimizations.push("Consider query result caching for frequently accessed data");
        }
        return optimizations;
    }
    calculateQueryPerformanceScore(analysis, optimizations) {
        let score = 100;
        // Deduct for each optimization opportunity
        score -= optimizations.length * 10;
        // Deduct for complex operations
        if (analysis.operations.length > 2)
            score -= 10;
        if (analysis.tables.length > 4)
            score -= 15;
        return Math.max(0, Math.min(100, score));
    }
    generateDataModel(requirements, entities, relationships, databaseType) {
        const tables = entities.map((entity) => ({
            name: this.toTableName(entity),
            columns: [
                {
                    name: "id",
                    type: databaseType === "postgresql" ? "SERIAL" : "INT AUTO_INCREMENT",
                    nullable: false,
                    constraints: ["PRIMARY KEY"],
                    usage: "primary",
                },
                {
                    name: "created_at",
                    type: "TIMESTAMP",
                    nullable: false,
                    defaultValue: "CURRENT_TIMESTAMP",
                    constraints: [],
                    usage: "data",
                },
                {
                    name: "updated_at",
                    type: "TIMESTAMP",
                    nullable: false,
                    defaultValue: "CURRENT_TIMESTAMP",
                    constraints: [],
                    usage: "data",
                },
            ],
            primaryKey: ["id"],
            estimatedRows: 1000,
            accessPatterns: ["CRUD operations"],
        }));
        const schemaRelationships = relationships.map((rel) => ({
            fromTable: this.toTableName(rel.from),
            toTable: this.toTableName(rel.to),
            fromColumn: "id",
            toColumn: `${this.toTableName(rel.from)}_id`,
            type: rel.type,
            cardinality: rel.type === "one-to-one"
                ? "1:1"
                : rel.type === "one-to-many"
                    ? "1:N"
                    : "N:M",
        }));
        return {
            tables,
            relationships: schemaRelationships,
            indexes: [],
            constraints: [],
        };
    }
    validateDataModel(model, databaseType) {
        const validation = {
            issues: [],
            score: 100,
        };
        // Check for naming conventions
        model.tables.forEach((table) => {
            if (!/^[a-z][a-z0-9_]*$/.test(table.name)) {
                validation.issues.push(`${table.name} does not follow naming conventions`);
                validation.score -= 5;
            }
        });
        return validation;
    }
    generateModelRecommendations(model, validation) {
        const recommendations = [];
        if (model.tables.length > 10) {
            recommendations.push("Consider microservices architecture for large data models");
        }
        if (model.relationships.length > model.tables.length) {
            recommendations.push("Review relationship complexity - consider denormalization");
        }
        recommendations.push("Add appropriate indexes based on query patterns");
        recommendations.push("Implement proper constraints and validations");
        recommendations.push("Document data retention and archival policies");
        return recommendations;
    }
    compareSchemas(current, target) {
        const changes = {
            addTables: [],
            dropTables: [],
            addColumns: [],
            modifyColumns: [],
            dropColumns: [],
            addIndexes: [],
            dropIndexes: [],
            hasDataLoss: false,
        };
        // Compare tables
        const currentTableNames = new Set(current.tables.map((t) => t.name));
        const targetTableNames = new Set(target.tables.map((t) => t.name));
        changes.addTables = [...targetTableNames].filter((name) => !currentTableNames.has(name));
        changes.dropTables = [...currentTableNames].filter((name) => !targetTableNames.has(name));
        // Data loss check
        changes.hasDataLoss = changes.dropTables.length > 0;
        return changes;
    }
    generateMigrationScript(changes, databaseType, safeMode) {
        let script = `-- Migration generated at ${new Date().toISOString()}\n\n`;
        if (safeMode) {
            script += `-- Safety checks\n`;
            script += `DO $$\nBEGIN\n`;
            script += `  -- Add your safety checks here\n`;
            script += `END\n$$;\n\n`;
        }
        // Add tables
        changes.addTables.forEach((tableName) => {
            script += `-- Add table ${tableName}\n`;
            script += `CREATE TABLE ${tableName} (\n`;
            script += `  id SERIAL PRIMARY KEY,\n`;
            script += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
            script += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
            script += `);\n\n`;
        });
        // Drop tables (with safety)
        if (changes.dropTables.length > 0 && safeMode) {
            script += `-- WARNING: Dropping tables with data loss potential\n`;
            changes.dropTables.forEach((tableName) => {
                script += `-- DROP TABLE ${tableName}; -- Uncomment only if data loss is acceptable\n`;
            });
            script += `\n`;
        }
        return script;
    }
    generateRollbackScript(changes, databaseType) {
        let script = `-- Rollback script generated at ${new Date().toISOString()}\n\n`;
        // Rollback logic would reverse the changes
        changes.addTables.forEach((tableName) => {
            script += `-- Rollback: Drop table ${tableName}\n`;
            script += `-- DROP TABLE IF EXISTS ${tableName};\n\n`;
        });
        return script;
    }
    toTableName(entity) {
        return entity
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
    }
    getIssueSeverityIcon(severity) {
        const icons = {
            error: "🚨",
            warning: "⚠️",
            info: "ℹ️",
        };
        return icons[severity] || "❓";
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log("StrRay Database Design MCP Server running...");
    }
}
// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new StrRayDatabaseDesignServer();
    server.run().catch(console.error);
}
export { StrRayDatabaseDesignServer };
//# sourceMappingURL=database-design.server.js.map