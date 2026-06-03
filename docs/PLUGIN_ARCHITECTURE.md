# 0xRay Plugin Architecture Specification

## v1.0.0 - Draft

---

## 1. Overview

0xRay needs a plugin architecture to support:
- External MCP servers (like mcp-image-recognition)
- Community skills as plugins
- User-defined integrations
- Dynamic server discovery

### Goals
- Non-breaking - existing installs work
- Optional - users choose what to install
- Fallback - graceful degradation when plugins unavailable
- Discoverable - agents can find and use plugins

---

## 2. Core Concepts

### 2.1 Plugin Types

| Type | Description | Example |
|------|-------------|---------|
| `mcp-server` | External MCP server process | mcp-image-recognition |
| `skill` | Community skill from antigravity | antigravity--theme-factory |
| `integration` | Framework integration | hermes-agent, jelly |
| `agent` | Custom agent definition | User-defined agents |

### 2.2 Plugin Manifest

```yaml
# plugins/my-vision-plugin/plugin.yaml
name: vision-recognition
version: 1.0.0
type: mcp-server
description: Image recognition using Claude/OpenAI vision
license: MIT

# How to run this plugin
runtime:
  command: python
  args:
    - -m
    - image_recognition_server.server
  env:
    - ANTHROPIC_API_KEY  # Inherited from environment
    - VISION_PROVIDER: anthropic

# Tools provided by this plugin
tools:
  - name: describe_image
    description: Describe an image using vision API
    inputSchema:
      type: object
      properties:
        imageData:
          type: string
          description: Base64-encoded image
        mimeType:
          type: string
  - name: describe_image_from_file
    description: Describe an image from file path

# Capabilities this plugin provides
capabilities:
  - image-recognition
  - ocr
  - vision-analysis

# Dependencies
dependencies:
  - python3.8+
  - anthropic-sdk OR openai

# Configuration schema
config:
  vision_provider:
    type: string
    enum: [anthropic, openai]
    default: anthropic
  enable_ocr:
    type: boolean
    default: false
```

---

## 3. Plugin Registry

### 3.1 Registry Structure

```
.strray/
├── plugins/
│   ├── registry.json           # Master plugin list
│   ├── enabled.json            # Enabled plugins cache
│   ├── mcp-image-recognition/ # Plugin directory
│   │   ├── plugin.yaml         # Plugin manifest
│   │   ├── README.md
│   │   └── LICENSE
│   └── custom-skill/
│       └── plugin.yaml
└── config/
    └── plugin-config.json      # User overrides
```

### 3.2 Registry JSON

```json
{
  "version": "1.22.61",
  "plugins": [
    {
      "name": "mcp-image-recognition",
      "type": "mcp-server",
      "version": "1.22.61",
      "path": "plugins/mcp-image-recognition",
      "enabled": true,
      "autoStart": true,
      "tools": ["describe_image", "describe_image_from_file"],
      "config": {
        "vision_provider": "anthropic"
      }
    }
  ]
}
```

---

## 4. Plugin Lifecycle

### 4.1 States

```
UNINSTALLED → INSTALLED → ENABLED → ACTIVE
    ↑           ↓           ↓          ↓
    └───────────┴───────────┴──────────┘
              DISABLE        DEACTIVATE
```

| State | Description |
|-------|-------------|
| UNINSTALLED | Not present in plugins/ |
| INSTALLED | Files present, not registered |
| ENABLED | In registry, available to use |
| ACTIVE | Process running, tools available |

### 4.2 Lifecycle Methods

```typescript
interface Plugin {
  // Install: Copy files to plugins/
  install(context: PluginContext): Promise<InstallResult>;
  
  // Enable: Register in registry, validate
  enable(context: PluginContext): Promise<EnableResult>;
  
  // Activate: Spawn process, connect tools
  activate(context: PluginContext): Promise<ActivateResult>;
  
  // Deactivate: Stop process, release resources
  deactivate(context: PluginContext): Promise<void>;
  
  // Disable: Remove from active registry
  disable(context: PluginContext): Promise<void>;
  
  // Uninstall: Remove files
  uninstall(context: PluginContext): Promise<void>;
}
```

---

## 5. Integration Points

### 5.1 MCP Server Registry Integration

```typescript
// Current (hardcoded)
const registry = new ServerConfigRegistry();
registry.register({ serverName: 'code-review', ... });

// New (plugin-aware)
const registry = new ServerConfigRegistry();
const pluginManager = new PluginManager();

// Load built-in servers first
registry.registerBuiltinServers();

// Then load plugins
for (const plugin of pluginManager.getActivePlugins('mcp-server')) {
  registry.register(plugin.getServerConfig());
}
```

### 5.2 Agent Integration

```typescript
// multimodal-looker agent config
const multimodalLooker: AgentConfig = {
  name: 'multimodal-looker',
  tools: {
    include: ['read', 'grep', ...],
    mcp: [
      'mcp-image-recognition/describe_image',
      'mcp-image-recognition/describe_image_from_file',
    ],
  },
  // Fallback when MCP not available
  fallbackTools: ['read'], // Use LLM vision via read
};
```

### 5.3 Skill Routing Integration

```typescript
// Add plugin skills to enforcer routing
const pluginSkills = pluginManager.getPluginSkills();
for (const skill of pluginSkills) {
  enforcerTools.addRoutingMapping(skill.keywords, skill.agent, skill.confidence);
}
```

---

## 6. Configuration Files

### 6.1 User Plugin Config (.strray/config/plugin-config.json)

```json
{
  "plugins": {
    "mcp-image-recognition": {
      "enabled": true,
      "config": {
        "vision_provider": "anthropic",
        "enable_ocr": true,
        "fallback_provider": "openai"
      }
    },
    "antigravity--theme-factory": {
      "enabled": true
    }
  },
  "defaults": {
    "autoActivate": true,
    "fallbackToLLM": true
  }
}
```

---

## 7. CLI Commands

```bash
# List available plugins
npx strray-ai plugin list

# Install a plugin
npx strray-ai plugin install mcp-image-recognition

# Enable a plugin
npx strray-ai plugin enable mcp-image-recognition

# Disable a plugin
npx strray-ai plugin disable mcp-image-recognition

# Plugin status
npx strray-ai plugin status mcp-image-recognition

# Update a plugin
npx strray-ai plugin update mcp-image-recognition

# Uninstall
npx strray-ai plugin uninstall mcp-image-recognition
```

---

## 8. Fallback Strategy

For multimodal-looker:

```typescript
// Primary: Use MCP server if available
try {
  const result = await mcpClient.callTool('mcp-image-recognition', 'describe_image', { imageData });
} catch (e) {
  // Fallback 1: Use simulation (for testing)
  if (isSimulationMode) {
    return simulateImageDescription(imageData);
  }
  
  // Fallback 2: Use LLM's built-in vision via read tool
  const llmResult = await readTool(imageFile);
  return describeWithLLM(llmResult.content);
}
```

---

## 9. Directory Structure

```
src/
├── plugins/
│   ├── plugin-manager.ts       # Core plugin lifecycle
│   ├── plugin-registry.ts      # Plugin storage/lookup
│   ├── plugin-loader.ts       # Dynamic loading
│   ├── handlers/
│   │   ├── mcp-server-plugin.ts
│   │   ├── skill-plugin.ts
│   │   └── integration-plugin.ts
│   └── types/
│       └── plugin.types.ts
└── mcps/
    └── config/
        └── plugin-server-registry.ts  # MCP plugin integration
```

---

## 10. Migration Path

### Phase 1: Plugin Infrastructure
- Create plugin types and interfaces
- Build PluginManager
- Add CLI commands

### Phase 2: MCP Integration
- Extend ServerConfigRegistry for plugins
- Add plugin config to features.json
- Implement fallback logic

### Phase 3: Discovery & Loading
- Auto-discover plugins in .strray/plugins/
- Load on startup
- Cache enabled state

### Phase 4: Example Plugin
- Package mcp-image-recognition as plugin
- Document installation

---

## 11. Example: mcp-image-recognition Integration

### Install
```bash
npx strray-ai plugin install mcp-image-recognition
```

### Config (.strray/config/plugin-config.json)
```json
{
  "plugins": {
    "mcp-image-recognition": {
      "enabled": true,
      "config": {
        "vision_provider": "anthropic"
      }
    }
  }
}
```

### Usage in Agent
```yaml
# .opencode/agents/multimodal-looker.yml
name: multimodal-looker
skill: multimodal-looker
mcpServers:
  - mcp-image-recognition
tools:
  include:
    - read
    - mcp-image-recognition/describe_image
    - mcp-image-recognition/describe_image_from_file
fallback:
  - read  # Use LLM vision
```

---

## 12. Open Questions

1. **Version pinning**: Should plugins pin exact versions?
2. **Sandboxing**: How to isolate plugin processes?
3. **Auto-update**: Check for updates on startup?
4. **Plugin dependencies**: Handle plugin-to-plugin deps?
5. **Built-in plugins**: Ship some plugins by default?

---

## 13. Success Criteria

- [ ] Can install/uninstall mcp-image-recognition
- [ ] Plugin available to agents without code changes
- [ ] Fallback works when plugin unavailable
- [ ] CLI provides plugin management
- [ ] Non-breaking for existing installations
