/**
 * StringRay AI v1.0.27 - Infrastructure as Code Validation System
 *
 * Comprehensive IaC validation with schema enforcement, pre-commit hooks,
 * and automated CI/CD integration for enterprise-grade cloud deployments.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ============================================================================
// Schema Validation Types
// ============================================================================

export enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export interface ValidationResult {
  file: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: ValidationSeverity.ERROR;
  line?: number;
  column?: number;
}

export interface ValidationWarning {
  path: string;
  message: string;
  severity: ValidationSeverity.WARNING;
  suggestion?: string;
}

// ============================================================================
// Base Schema Validators
// ============================================================================

export const CloudFormationSchema = z.object({
  AWSTemplateFormatVersion: z.string().optional(),
  Description: z.string().optional(),
  Metadata: z.record(z.string(), z.any()).optional(),
  Parameters: z
    .record(
      z.string(),
      z.object({
        Type: z.string(),
        Default: z.any().optional(),
        AllowedValues: z.array(z.any()).optional(),
        Description: z.string().optional(),
      }),
    )
    .optional(),
  Mappings: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.any())))
    .optional(),
  Conditions: z.record(z.string(), z.any()).optional(),
  Transform: z.union([z.string(), z.array(z.string())]).optional(),
  Resources: z.record(
    z.string(),
    z.object({
      Type: z.string(),
      Properties: z.record(z.string(), z.any()).optional(),
      DependsOn: z.union([z.string(), z.array(z.string())]).optional(),
      Metadata: z.record(z.string(), z.any()).optional(),
      DeletionPolicy: z.enum(["Delete", "Retain", "Snapshot"]).optional(),
    }),
  ),
  Outputs: z
    .record(
      z.string(),
      z.object({
        Description: z.string().optional(),
        Value: z.any(),
        Export: z
          .object({
            Name: z.string(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export const TerraformSchema = z.object({
  terraform: z
    .object({
      required_version: z.string().optional(),
      required_providers: z
        .record(
          z.string(),
          z.object({
            version: z.string().optional(),
            source: z.string().optional(),
          }),
        )
        .optional(),
      backend: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  provider: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  resource: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.any())))
    .optional(),
  data: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.any())))
    .optional(),
  variable: z
    .record(
      z.string(),
      z.object({
        type: z.string().optional(),
        default: z.any().optional(),
        description: z.string().optional(),
        validation: z
          .array(
            z.object({
              condition: z.any(),
              error_message: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  output: z
    .record(
      z.string(),
      z.object({
        value: z.any(),
        description: z.string().optional(),
        sensitive: z.boolean().optional(),
      }),
    )
    .optional(),
  locals: z.record(z.string(), z.any()).optional(),
  module: z.record(z.string(), z.record(z.string(), z.any())).optional(),
});

export const KubernetesSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: z.object({
    name: z.string(),
    namespace: z.string().optional(),
    labels: z.record(z.string(), z.string()).optional(),
    annotations: z.record(z.string(), z.string()).optional(),
  }),
  spec: z.record(z.string(), z.any()).optional(),
  status: z.record(z.string(), z.any()).optional(),
});

export const DockerComposeSchema = z.object({
  version: z.string().optional(),
  services: z
    .record(
      z.string(),
      z.object({
        image: z.string().optional(),
        build: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
        ports: z.array(z.union([z.string(), z.number()])).optional(),
        environment: z
          .union([z.record(z.string(), z.string()), z.array(z.string())])
          .optional(),
        volumes: z.array(z.string()).optional(),
        depends_on: z.array(z.string()).optional(),
        networks: z.array(z.string()).optional(),
        restart: z
          .enum(["no", "always", "on-failure", "unless-stopped"])
          .optional(),
      }),
    )
    .optional(),
  volumes: z.record(z.string(), z.record(z.string(), z.any())).optional(),
  networks: z.record(z.string(), z.record(z.string(), z.any())).optional(),
});

// ============================================================================
// IaC Validator Class
// ============================================================================

export class IaCValidator {
  private schemas = new Map<string, z.ZodSchema>();

  constructor() {
    this.registerSchemas();
  }

  private registerSchemas(): void {
    // CloudFormation
    this.schemas.set("template.yaml", CloudFormationSchema);
    this.schemas.set("template.yml", CloudFormationSchema);
    this.schemas.set("cf-template.yaml", CloudFormationSchema);
    this.schemas.set("cf-template.yml", CloudFormationSchema);

    // Terraform
    this.schemas.set("main.tf", TerraformSchema);
    this.schemas.set("variables.tf", TerraformSchema);
    this.schemas.set("outputs.tf", TerraformSchema);
    this.schemas.set("terraform.tf", TerraformSchema);

    // Kubernetes
    this.schemas.set("deployment.yaml", KubernetesSchema);
    this.schemas.set("deployment.yml", KubernetesSchema);
    this.schemas.set("service.yaml", KubernetesSchema);
    this.schemas.set("service.yml", KubernetesSchema);
    this.schemas.set("configmap.yaml", KubernetesSchema);
    this.schemas.set("configmap.yml", KubernetesSchema);
    this.schemas.set("secret.yaml", KubernetesSchema);
    this.schemas.set("secret.yml", KubernetesSchema);

    // Docker Compose
    this.schemas.set("docker-compose.yaml", DockerComposeSchema);
    this.schemas.set("docker-compose.yml", DockerComposeSchema);
    this.schemas.set("compose.yaml", DockerComposeSchema);
    this.schemas.set("compose.yml", DockerComposeSchema);
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      file: filePath,
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath).toLowerCase();

      // Determine file type and validate
      if (ext === ".json") {
        await this.validateJsonFile(content, result);
      } else if (ext === ".yaml" || ext === ".yml") {
        await this.validateYamlFile(filename, content, result);
      }

      // Additional security and best practice checks
      this.performSecurityChecks(filePath, content, result);
    } catch (error) {
      result.valid = false;
      result.errors.push({
        path: filePath,
        message: `Failed to read or parse file: ${error instanceof Error ? error.message : String(error)}`,
        severity: ValidationSeverity.ERROR,
      });
    }

    return result;
  }

  private async validateJsonFile(
    content: string,
    result: ValidationResult,
  ): Promise<void> {
    try {
      JSON.parse(content);
    } catch (error) {
      result.valid = false;
      result.errors.push({
        path: result.file,
        message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        severity: ValidationSeverity.ERROR,
      });
    }
  }

  private async validateYamlFile(
    filename: string,
    content: string,
    result: ValidationResult,
  ): Promise<void> {
    try {
      // Import yaml parser dynamically to avoid dependency issues
      const yaml = await import("yaml");

      const data = yaml.parse(content);
      const schema = this.schemas.get(filename);

      if (schema) {
        const validation = schema.safeParse(data);
        if (!validation.success) {
          result.valid = false;
          validation.error.issues.forEach((err) => {
            result.errors.push({
              path: `${result.file}.${err.path.join(".")}`,
              message: err.message,
              severity: ValidationSeverity.ERROR,
            });
          });
        }
      }

      // Basic YAML structure validation
      if (typeof data !== "object" || data === null) {
        result.valid = false;
        result.errors.push({
          path: result.file,
          message: "YAML file must contain a valid object structure",
          severity: ValidationSeverity.ERROR,
        });
      }
    } catch (error) {
      result.valid = false;
      result.errors.push({
        path: result.file,
        message: `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`,
        severity: ValidationSeverity.ERROR,
      });
    }
  }

  private performSecurityChecks(
    filePath: string,
    content: string,
    result: ValidationResult,
  ): void {
    const filename = path.basename(filePath).toLowerCase();

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*['"]\w+['"]/i,
      /secret\s*[:=]\s*['"]\w+['"]/i,
      /token\s*[:=]\s*['"]\w+['"]/i,
      /key\s*[:=]\s*['"]\w+['"]/i,
      /api[_-]?key\s*[:=]\s*['"]\w+['"]/i,
    ];

    secretPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        result.warnings.push({
          path: filePath,
          message: "Potential hardcoded secret detected",
          severity: ValidationSeverity.WARNING,
          suggestion: "Use environment variables or secret management services",
        });
      }
    });

    // Check for overly permissive permissions
    if (filename.includes("iam") || filename.includes("policy")) {
      if (content.includes("*") && content.includes("Action")) {
        result.warnings.push({
          path: filePath,
          message: "Overly permissive IAM policy detected (* action)",
          severity: ValidationSeverity.WARNING,
          suggestion: "Specify explicit actions instead of wildcard",
        });
      }
    }

    // Check for missing resource constraints
    if (filename.includes("deployment") || filename.includes("pod")) {
      if (!content.includes("resources") && !content.includes("limits")) {
        result.warnings.push({
          path: filePath,
          message: "Missing resource limits in deployment",
          severity: ValidationSeverity.WARNING,
          suggestion: "Add CPU and memory limits for production deployments",
        });
      }
    }
  }

  async validateDirectory(dirPath: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const files = this.findIaCFiles(dirPath);

    for (const file of files) {
      const result = await this.validateFile(file);
      results.push(result);
    }

    return results;
  }

  private findIaCFiles(dirPath: string): string[] {
    const files: string[] = [];
    const extensions = [".yaml", ".yml", ".json", ".tf"];
    const filenames = Array.from(this.schemas.keys());

    function scanDir(currentPath: string): void {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.startsWith(".") &&
          item !== "node_modules"
        ) {
          scanDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          const filename = item.toLowerCase();

          if (extensions.includes(ext) || filenames.includes(filename)) {
            files.push(fullPath);
          }
        }
      }
    }

    scanDir(dirPath);
    return files;
  }
}

// ============================================================================
// Pre-commit Hook Integration
// ============================================================================

export class PreCommitValidator {
  private validator: IaCValidator;

  constructor() {
    this.validator = new IaCValidator();
  }

  async validateStagedFiles(): Promise<{
    success: boolean;
    results: ValidationResult[];
  }> {
    try {
      // Get staged files
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf-8",
      })
        .split("\n")
        .filter(
          (file) =>
            file.trim() &&
            (file.endsWith(".yaml") ||
              file.endsWith(".yml") ||
              file.endsWith(".json") ||
              file.endsWith(".tf")),
        );

      const results: ValidationResult[] = [];

      for (const file of stagedFiles) {
        if (fs.existsSync(file)) {
          const result = await this.validator.validateFile(file);
          results.push(result);
        }
      }

      const hasErrors = results.some((r) => !r.valid);
      return { success: !hasErrors, results };
    } catch (error) {
      console.error("Failed to validate staged files:", error);
      return { success: false, results: [] };
    }
  }

  async validateAllIaCFiles(): Promise<{
    success: boolean;
    results: ValidationResult[];
  }> {
    const results = await this.validator.validateDirectory(process.cwd());
    const hasErrors = results.some((r) => !r.valid);
    return { success: !hasErrors, results };
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function validateCommand(args: string[]): Promise<void> {
  const validator = new IaCValidator();
  const preCommitValidator = new PreCommitValidator();

  if (args.includes("--staged")) {
    const { success, results } = await preCommitValidator.validateStagedFiles();
    printResults(results);

    if (!success) {
      console.error(
        "\n❌ IaC validation failed. Please fix errors before committing.",
      );
      process.exit(1);
    } else {
      console.log("\n✅ All IaC files passed validation.");
    }
  } else if (args.includes("--all")) {
    const { success, results } = await preCommitValidator.validateAllIaCFiles();
    printResults(results);

    if (!success) {
      console.error("\n❌ IaC validation failed.");
      process.exit(1);
    } else {
      console.log("\n✅ All IaC files passed validation.");
    }
  } else {
    const targetPath = args[0] || ".";
    const results = await validator.validateDirectory(targetPath);
    printResults(results);

    const hasErrors = results.some((r) => !r.valid);
    if (hasErrors) {
      process.exit(1);
    }
  }
}

function printResults(results: ValidationResult[]): void {
  for (const result of results) {
    console.log(`\n📄 ${result.file}:`);

    if (result.errors.length > 0) {
      console.log("  ❌ Errors:");
      result.errors.forEach((error) => {
        console.log(`    • ${error.path}: ${error.message}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log("  ⚠️  Warnings:");
      result.warnings.forEach((warning) => {
        console.log(`    • ${warning.path}: ${warning.message}`);
        if (warning.suggestion) {
          console.log(`      💡 ${warning.suggestion}`);
        }
      });
    }

    if (
      result.valid &&
      result.errors.length === 0 &&
      result.warnings.length === 0
    ) {
      console.log("  ✅ Valid");
    }
  }
}
