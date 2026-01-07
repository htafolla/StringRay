export interface ToolConfig {
  include?: string[];
  exclude?: string[];
  [key: string]: any;
}

export interface PermissionConfig {
  edit?: "ask" | "allow" | "deny";
  bash?: "ask" | "allow" | "deny" | {
    [command: string]: "ask" | "allow" | "deny";
  };
  webfetch?: "ask" | "allow" | "deny";
  [key: string]: any;
}

export interface AgentConfig {
  name: string;
  model: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  system: string;
  temperature?: number;
  top_p?: number;
  tools?: ToolConfig;
  permission?: PermissionConfig;
  prompt?: string;
  prompt_append?: string;
  disable?: boolean;
  color?: string;
}