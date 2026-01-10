  beforeEach(() => {
    // Mock the config loader to enable multi-agent orchestration
    vi.mocked(strRayConfigLoader.loadConfig).mockReturnValue({
      multi_agent_orchestration: {
        enabled: true,
        max_concurrent_agents: 5,
        coordination_model: "async-multi-agent"
      }
    });
    vi.clearAllMocks();
    stateManager = new StrRayStateManager();
    agentDelegator = createAgentDelegator(stateManager);
