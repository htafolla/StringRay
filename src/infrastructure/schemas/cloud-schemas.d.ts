/**
 * StringRay AI v1.1.1 - Cloud Infrastructure Schemas
 *
 * Schema definitions for cloud provider configurations, ensuring
 * enterprise-grade validation and compliance with Universal Development Codex v1.1.1.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { z } from "zod";
export declare const AWSCredentialsSchema: z.ZodObject<{
    accessKeyId: z.ZodString;
    secretAccessKey: z.ZodString;
    sessionToken: z.ZodOptional<z.ZodString>;
    region: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    sessionToken?: string | undefined;
}, {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string | undefined;
    region?: string | undefined;
}>;
export declare const AWSVPCConfigSchema: z.ZodObject<{
    vpcId: z.ZodOptional<z.ZodString>;
    subnetIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    securityGroupIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createVpc: z.ZodDefault<z.ZodBoolean>;
    cidrBlock: z.ZodDefault<z.ZodString>;
    availabilityZones: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    createVpc: boolean;
    cidrBlock: string;
    vpcId?: string | undefined;
    subnetIds?: string[] | undefined;
    securityGroupIds?: string[] | undefined;
    availabilityZones?: string[] | undefined;
}, {
    vpcId?: string | undefined;
    subnetIds?: string[] | undefined;
    securityGroupIds?: string[] | undefined;
    createVpc?: boolean | undefined;
    cidrBlock?: string | undefined;
    availabilityZones?: string[] | undefined;
}>;
export declare const AWSLoadBalancerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["application", "network", "gateway"]>>;
    scheme: z.ZodDefault<z.ZodEnum<["internet-facing", "internal"]>>;
    securityGroups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    subnets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    enableDeletionProtection: z.ZodDefault<z.ZodBoolean>;
    idleTimeout: z.ZodDefault<z.ZodNumber>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        requestsPerSecond: z.ZodDefault<z.ZodNumber>;
        burstLimit: z.ZodDefault<z.ZodNumber>;
        byIp: z.ZodDefault<z.ZodBoolean>;
        byHeader: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            headerName: z.ZodOptional<z.ZodString>;
            headerValues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            headerName?: string | undefined;
            headerValues?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            headerName?: string | undefined;
            headerValues?: string[] | undefined;
        }>>;
        customRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            priority: z.ZodNumber;
            action: z.ZodEnum<["allow", "deny", "count"]>;
            conditions: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["httpMethod", "path", "header", "queryString", "sourceIp"]>;
                values: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }, {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            action: "count" | "allow" | "deny";
            priority: number;
            conditions: {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }[];
        }, {
            name: string;
            action: "count" | "allow" | "deny";
            priority: number;
            conditions: {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }[];
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        requestsPerSecond: number;
        burstLimit: number;
        byIp: boolean;
        byHeader?: {
            enabled: boolean;
            headerName?: string | undefined;
            headerValues?: string[] | undefined;
        } | undefined;
        customRules?: {
            name: string;
            action: "count" | "allow" | "deny";
            priority: number;
            conditions: {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }[];
        }[] | undefined;
    }, {
        enabled?: boolean | undefined;
        requestsPerSecond?: number | undefined;
        burstLimit?: number | undefined;
        byIp?: boolean | undefined;
        byHeader?: {
            enabled?: boolean | undefined;
            headerName?: string | undefined;
            headerValues?: string[] | undefined;
        } | undefined;
        customRules?: {
            name: string;
            action: "count" | "allow" | "deny";
            priority: number;
            conditions: {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }[];
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "application" | "network" | "gateway";
    scheme: "internal" | "internet-facing";
    enableDeletionProtection: boolean;
    idleTimeout: number;
    securityGroups?: string[] | undefined;
    subnets?: string[] | undefined;
    rateLimit?: {
        enabled: boolean;
        requestsPerSecond: number;
        burstLimit: number;
        byIp: boolean;
        byHeader?: {
            enabled: boolean;
            headerName?: string | undefined;
            headerValues?: string[] | undefined;
        } | undefined;
        customRules?: {
            name: string;
            action: "count" | "allow" | "deny";
            priority: number;
            conditions: {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }[];
        }[] | undefined;
    } | undefined;
}, {
    name: string;
    type?: "application" | "network" | "gateway" | undefined;
    scheme?: "internal" | "internet-facing" | undefined;
    securityGroups?: string[] | undefined;
    subnets?: string[] | undefined;
    enableDeletionProtection?: boolean | undefined;
    idleTimeout?: number | undefined;
    rateLimit?: {
        enabled?: boolean | undefined;
        requestsPerSecond?: number | undefined;
        burstLimit?: number | undefined;
        byIp?: boolean | undefined;
        byHeader?: {
            enabled?: boolean | undefined;
            headerName?: string | undefined;
            headerValues?: string[] | undefined;
        } | undefined;
        customRules?: {
            name: string;
            action: "count" | "allow" | "deny";
            priority: number;
            conditions: {
                values: string[];
                type: "path" | "httpMethod" | "header" | "queryString" | "sourceIp";
            }[];
        }[] | undefined;
    } | undefined;
}>;
export declare const AWSAPIGatewayConfigSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    protocolType: z.ZodDefault<z.ZodEnum<["HTTP", "WEBSOCKET"]>>;
    corsConfiguration: z.ZodOptional<z.ZodObject<{
        allowCredentials: z.ZodOptional<z.ZodBoolean>;
        allowHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        allowMethods: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        allowOrigins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exposeHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        maxAge: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        allowCredentials?: boolean | undefined;
        allowHeaders?: string[] | undefined;
        allowMethods?: string[] | undefined;
        allowOrigins?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        maxAge?: number | undefined;
    }, {
        allowCredentials?: boolean | undefined;
        allowHeaders?: string[] | undefined;
        allowMethods?: string[] | undefined;
        allowOrigins?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        maxAge?: number | undefined;
    }>>;
    throttling: z.ZodOptional<z.ZodObject<{
        burstLimit: z.ZodDefault<z.ZodNumber>;
        rateLimit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        burstLimit: number;
        rateLimit: number;
    }, {
        burstLimit?: number | undefined;
        rateLimit?: number | undefined;
    }>>;
    usagePlans: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        throttle: z.ZodObject<{
            burstLimit: z.ZodNumber;
            rateLimit: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            burstLimit: number;
            rateLimit: number;
        }, {
            burstLimit: number;
            rateLimit: number;
        }>;
        quota: z.ZodOptional<z.ZodObject<{
            limit: z.ZodNumber;
            offset: z.ZodOptional<z.ZodNumber>;
            period: z.ZodEnum<["DAY", "WEEK", "MONTH"]>;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            period: "DAY" | "WEEK" | "MONTH";
            offset?: number | undefined;
        }, {
            limit: number;
            period: "DAY" | "WEEK" | "MONTH";
            offset?: number | undefined;
        }>>;
        apiStages: z.ZodOptional<z.ZodArray<z.ZodObject<{
            apiId: z.ZodString;
            stage: z.ZodString;
            throttle: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                burstLimit: z.ZodNumber;
                rateLimit: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                burstLimit: number;
                rateLimit: number;
            }, {
                burstLimit: number;
                rateLimit: number;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            apiId: string;
            stage: string;
            throttle?: Record<string, {
                burstLimit: number;
                rateLimit: number;
            }> | undefined;
        }, {
            apiId: string;
            stage: string;
            throttle?: Record<string, {
                burstLimit: number;
                rateLimit: number;
            }> | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        throttle: {
            burstLimit: number;
            rateLimit: number;
        };
        description?: string | undefined;
        quota?: {
            limit: number;
            period: "DAY" | "WEEK" | "MONTH";
            offset?: number | undefined;
        } | undefined;
        apiStages?: {
            apiId: string;
            stage: string;
            throttle?: Record<string, {
                burstLimit: number;
                rateLimit: number;
            }> | undefined;
        }[] | undefined;
    }, {
        name: string;
        throttle: {
            burstLimit: number;
            rateLimit: number;
        };
        description?: string | undefined;
        quota?: {
            limit: number;
            period: "DAY" | "WEEK" | "MONTH";
            offset?: number | undefined;
        } | undefined;
        apiStages?: {
            apiId: string;
            stage: string;
            throttle?: Record<string, {
                burstLimit: number;
                rateLimit: number;
            }> | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    protocolType: "HTTP" | "WEBSOCKET";
    description?: string | undefined;
    corsConfiguration?: {
        allowCredentials?: boolean | undefined;
        allowHeaders?: string[] | undefined;
        allowMethods?: string[] | undefined;
        allowOrigins?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        maxAge?: number | undefined;
    } | undefined;
    throttling?: {
        burstLimit: number;
        rateLimit: number;
    } | undefined;
    usagePlans?: {
        name: string;
        throttle: {
            burstLimit: number;
            rateLimit: number;
        };
        description?: string | undefined;
        quota?: {
            limit: number;
            period: "DAY" | "WEEK" | "MONTH";
            offset?: number | undefined;
        } | undefined;
        apiStages?: {
            apiId: string;
            stage: string;
            throttle?: Record<string, {
                burstLimit: number;
                rateLimit: number;
            }> | undefined;
        }[] | undefined;
    }[] | undefined;
}, {
    name: string;
    description?: string | undefined;
    protocolType?: "HTTP" | "WEBSOCKET" | undefined;
    corsConfiguration?: {
        allowCredentials?: boolean | undefined;
        allowHeaders?: string[] | undefined;
        allowMethods?: string[] | undefined;
        allowOrigins?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        maxAge?: number | undefined;
    } | undefined;
    throttling?: {
        burstLimit?: number | undefined;
        rateLimit?: number | undefined;
    } | undefined;
    usagePlans?: {
        name: string;
        throttle: {
            burstLimit: number;
            rateLimit: number;
        };
        description?: string | undefined;
        quota?: {
            limit: number;
            period: "DAY" | "WEEK" | "MONTH";
            offset?: number | undefined;
        } | undefined;
        apiStages?: {
            apiId: string;
            stage: string;
            throttle?: Record<string, {
                burstLimit: number;
                rateLimit: number;
            }> | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const AWSCloudFormationTemplateSchema: z.ZodObject<{
    AWSTemplateFormatVersion: z.ZodOptional<z.ZodString>;
    Description: z.ZodOptional<z.ZodString>;
    Metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    Parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        Type: z.ZodString;
        Default: z.ZodOptional<z.ZodAny>;
        AllowedValues: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        AllowedPattern: z.ZodOptional<z.ZodString>;
        ConstraintDescription: z.ZodOptional<z.ZodString>;
        Description: z.ZodOptional<z.ZodString>;
        MaxLength: z.ZodOptional<z.ZodNumber>;
        MinLength: z.ZodOptional<z.ZodNumber>;
        MaxValue: z.ZodOptional<z.ZodNumber>;
        MinValue: z.ZodOptional<z.ZodNumber>;
        NoEcho: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        Type: string;
        Description?: string | undefined;
        Default?: any;
        AllowedValues?: any[] | undefined;
        AllowedPattern?: string | undefined;
        ConstraintDescription?: string | undefined;
        MaxLength?: number | undefined;
        MinLength?: number | undefined;
        MaxValue?: number | undefined;
        MinValue?: number | undefined;
        NoEcho?: boolean | undefined;
    }, {
        Type: string;
        Description?: string | undefined;
        Default?: any;
        AllowedValues?: any[] | undefined;
        AllowedPattern?: string | undefined;
        ConstraintDescription?: string | undefined;
        MaxLength?: number | undefined;
        MinLength?: number | undefined;
        MaxValue?: number | undefined;
        MinValue?: number | undefined;
        NoEcho?: boolean | undefined;
    }>>>;
    Mappings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>>>>;
    Conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    Transform: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    Resources: z.ZodRecord<z.ZodString, z.ZodObject<{
        Type: z.ZodString;
        Properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        DependsOn: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        Metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        DeletionPolicy: z.ZodOptional<z.ZodEnum<["Delete", "Retain", "Snapshot"]>>;
        UpdateReplacePolicy: z.ZodOptional<z.ZodEnum<["Delete", "Retain", "Snapshot"]>>;
        Condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        Type: string;
        Metadata?: Record<string, any> | undefined;
        Properties?: Record<string, any> | undefined;
        DependsOn?: string | string[] | undefined;
        DeletionPolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        UpdateReplacePolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        Condition?: string | undefined;
    }, {
        Type: string;
        Metadata?: Record<string, any> | undefined;
        Properties?: Record<string, any> | undefined;
        DependsOn?: string | string[] | undefined;
        DeletionPolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        UpdateReplacePolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        Condition?: string | undefined;
    }>>;
    Outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        Description: z.ZodOptional<z.ZodString>;
        Value: z.ZodAny;
        Export: z.ZodOptional<z.ZodObject<{
            Name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            Name: string;
        }, {
            Name: string;
        }>>;
        Condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        Description?: string | undefined;
        Condition?: string | undefined;
        Value?: any;
        Export?: {
            Name: string;
        } | undefined;
    }, {
        Description?: string | undefined;
        Condition?: string | undefined;
        Value?: any;
        Export?: {
            Name: string;
        } | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    Resources: Record<string, {
        Type: string;
        Metadata?: Record<string, any> | undefined;
        Properties?: Record<string, any> | undefined;
        DependsOn?: string | string[] | undefined;
        DeletionPolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        UpdateReplacePolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        Condition?: string | undefined;
    }>;
    AWSTemplateFormatVersion?: string | undefined;
    Description?: string | undefined;
    Metadata?: Record<string, any> | undefined;
    Parameters?: Record<string, {
        Type: string;
        Description?: string | undefined;
        Default?: any;
        AllowedValues?: any[] | undefined;
        AllowedPattern?: string | undefined;
        ConstraintDescription?: string | undefined;
        MaxLength?: number | undefined;
        MinLength?: number | undefined;
        MaxValue?: number | undefined;
        MinValue?: number | undefined;
        NoEcho?: boolean | undefined;
    }> | undefined;
    Mappings?: Record<string, Record<string, Record<string, any>>> | undefined;
    Conditions?: Record<string, any> | undefined;
    Transform?: string | string[] | undefined;
    Outputs?: Record<string, {
        Description?: string | undefined;
        Condition?: string | undefined;
        Value?: any;
        Export?: {
            Name: string;
        } | undefined;
    }> | undefined;
}, {
    Resources: Record<string, {
        Type: string;
        Metadata?: Record<string, any> | undefined;
        Properties?: Record<string, any> | undefined;
        DependsOn?: string | string[] | undefined;
        DeletionPolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        UpdateReplacePolicy?: "Delete" | "Retain" | "Snapshot" | undefined;
        Condition?: string | undefined;
    }>;
    AWSTemplateFormatVersion?: string | undefined;
    Description?: string | undefined;
    Metadata?: Record<string, any> | undefined;
    Parameters?: Record<string, {
        Type: string;
        Description?: string | undefined;
        Default?: any;
        AllowedValues?: any[] | undefined;
        AllowedPattern?: string | undefined;
        ConstraintDescription?: string | undefined;
        MaxLength?: number | undefined;
        MinLength?: number | undefined;
        MaxValue?: number | undefined;
        MinValue?: number | undefined;
        NoEcho?: boolean | undefined;
    }> | undefined;
    Mappings?: Record<string, Record<string, Record<string, any>>> | undefined;
    Conditions?: Record<string, any> | undefined;
    Transform?: string | string[] | undefined;
    Outputs?: Record<string, {
        Description?: string | undefined;
        Condition?: string | undefined;
        Value?: any;
        Export?: {
            Name: string;
        } | undefined;
    }> | undefined;
}>;
export declare const AzureCredentialsSchema: z.ZodObject<{
    clientId: z.ZodString;
    clientSecret: z.ZodString;
    tenantId: z.ZodString;
    subscriptionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    subscriptionId: string;
}, {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    subscriptionId: string;
}>;
export declare const AzureLoadBalancerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    location: z.ZodString;
    sku: z.ZodObject<{
        name: z.ZodDefault<z.ZodEnum<["Basic", "Standard"]>>;
        tier: z.ZodDefault<z.ZodEnum<["Regional", "Global"]>>;
    }, "strip", z.ZodTypeAny, {
        name: "Basic" | "Standard";
        tier: "Regional" | "Global";
    }, {
        name?: "Basic" | "Standard" | undefined;
        tier?: "Regional" | "Global" | undefined;
    }>;
    frontendIPConfigurations: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        properties: z.ZodObject<{
            privateIPAllocationMethod: z.ZodOptional<z.ZodEnum<["Static", "Dynamic"]>>;
            privateIPAddress: z.ZodOptional<z.ZodString>;
            subnet: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>>;
            publicIPAddress: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            privateIPAllocationMethod?: "Static" | "Dynamic" | undefined;
            privateIPAddress?: string | undefined;
            subnet?: {
                id: string;
            } | undefined;
            publicIPAddress?: {
                id: string;
            } | undefined;
        }, {
            privateIPAllocationMethod?: "Static" | "Dynamic" | undefined;
            privateIPAddress?: string | undefined;
            subnet?: {
                id: string;
            } | undefined;
            publicIPAddress?: {
                id: string;
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        properties: {
            privateIPAllocationMethod?: "Static" | "Dynamic" | undefined;
            privateIPAddress?: string | undefined;
            subnet?: {
                id: string;
            } | undefined;
            publicIPAddress?: {
                id: string;
            } | undefined;
        };
    }, {
        name: string;
        properties: {
            privateIPAllocationMethod?: "Static" | "Dynamic" | undefined;
            privateIPAddress?: string | undefined;
            subnet?: {
                id: string;
            } | undefined;
            publicIPAddress?: {
                id: string;
            } | undefined;
        };
    }>, "many">;
    backendAddressPools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>, "many">>;
    loadBalancingRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        properties: z.ZodObject<{
            frontendIPConfiguration: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            backendAddressPool: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            probe: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            protocol: z.ZodEnum<["Tcp", "Udp", "All"]>;
            frontendPort: z.ZodNumber;
            backendPort: z.ZodNumber;
            idleTimeoutInMinutes: z.ZodOptional<z.ZodNumber>;
            enableFloatingIP: z.ZodOptional<z.ZodBoolean>;
            loadDistribution: z.ZodOptional<z.ZodEnum<["Default", "SourceIP", "SourceIPProtocol"]>>;
        }, "strip", z.ZodTypeAny, {
            frontendIPConfiguration: {
                id: string;
            };
            backendAddressPool: {
                id: string;
            };
            probe: {
                id: string;
            };
            protocol: "Tcp" | "Udp" | "All";
            frontendPort: number;
            backendPort: number;
            idleTimeoutInMinutes?: number | undefined;
            enableFloatingIP?: boolean | undefined;
            loadDistribution?: "Default" | "SourceIP" | "SourceIPProtocol" | undefined;
        }, {
            frontendIPConfiguration: {
                id: string;
            };
            backendAddressPool: {
                id: string;
            };
            probe: {
                id: string;
            };
            protocol: "Tcp" | "Udp" | "All";
            frontendPort: number;
            backendPort: number;
            idleTimeoutInMinutes?: number | undefined;
            enableFloatingIP?: boolean | undefined;
            loadDistribution?: "Default" | "SourceIP" | "SourceIPProtocol" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        properties: {
            frontendIPConfiguration: {
                id: string;
            };
            backendAddressPool: {
                id: string;
            };
            probe: {
                id: string;
            };
            protocol: "Tcp" | "Udp" | "All";
            frontendPort: number;
            backendPort: number;
            idleTimeoutInMinutes?: number | undefined;
            enableFloatingIP?: boolean | undefined;
            loadDistribution?: "Default" | "SourceIP" | "SourceIPProtocol" | undefined;
        };
    }, {
        name: string;
        properties: {
            frontendIPConfiguration: {
                id: string;
            };
            backendAddressPool: {
                id: string;
            };
            probe: {
                id: string;
            };
            protocol: "Tcp" | "Udp" | "All";
            frontendPort: number;
            backendPort: number;
            idleTimeoutInMinutes?: number | undefined;
            enableFloatingIP?: boolean | undefined;
            loadDistribution?: "Default" | "SourceIP" | "SourceIPProtocol" | undefined;
        };
    }>, "many">>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            priority: z.ZodNumber;
            matchConditions: z.ZodArray<z.ZodObject<{
                matchVariables: z.ZodArray<z.ZodObject<{
                    variableName: z.ZodEnum<["RemoteAddr", "RequestMethod", "QueryString", "PostArgs", "RequestUri", "RequestHeaders"]>;
                    selector: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }, {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }>, "many">;
                operator: z.ZodEnum<["Any", "IPMatch", "GeoMatch", "Equal", "Contains", "LessThan", "GreaterThan", "LessThanOrEqual", "GreaterThanOrEqual", "BeginsWith", "EndsWith", "RegEx"]>;
                matchValues: z.ZodArray<z.ZodString, "many">;
                transforms: z.ZodOptional<z.ZodArray<z.ZodEnum<["Lowercase", "Trim", "UrlDecode", "UrlEncode", "RemoveNulls", "HtmlEntityDecode"]>, "many">>;
            }, "strip", z.ZodTypeAny, {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }, {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }>, "many">;
            action: z.ZodEnum<["Allow", "Block", "Log", "Redirect"]>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            action: "Allow" | "Block" | "Log" | "Redirect";
            priority: number;
            matchConditions: {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }[];
        }, {
            name: string;
            action: "Allow" | "Block" | "Log" | "Redirect";
            priority: number;
            matchConditions: {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }[];
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        rules?: {
            name: string;
            action: "Allow" | "Block" | "Log" | "Redirect";
            priority: number;
            matchConditions: {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }[];
        }[] | undefined;
    }, {
        enabled?: boolean | undefined;
        rules?: {
            name: string;
            action: "Allow" | "Block" | "Log" | "Redirect";
            priority: number;
            matchConditions: {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }[];
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    location: string;
    sku: {
        name: "Basic" | "Standard";
        tier: "Regional" | "Global";
    };
    frontendIPConfigurations: {
        name: string;
        properties: {
            privateIPAllocationMethod?: "Static" | "Dynamic" | undefined;
            privateIPAddress?: string | undefined;
            subnet?: {
                id: string;
            } | undefined;
            publicIPAddress?: {
                id: string;
            } | undefined;
        };
    }[];
    rateLimit?: {
        enabled: boolean;
        rules?: {
            name: string;
            action: "Allow" | "Block" | "Log" | "Redirect";
            priority: number;
            matchConditions: {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }[];
        }[] | undefined;
    } | undefined;
    backendAddressPools?: {
        name: string;
    }[] | undefined;
    loadBalancingRules?: {
        name: string;
        properties: {
            frontendIPConfiguration: {
                id: string;
            };
            backendAddressPool: {
                id: string;
            };
            probe: {
                id: string;
            };
            protocol: "Tcp" | "Udp" | "All";
            frontendPort: number;
            backendPort: number;
            idleTimeoutInMinutes?: number | undefined;
            enableFloatingIP?: boolean | undefined;
            loadDistribution?: "Default" | "SourceIP" | "SourceIPProtocol" | undefined;
        };
    }[] | undefined;
}, {
    name: string;
    location: string;
    sku: {
        name?: "Basic" | "Standard" | undefined;
        tier?: "Regional" | "Global" | undefined;
    };
    frontendIPConfigurations: {
        name: string;
        properties: {
            privateIPAllocationMethod?: "Static" | "Dynamic" | undefined;
            privateIPAddress?: string | undefined;
            subnet?: {
                id: string;
            } | undefined;
            publicIPAddress?: {
                id: string;
            } | undefined;
        };
    }[];
    rateLimit?: {
        enabled?: boolean | undefined;
        rules?: {
            name: string;
            action: "Allow" | "Block" | "Log" | "Redirect";
            priority: number;
            matchConditions: {
                matchVariables: {
                    variableName: "RemoteAddr" | "RequestMethod" | "QueryString" | "PostArgs" | "RequestUri" | "RequestHeaders";
                    selector?: string | undefined;
                }[];
                operator: "Any" | "IPMatch" | "GeoMatch" | "Equal" | "Contains" | "LessThan" | "GreaterThan" | "LessThanOrEqual" | "GreaterThanOrEqual" | "BeginsWith" | "EndsWith" | "RegEx";
                matchValues: string[];
                transforms?: ("Lowercase" | "Trim" | "UrlDecode" | "UrlEncode" | "RemoveNulls" | "HtmlEntityDecode")[] | undefined;
            }[];
        }[] | undefined;
    } | undefined;
    backendAddressPools?: {
        name: string;
    }[] | undefined;
    loadBalancingRules?: {
        name: string;
        properties: {
            frontendIPConfiguration: {
                id: string;
            };
            backendAddressPool: {
                id: string;
            };
            probe: {
                id: string;
            };
            protocol: "Tcp" | "Udp" | "All";
            frontendPort: number;
            backendPort: number;
            idleTimeoutInMinutes?: number | undefined;
            enableFloatingIP?: boolean | undefined;
            loadDistribution?: "Default" | "SourceIP" | "SourceIPProtocol" | undefined;
        };
    }[] | undefined;
}>;
export declare const AzureAPIManagementConfigSchema: z.ZodObject<{
    name: z.ZodString;
    location: z.ZodString;
    sku: z.ZodObject<{
        name: z.ZodDefault<z.ZodEnum<["Developer", "Basic", "Standard", "Premium", "Consumption"]>>;
        capacity: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: "Basic" | "Standard" | "Developer" | "Premium" | "Consumption";
        capacity: number;
    }, {
        name?: "Basic" | "Standard" | "Developer" | "Premium" | "Consumption" | undefined;
        capacity?: number | undefined;
    }>;
    publisherEmail: z.ZodString;
    publisherName: z.ZodString;
    policies: z.ZodOptional<z.ZodObject<{
        inbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
            rateLimit: z.ZodOptional<z.ZodObject<{
                calls: z.ZodNumber;
                renewalPeriod: z.ZodNumber;
                counterKey: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            }, {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            }>>;
            rateLimitByKey: z.ZodOptional<z.ZodObject<{
                calls: z.ZodNumber;
                renewalPeriod: z.ZodNumber;
                counterKey: z.ZodString;
                incrementCondition: z.ZodOptional<z.ZodString>;
                incrementCount: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            }, {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            rateLimit?: {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            } | undefined;
            rateLimitByKey?: {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            } | undefined;
        }, {
            rateLimit?: {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            } | undefined;
            rateLimitByKey?: {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            } | undefined;
        }>, "many">>;
        outbound: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        backend: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        onError: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        inbound?: {
            rateLimit?: {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            } | undefined;
            rateLimitByKey?: {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            } | undefined;
        }[] | undefined;
        outbound?: any[] | undefined;
        backend?: any[] | undefined;
        onError?: any[] | undefined;
    }, {
        inbound?: {
            rateLimit?: {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            } | undefined;
            rateLimitByKey?: {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            } | undefined;
        }[] | undefined;
        outbound?: any[] | undefined;
        backend?: any[] | undefined;
        onError?: any[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    location: string;
    sku: {
        name: "Basic" | "Standard" | "Developer" | "Premium" | "Consumption";
        capacity: number;
    };
    publisherEmail: string;
    publisherName: string;
    policies?: {
        inbound?: {
            rateLimit?: {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            } | undefined;
            rateLimitByKey?: {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            } | undefined;
        }[] | undefined;
        outbound?: any[] | undefined;
        backend?: any[] | undefined;
        onError?: any[] | undefined;
    } | undefined;
}, {
    name: string;
    location: string;
    sku: {
        name?: "Basic" | "Standard" | "Developer" | "Premium" | "Consumption" | undefined;
        capacity?: number | undefined;
    };
    publisherEmail: string;
    publisherName: string;
    policies?: {
        inbound?: {
            rateLimit?: {
                calls: number;
                renewalPeriod: number;
                counterKey?: string | undefined;
            } | undefined;
            rateLimitByKey?: {
                calls: number;
                renewalPeriod: number;
                counterKey: string;
                incrementCondition?: string | undefined;
                incrementCount?: number | undefined;
            } | undefined;
        }[] | undefined;
        outbound?: any[] | undefined;
        backend?: any[] | undefined;
        onError?: any[] | undefined;
    } | undefined;
}>;
export declare const GCPCredentialsSchema: z.ZodObject<{
    type: z.ZodLiteral<"service_account">;
    project_id: z.ZodString;
    private_key_id: z.ZodString;
    private_key: z.ZodString;
    client_email: z.ZodString;
    client_id: z.ZodString;
    auth_uri: z.ZodString;
    token_uri: z.ZodString;
    auth_provider_x509_cert_url: z.ZodString;
    client_x509_cert_url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "service_account";
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}, {
    type: "service_account";
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}>;
export declare const GCPLoadBalancerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    region: z.ZodString;
    backendService: z.ZodObject<{
        name: z.ZodString;
        backends: z.ZodArray<z.ZodObject<{
            group: z.ZodString;
            balancingMode: z.ZodDefault<z.ZodEnum<["UTILIZATION", "RATE"]>>;
            maxUtilization: z.ZodDefault<z.ZodNumber>;
            maxRatePerInstance: z.ZodOptional<z.ZodNumber>;
            capacityScaler: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            group: string;
            balancingMode: "UTILIZATION" | "RATE";
            maxUtilization: number;
            capacityScaler: number;
            maxRatePerInstance?: number | undefined;
        }, {
            group: string;
            balancingMode?: "UTILIZATION" | "RATE" | undefined;
            maxUtilization?: number | undefined;
            maxRatePerInstance?: number | undefined;
            capacityScaler?: number | undefined;
        }>, "many">;
        healthChecks: z.ZodArray<z.ZodString, "many">;
        loadBalancingScheme: z.ZodDefault<z.ZodEnum<["INTERNAL", "EXTERNAL"]>>;
        protocol: z.ZodDefault<z.ZodEnum<["HTTP", "HTTPS", "HTTP2", "TCP", "UDP", "GRPC"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        healthChecks: string[];
        protocol: "HTTP" | "HTTPS" | "HTTP2" | "TCP" | "UDP" | "GRPC";
        backends: {
            group: string;
            balancingMode: "UTILIZATION" | "RATE";
            maxUtilization: number;
            capacityScaler: number;
            maxRatePerInstance?: number | undefined;
        }[];
        loadBalancingScheme: "INTERNAL" | "EXTERNAL";
    }, {
        name: string;
        healthChecks: string[];
        backends: {
            group: string;
            balancingMode?: "UTILIZATION" | "RATE" | undefined;
            maxUtilization?: number | undefined;
            maxRatePerInstance?: number | undefined;
            capacityScaler?: number | undefined;
        }[];
        protocol?: "HTTP" | "HTTPS" | "HTTP2" | "TCP" | "UDP" | "GRPC" | undefined;
        loadBalancingScheme?: "INTERNAL" | "EXTERNAL" | undefined;
    }>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        rateLimiter: z.ZodOptional<z.ZodObject<{
            enforceOnKey: z.ZodDefault<z.ZodEnum<["ALL", "IP", "HTTP_HEADER", "XFF_IP"]>>;
            enforceOnKeyName: z.ZodOptional<z.ZodString>;
            rateLimitThreshold: z.ZodObject<{
                count: z.ZodNumber;
                intervalSec: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                count: number;
                intervalSec: number;
            }, {
                count: number;
                intervalSec: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            enforceOnKey: "ALL" | "IP" | "HTTP_HEADER" | "XFF_IP";
            rateLimitThreshold: {
                count: number;
                intervalSec: number;
            };
            enforceOnKeyName?: string | undefined;
        }, {
            rateLimitThreshold: {
                count: number;
                intervalSec: number;
            };
            enforceOnKey?: "ALL" | "IP" | "HTTP_HEADER" | "XFF_IP" | undefined;
            enforceOnKeyName?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        rateLimiter?: {
            enforceOnKey: "ALL" | "IP" | "HTTP_HEADER" | "XFF_IP";
            rateLimitThreshold: {
                count: number;
                intervalSec: number;
            };
            enforceOnKeyName?: string | undefined;
        } | undefined;
    }, {
        enabled?: boolean | undefined;
        rateLimiter?: {
            rateLimitThreshold: {
                count: number;
                intervalSec: number;
            };
            enforceOnKey?: "ALL" | "IP" | "HTTP_HEADER" | "XFF_IP" | undefined;
            enforceOnKeyName?: string | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    region: string;
    backendService: {
        name: string;
        healthChecks: string[];
        protocol: "HTTP" | "HTTPS" | "HTTP2" | "TCP" | "UDP" | "GRPC";
        backends: {
            group: string;
            balancingMode: "UTILIZATION" | "RATE";
            maxUtilization: number;
            capacityScaler: number;
            maxRatePerInstance?: number | undefined;
        }[];
        loadBalancingScheme: "INTERNAL" | "EXTERNAL";
    };
    rateLimit?: {
        enabled: boolean;
        rateLimiter?: {
            enforceOnKey: "ALL" | "IP" | "HTTP_HEADER" | "XFF_IP";
            rateLimitThreshold: {
                count: number;
                intervalSec: number;
            };
            enforceOnKeyName?: string | undefined;
        } | undefined;
    } | undefined;
}, {
    name: string;
    region: string;
    backendService: {
        name: string;
        healthChecks: string[];
        backends: {
            group: string;
            balancingMode?: "UTILIZATION" | "RATE" | undefined;
            maxUtilization?: number | undefined;
            maxRatePerInstance?: number | undefined;
            capacityScaler?: number | undefined;
        }[];
        protocol?: "HTTP" | "HTTPS" | "HTTP2" | "TCP" | "UDP" | "GRPC" | undefined;
        loadBalancingScheme?: "INTERNAL" | "EXTERNAL" | undefined;
    };
    rateLimit?: {
        enabled?: boolean | undefined;
        rateLimiter?: {
            rateLimitThreshold: {
                count: number;
                intervalSec: number;
            };
            enforceOnKey?: "ALL" | "IP" | "HTTP_HEADER" | "XFF_IP" | undefined;
            enforceOnKeyName?: string | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const GCPAPIGatewayConfigSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    apiConfig: z.ZodObject<{
        name: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        openapiDocuments: z.ZodArray<z.ZodObject<{
            document: z.ZodObject<{
                path: z.ZodString;
                contents: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                path: string;
                contents: string;
            }, {
                path: string;
                contents: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            document: {
                path: string;
                contents: string;
            };
        }, {
            document: {
                path: string;
                contents: string;
            };
        }>, "many">;
        gatewayConfig: z.ZodOptional<z.ZodObject<{
            backendConfig: z.ZodOptional<z.ZodObject<{
                googleServiceAccount: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                googleServiceAccount?: string | undefined;
            }, {
                googleServiceAccount?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            backendConfig?: {
                googleServiceAccount?: string | undefined;
            } | undefined;
        }, {
            backendConfig?: {
                googleServiceAccount?: string | undefined;
            } | undefined;
        }>>;
        quota: z.ZodOptional<z.ZodObject<{
            limits: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                metric: z.ZodString;
                unit: z.ZodEnum<["MINUTE", "HOUR", "DAY"]>;
                values: z.ZodRecord<z.ZodString, z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }, {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            limits?: {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }[] | undefined;
        }, {
            limits?: {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        displayName: string;
        openapiDocuments: {
            document: {
                path: string;
                contents: string;
            };
        }[];
        description?: string | undefined;
        quota?: {
            limits?: {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }[] | undefined;
        } | undefined;
        gatewayConfig?: {
            backendConfig?: {
                googleServiceAccount?: string | undefined;
            } | undefined;
        } | undefined;
    }, {
        name: string;
        displayName: string;
        openapiDocuments: {
            document: {
                path: string;
                contents: string;
            };
        }[];
        description?: string | undefined;
        quota?: {
            limits?: {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }[] | undefined;
        } | undefined;
        gatewayConfig?: {
            backendConfig?: {
                googleServiceAccount?: string | undefined;
            } | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    displayName: string;
    apiConfig: {
        name: string;
        displayName: string;
        openapiDocuments: {
            document: {
                path: string;
                contents: string;
            };
        }[];
        description?: string | undefined;
        quota?: {
            limits?: {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }[] | undefined;
        } | undefined;
        gatewayConfig?: {
            backendConfig?: {
                googleServiceAccount?: string | undefined;
            } | undefined;
        } | undefined;
    };
    description?: string | undefined;
}, {
    name: string;
    displayName: string;
    apiConfig: {
        name: string;
        displayName: string;
        openapiDocuments: {
            document: {
                path: string;
                contents: string;
            };
        }[];
        description?: string | undefined;
        quota?: {
            limits?: {
                values: Record<string, string>;
                name: string;
                metric: string;
                unit: "DAY" | "MINUTE" | "HOUR";
            }[] | undefined;
        } | undefined;
        gatewayConfig?: {
            backendConfig?: {
                googleServiceAccount?: string | undefined;
            } | undefined;
        } | undefined;
    };
    description?: string | undefined;
}>;
export declare const InfrastructureConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["aws", "azure", "gcp"]>;
    region: z.ZodString;
    environment: z.ZodDefault<z.ZodEnum<["dev", "staging", "prod"]>>;
    tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    security: z.ZodOptional<z.ZodObject<{
        enableEncryption: z.ZodDefault<z.ZodBoolean>;
        enableLogging: z.ZodDefault<z.ZodBoolean>;
        enableMonitoring: z.ZodDefault<z.ZodBoolean>;
        complianceFrameworks: z.ZodOptional<z.ZodArray<z.ZodEnum<["SOC2", "HIPAA", "PCI-DSS", "GDPR"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        enableEncryption: boolean;
        enableLogging: boolean;
        enableMonitoring: boolean;
        complianceFrameworks?: ("SOC2" | "HIPAA" | "PCI-DSS" | "GDPR")[] | undefined;
    }, {
        enableEncryption?: boolean | undefined;
        enableLogging?: boolean | undefined;
        enableMonitoring?: boolean | undefined;
        complianceFrameworks?: ("SOC2" | "HIPAA" | "PCI-DSS" | "GDPR")[] | undefined;
    }>>;
    networking: z.ZodOptional<z.ZodObject<{
        vpc: z.ZodOptional<z.ZodAny>;
        loadBalancers: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        apiGateways: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        firewalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            direction: z.ZodEnum<["INGRESS", "EGRESS"]>;
            priority: z.ZodNumber;
            allowed: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ipProtocol: z.ZodString;
                ports: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                ipProtocol: string;
                ports?: string[] | undefined;
            }, {
                ipProtocol: string;
                ports?: string[] | undefined;
            }>, "many">>;
            denied: z.ZodOptional<z.ZodArray<z.ZodObject<{
                ipProtocol: z.ZodString;
                ports: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                ipProtocol: string;
                ports?: string[] | undefined;
            }, {
                ipProtocol: string;
                ports?: string[] | undefined;
            }>, "many">>;
            sourceRanges: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            destinationRanges: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            targetTags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            sourceTags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            priority: number;
            direction: "INGRESS" | "EGRESS";
            allowed?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            denied?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            sourceRanges?: string[] | undefined;
            destinationRanges?: string[] | undefined;
            targetTags?: string[] | undefined;
            sourceTags?: string[] | undefined;
        }, {
            name: string;
            priority: number;
            direction: "INGRESS" | "EGRESS";
            allowed?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            denied?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            sourceRanges?: string[] | undefined;
            destinationRanges?: string[] | undefined;
            targetTags?: string[] | undefined;
            sourceTags?: string[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        vpc?: any;
        loadBalancers?: any[] | undefined;
        apiGateways?: any[] | undefined;
        firewalls?: {
            name: string;
            priority: number;
            direction: "INGRESS" | "EGRESS";
            allowed?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            denied?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            sourceRanges?: string[] | undefined;
            destinationRanges?: string[] | undefined;
            targetTags?: string[] | undefined;
            sourceTags?: string[] | undefined;
        }[] | undefined;
    }, {
        vpc?: any;
        loadBalancers?: any[] | undefined;
        apiGateways?: any[] | undefined;
        firewalls?: {
            name: string;
            priority: number;
            direction: "INGRESS" | "EGRESS";
            allowed?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            denied?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            sourceRanges?: string[] | undefined;
            destinationRanges?: string[] | undefined;
            targetTags?: string[] | undefined;
            sourceTags?: string[] | undefined;
        }[] | undefined;
    }>>;
    rateLimiting: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        globalLimits: z.ZodOptional<z.ZodObject<{
            requestsPerSecond: z.ZodDefault<z.ZodNumber>;
            requestsPerMinute: z.ZodDefault<z.ZodNumber>;
            requestsPerHour: z.ZodDefault<z.ZodNumber>;
            burstMultiplier: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            requestsPerSecond: number;
            requestsPerMinute: number;
            requestsPerHour: number;
            burstMultiplier: number;
        }, {
            requestsPerSecond?: number | undefined;
            requestsPerMinute?: number | undefined;
            requestsPerHour?: number | undefined;
            burstMultiplier?: number | undefined;
        }>>;
        ipBasedLimits: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            whitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            blacklist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            whitelist?: string[] | undefined;
            blacklist?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            whitelist?: string[] | undefined;
            blacklist?: string[] | undefined;
        }>>;
        endpointLimits: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            requestsPerSecond: z.ZodNumber;
            requestsPerMinute: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            requestsPerSecond: number;
            requestsPerMinute?: number | undefined;
        }, {
            requestsPerSecond: number;
            requestsPerMinute?: number | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        globalLimits?: {
            requestsPerSecond: number;
            requestsPerMinute: number;
            requestsPerHour: number;
            burstMultiplier: number;
        } | undefined;
        ipBasedLimits?: {
            enabled: boolean;
            whitelist?: string[] | undefined;
            blacklist?: string[] | undefined;
        } | undefined;
        endpointLimits?: Record<string, {
            requestsPerSecond: number;
            requestsPerMinute?: number | undefined;
        }> | undefined;
    }, {
        enabled?: boolean | undefined;
        globalLimits?: {
            requestsPerSecond?: number | undefined;
            requestsPerMinute?: number | undefined;
            requestsPerHour?: number | undefined;
            burstMultiplier?: number | undefined;
        } | undefined;
        ipBasedLimits?: {
            enabled?: boolean | undefined;
            whitelist?: string[] | undefined;
            blacklist?: string[] | undefined;
        } | undefined;
        endpointLimits?: Record<string, {
            requestsPerSecond: number;
            requestsPerMinute?: number | undefined;
        }> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    environment: "dev" | "staging" | "prod";
    region: string;
    provider: "aws" | "azure" | "gcp";
    security?: {
        enableEncryption: boolean;
        enableLogging: boolean;
        enableMonitoring: boolean;
        complianceFrameworks?: ("SOC2" | "HIPAA" | "PCI-DSS" | "GDPR")[] | undefined;
    } | undefined;
    tags?: Record<string, string> | undefined;
    networking?: {
        vpc?: any;
        loadBalancers?: any[] | undefined;
        apiGateways?: any[] | undefined;
        firewalls?: {
            name: string;
            priority: number;
            direction: "INGRESS" | "EGRESS";
            allowed?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            denied?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            sourceRanges?: string[] | undefined;
            destinationRanges?: string[] | undefined;
            targetTags?: string[] | undefined;
            sourceTags?: string[] | undefined;
        }[] | undefined;
    } | undefined;
    rateLimiting?: {
        enabled: boolean;
        globalLimits?: {
            requestsPerSecond: number;
            requestsPerMinute: number;
            requestsPerHour: number;
            burstMultiplier: number;
        } | undefined;
        ipBasedLimits?: {
            enabled: boolean;
            whitelist?: string[] | undefined;
            blacklist?: string[] | undefined;
        } | undefined;
        endpointLimits?: Record<string, {
            requestsPerSecond: number;
            requestsPerMinute?: number | undefined;
        }> | undefined;
    } | undefined;
}, {
    region: string;
    provider: "aws" | "azure" | "gcp";
    security?: {
        enableEncryption?: boolean | undefined;
        enableLogging?: boolean | undefined;
        enableMonitoring?: boolean | undefined;
        complianceFrameworks?: ("SOC2" | "HIPAA" | "PCI-DSS" | "GDPR")[] | undefined;
    } | undefined;
    environment?: "dev" | "staging" | "prod" | undefined;
    tags?: Record<string, string> | undefined;
    networking?: {
        vpc?: any;
        loadBalancers?: any[] | undefined;
        apiGateways?: any[] | undefined;
        firewalls?: {
            name: string;
            priority: number;
            direction: "INGRESS" | "EGRESS";
            allowed?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            denied?: {
                ipProtocol: string;
                ports?: string[] | undefined;
            }[] | undefined;
            sourceRanges?: string[] | undefined;
            destinationRanges?: string[] | undefined;
            targetTags?: string[] | undefined;
            sourceTags?: string[] | undefined;
        }[] | undefined;
    } | undefined;
    rateLimiting?: {
        enabled?: boolean | undefined;
        globalLimits?: {
            requestsPerSecond?: number | undefined;
            requestsPerMinute?: number | undefined;
            requestsPerHour?: number | undefined;
            burstMultiplier?: number | undefined;
        } | undefined;
        ipBasedLimits?: {
            enabled?: boolean | undefined;
            whitelist?: string[] | undefined;
            blacklist?: string[] | undefined;
        } | undefined;
        endpointLimits?: Record<string, {
            requestsPerSecond: number;
            requestsPerMinute?: number | undefined;
        }> | undefined;
    } | undefined;
}>;
export type AWSCredentials = z.infer<typeof AWSCredentialsSchema>;
export type AWSVPCConfig = z.infer<typeof AWSVPCConfigSchema>;
export type AWSLoadBalancerConfig = z.infer<typeof AWSLoadBalancerConfigSchema>;
export type AWSAPIGatewayConfig = z.infer<typeof AWSAPIGatewayConfigSchema>;
export type AWSCloudFormationTemplate = z.infer<typeof AWSCloudFormationTemplateSchema>;
export type AzureCredentials = z.infer<typeof AzureCredentialsSchema>;
export type AzureLoadBalancerConfig = z.infer<typeof AzureLoadBalancerConfigSchema>;
export type AzureAPIManagementConfig = z.infer<typeof AzureAPIManagementConfigSchema>;
export type GCPCredentials = z.infer<typeof GCPCredentialsSchema>;
export type GCPLoadBalancerConfig = z.infer<typeof GCPLoadBalancerConfigSchema>;
export type GCPAPIGatewayConfig = z.infer<typeof GCPAPIGatewayConfigSchema>;
export type InfrastructureConfig = z.infer<typeof InfrastructureConfigSchema>;
//# sourceMappingURL=cloud-schemas.d.ts.map