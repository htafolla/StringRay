/**
 * StringRay AI v1.0.4 - Cloud Infrastructure Schemas
 *
 * Schema definitions for cloud provider configurations, ensuring
 * enterprise-grade validation and compliance with Universal Development Codex v1.2.24.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { z } from "zod";

// ============================================================================
// AWS Schemas
// ============================================================================

export const AWSCredentialsSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  sessionToken: z.string().optional(),
  region: z.string().default("us-east-1"),
});

export const AWSVPCConfigSchema = z.object({
  vpcId: z.string().optional(),
  subnetIds: z.array(z.string()).optional(),
  securityGroupIds: z.array(z.string()).optional(),
  createVpc: z.boolean().default(false),
  cidrBlock: z.string().default("10.0.0.0/16"),
  availabilityZones: z.array(z.string()).optional(),
});

export const AWSLoadBalancerConfigSchema = z.object({
  name: z.string(),
  type: z.enum(["application", "network", "gateway"]).default("application"),
  scheme: z.enum(["internet-facing", "internal"]).default("internet-facing"),
  securityGroups: z.array(z.string()).optional(),
  subnets: z.array(z.string()).optional(),
  enableDeletionProtection: z.boolean().default(true),
  idleTimeout: z.number().min(1).max(4000).default(60),

  // Rate limiting configuration
  rateLimit: z
    .object({
      enabled: z.boolean().default(true),
      requestsPerSecond: z.number().min(1).max(100000).default(1000),
      burstLimit: z.number().min(1).max(100000).default(2000),
      byIp: z.boolean().default(true),
      byHeader: z
        .object({
          enabled: z.boolean().default(false),
          headerName: z.string().optional(),
          headerValues: z.array(z.string()).optional(),
        })
        .optional(),
      customRules: z
        .array(
          z.object({
            name: z.string(),
            priority: z.number(),
            action: z.enum(["allow", "deny", "count"]),
            conditions: z.array(
              z.object({
                type: z.enum([
                  "httpMethod",
                  "path",
                  "header",
                  "queryString",
                  "sourceIp",
                ]),
                values: z.array(z.string()),
              }),
            ),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const AWSAPIGatewayConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  protocolType: z.enum(["HTTP", "WEBSOCKET"]).default("HTTP"),
  corsConfiguration: z
    .object({
      allowCredentials: z.boolean().optional(),
      allowHeaders: z.array(z.string()).optional(),
      allowMethods: z.array(z.string()).optional(),
      allowOrigins: z.array(z.string()).optional(),
      exposeHeaders: z.array(z.string()).optional(),
      maxAge: z.number().optional(),
    })
    .optional(),

  // Rate limiting for API Gateway
  throttling: z
    .object({
      burstLimit: z.number().min(1).max(10000).default(5000),
      rateLimit: z.number().min(0.05).max(10000).default(10000),
    })
    .optional(),

  // Usage plans for rate limiting
  usagePlans: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        throttle: z.object({
          burstLimit: z.number().min(1).max(10000),
          rateLimit: z.number().min(0.05).max(10000),
        }),
        quota: z
          .object({
            limit: z.number().min(1),
            offset: z.number().optional(),
            period: z.enum(["DAY", "WEEK", "MONTH"]),
          })
          .optional(),
        apiStages: z
          .array(
            z.object({
              apiId: z.string(),
              stage: z.string(),
              throttle: z
                .record(
                  z.string(),
                  z.object({
                    burstLimit: z.number(),
                    rateLimit: z.number(),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

export const AWSCloudFormationTemplateSchema = z.object({
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
        AllowedPattern: z.string().optional(),
        ConstraintDescription: z.string().optional(),
        Description: z.string().optional(),
        MaxLength: z.number().optional(),
        MinLength: z.number().optional(),
        MaxValue: z.number().optional(),
        MinValue: z.number().optional(),
        NoEcho: z.boolean().optional(),
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
      UpdateReplacePolicy: z.enum(["Delete", "Retain", "Snapshot"]).optional(),
      Condition: z.string().optional(),
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
        Condition: z.string().optional(),
      }),
    )
    .optional(),
});

// ============================================================================
// Azure Schemas
// ============================================================================

export const AzureCredentialsSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  tenantId: z.string(),
  subscriptionId: z.string(),
});

export const AzureLoadBalancerConfigSchema = z.object({
  name: z.string(),
  location: z.string(),
  sku: z.object({
    name: z.enum(["Basic", "Standard"]).default("Standard"),
    tier: z.enum(["Regional", "Global"]).default("Regional"),
  }),
  frontendIPConfigurations: z.array(
    z.object({
      name: z.string(),
      properties: z.object({
        privateIPAllocationMethod: z.enum(["Static", "Dynamic"]).optional(),
        privateIPAddress: z.string().optional(),
        subnet: z
          .object({
            id: z.string(),
          })
          .optional(),
        publicIPAddress: z
          .object({
            id: z.string(),
          })
          .optional(),
      }),
    }),
  ),
  backendAddressPools: z
    .array(
      z.object({
        name: z.string(),
      }),
    )
    .optional(),
  loadBalancingRules: z
    .array(
      z.object({
        name: z.string(),
        properties: z.object({
          frontendIPConfiguration: z.object({
            id: z.string(),
          }),
          backendAddressPool: z.object({
            id: z.string(),
          }),
          probe: z.object({
            id: z.string(),
          }),
          protocol: z.enum(["Tcp", "Udp", "All"]),
          frontendPort: z.number(),
          backendPort: z.number(),
          idleTimeoutInMinutes: z.number().optional(),
          enableFloatingIP: z.boolean().optional(),
          loadDistribution: z
            .enum(["Default", "SourceIP", "SourceIPProtocol"])
            .optional(),
        }),
      }),
    )
    .optional(),

  // Rate limiting configuration
  rateLimit: z
    .object({
      enabled: z.boolean().default(true),
      rules: z
        .array(
          z.object({
            name: z.string(),
            priority: z.number(),
            matchConditions: z.array(
              z.object({
                matchVariables: z.array(
                  z.object({
                    variableName: z.enum([
                      "RemoteAddr",
                      "RequestMethod",
                      "QueryString",
                      "PostArgs",
                      "RequestUri",
                      "RequestHeaders",
                    ]),
                    selector: z.string().optional(),
                  }),
                ),
                operator: z.enum([
                  "Any",
                  "IPMatch",
                  "GeoMatch",
                  "Equal",
                  "Contains",
                  "LessThan",
                  "GreaterThan",
                  "LessThanOrEqual",
                  "GreaterThanOrEqual",
                  "BeginsWith",
                  "EndsWith",
                  "RegEx",
                ]),
                matchValues: z.array(z.string()),
                transforms: z
                  .array(
                    z.enum([
                      "Lowercase",
                      "Trim",
                      "UrlDecode",
                      "UrlEncode",
                      "RemoveNulls",
                      "HtmlEntityDecode",
                    ]),
                  )
                  .optional(),
              }),
            ),
            action: z.enum(["Allow", "Block", "Log", "Redirect"]),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const AzureAPIManagementConfigSchema = z.object({
  name: z.string(),
  location: z.string(),
  sku: z.object({
    name: z
      .enum(["Developer", "Basic", "Standard", "Premium", "Consumption"])
      .default("Developer"),
    capacity: z.number().min(1).default(1),
  }),
  publisherEmail: z.string().email(),
  publisherName: z.string(),

  // Rate limiting and throttling
  policies: z
    .object({
      inbound: z
        .array(
          z.object({
            rateLimit: z
              .object({
                calls: z.number(),
                renewalPeriod: z.number(),
                counterKey: z.string().optional(),
              })
              .optional(),
            rateLimitByKey: z
              .object({
                calls: z.number(),
                renewalPeriod: z.number(),
                counterKey: z.string(),
                incrementCondition: z.string().optional(),
                incrementCount: z.number().optional(),
              })
              .optional(),
          }),
        )
        .optional(),
      outbound: z.array(z.any()).optional(),
      backend: z.array(z.any()).optional(),
      onError: z.array(z.any()).optional(),
    })
    .optional(),
});

// ============================================================================
// GCP Schemas
// ============================================================================

export const GCPCredentialsSchema = z.object({
  type: z.literal("service_account"),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string(),
  client_id: z.string(),
  auth_uri: z.string(),
  token_uri: z.string(),
  auth_provider_x509_cert_url: z.string(),
  client_x509_cert_url: z.string(),
});

export const GCPLoadBalancerConfigSchema = z.object({
  name: z.string(),
  region: z.string(),
  backendService: z.object({
    name: z.string(),
    backends: z.array(
      z.object({
        group: z.string(),
        balancingMode: z.enum(["UTILIZATION", "RATE"]).default("UTILIZATION"),
        maxUtilization: z.number().min(0).max(1).default(0.8),
        maxRatePerInstance: z.number().optional(),
        capacityScaler: z.number().min(0).max(1).default(1.0),
      }),
    ),
    healthChecks: z.array(z.string()),
    loadBalancingScheme: z.enum(["INTERNAL", "EXTERNAL"]).default("EXTERNAL"),
    protocol: z
      .enum(["HTTP", "HTTPS", "HTTP2", "TCP", "UDP", "GRPC"])
      .default("HTTP"),
  }),

  // Rate limiting configuration
  rateLimit: z
    .object({
      enabled: z.boolean().default(true),
      rateLimiter: z
        .object({
          enforceOnKey: z
            .enum(["ALL", "IP", "HTTP_HEADER", "XFF_IP"])
            .default("IP"),
          enforceOnKeyName: z.string().optional(),
          rateLimitThreshold: z.object({
            count: z.number(),
            intervalSec: z.number(),
          }),
        })
        .optional(),
    })
    .optional(),
});

export const GCPAPIGatewayConfigSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  apiConfig: z.object({
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    openapiDocuments: z.array(
      z.object({
        document: z.object({
          path: z.string(),
          contents: z.string(),
        }),
      }),
    ),
    gatewayConfig: z
      .object({
        backendConfig: z
          .object({
            googleServiceAccount: z.string().optional(),
          })
          .optional(),
      })
      .optional(),

    // Rate limiting
    quota: z
      .object({
        limits: z
          .array(
            z.object({
              name: z.string(),
              metric: z.string(),
              unit: z.enum(["MINUTE", "HOUR", "DAY"]),
              values: z.record(z.string(), z.string()),
            }),
          )
          .optional(),
      })
      .optional(),
  }),
});

// ============================================================================
// Common Infrastructure Validation
// ============================================================================

export const InfrastructureConfigSchema = z.object({
  provider: z.enum(["aws", "azure", "gcp"]),
  region: z.string(),
  environment: z.enum(["dev", "staging", "prod"]).default("dev"),
  tags: z.record(z.string(), z.string()).optional(),

  // Security configurations
  security: z
    .object({
      enableEncryption: z.boolean().default(true),
      enableLogging: z.boolean().default(true),
      enableMonitoring: z.boolean().default(true),
      complianceFrameworks: z
        .array(z.enum(["SOC2", "HIPAA", "PCI-DSS", "GDPR"]))
        .optional(),
    })
    .optional(),

  // Networking
  networking: z
    .object({
      vpc: z.any().optional(), // Provider-specific VPC config
      loadBalancers: z.array(z.any()).optional(), // Provider-specific LB config
      apiGateways: z.array(z.any()).optional(), // Provider-specific API Gateway config
      firewalls: z
        .array(
          z.object({
            name: z.string(),
            direction: z.enum(["INGRESS", "EGRESS"]),
            priority: z.number(),
            allowed: z
              .array(
                z.object({
                  ipProtocol: z.string(),
                  ports: z.array(z.string()).optional(),
                }),
              )
              .optional(),
            denied: z
              .array(
                z.object({
                  ipProtocol: z.string(),
                  ports: z.array(z.string()).optional(),
                }),
              )
              .optional(),
            sourceRanges: z.array(z.string()).optional(),
            destinationRanges: z.array(z.string()).optional(),
            targetTags: z.array(z.string()).optional(),
            sourceTags: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
    .optional(),

  // Rate limiting (global)
  rateLimiting: z
    .object({
      enabled: z.boolean().default(true),
      globalLimits: z
        .object({
          requestsPerSecond: z.number().min(1).default(1000),
          requestsPerMinute: z.number().min(1).default(60000),
          requestsPerHour: z.number().min(1).default(3600000),
          burstMultiplier: z.number().min(1).max(10).default(2),
        })
        .optional(),
      ipBasedLimits: z
        .object({
          enabled: z.boolean().default(true),
          whitelist: z.array(z.string()).optional(),
          blacklist: z.array(z.string()).optional(),
        })
        .optional(),
      endpointLimits: z
        .record(
          z.string(),
          z.object({
            requestsPerSecond: z.number(),
            requestsPerMinute: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type AWSCredentials = z.infer<typeof AWSCredentialsSchema>;
export type AWSVPCConfig = z.infer<typeof AWSVPCConfigSchema>;
export type AWSLoadBalancerConfig = z.infer<typeof AWSLoadBalancerConfigSchema>;
export type AWSAPIGatewayConfig = z.infer<typeof AWSAPIGatewayConfigSchema>;
export type AWSCloudFormationTemplate = z.infer<
  typeof AWSCloudFormationTemplateSchema
>;

export type AzureCredentials = z.infer<typeof AzureCredentialsSchema>;
export type AzureLoadBalancerConfig = z.infer<
  typeof AzureLoadBalancerConfigSchema
>;
export type AzureAPIManagementConfig = z.infer<
  typeof AzureAPIManagementConfigSchema
>;

export type GCPCredentials = z.infer<typeof GCPCredentialsSchema>;
export type GCPLoadBalancerConfig = z.infer<typeof GCPLoadBalancerConfigSchema>;
export type GCPAPIGatewayConfig = z.infer<typeof GCPAPIGatewayConfigSchema>;

export type InfrastructureConfig = z.infer<typeof InfrastructureConfigSchema>;
