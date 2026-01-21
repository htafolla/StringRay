# MCP Server Migration Plan: From Auto-Start to Lazy Loading

## Executive Summary
Migrate from current auto-starting MCP servers to oh-my-opencode's lazy loading model for 90%+ resource reduction and better lifecycle management.

## Current State Analysis
- ✅ 23 MCP servers configured in .mcp.json
- ✅ All servers auto-start on opencode load (17 node processes)
- ✅ Direct MCP integration via MCPClient
- ✅ Basic shutdown handling with parent monitoring
- ❌ No lazy loading or on-demand startup
- ❌ No idle cleanup or session management
- ❌ No skills system integration

## Target State (oh-my-opencode Model)
- ✅ MCP servers defined in .mcp.json (same config)
- ✅ Lazy loading - servers start only when tools used
- ✅ Skills system integration (not direct MCP calls)
- ✅ Session-based connection management
- ✅ Automatic idle cleanup (5min timeout)
- ✅ Proper graceful shutdown with signal handlers
- ✅ Resource-efficient (near-zero baseline usage)

## Migration Phases

### Phase 1: Skills System Integration (Week 1)
**Goal**: Move from direct MCP calls to skills-based integration

#### Tasks:
1.1 **Create Skill Definitions** (.opencode/skills/)
   - Convert each MCP server to a skill
   - Define skill metadata (name, description, tools)
   - Map MCP tools to skill tools

1.2 **Update Plugin Integration**
   - Modify plugin to use skills system instead of direct MCP
   - Remove direct MCPClient usage
   - Integrate with oh-my-opencode's SkillMcpManager

1.3 **Test Skills Loading**
   - Verify skills appear in available skills list
   - Test lazy loading (servers start on skill invocation)
   - Confirm tools are accessible through skills

### Phase 2: Lifecycle Management (Week 1-2)
**Goal**: Implement proper connection lifecycle management

#### Tasks:
2.1 **Session-Based Connections**
   - Implement per-session MCP client management
   - Add connection caching with session isolation
   - Test connection reuse within sessions

2.2 **Idle Cleanup System**
   - Implement 5-minute idle timeout cleanup
   - Add cleanup timer management
   - Test automatic cleanup of unused connections

2.3 **Enhanced Shutdown Handling**
   - Upgrade signal handlers to match oh-my-opencode's implementation
   - Add async cleanup with proper error handling
   - Test graceful shutdown on opencode termination

### Phase 3: Configuration Optimization (Week 2)
**Goal**: Remove auto-start configuration and optimize for lazy loading

#### Tasks:
3.1 **Remove Auto-Start Configuration**
   - Clear .mcp.json to prevent auto-loading
   - Update oh-my-opencode.json to enable skills system
   - Verify no servers start on opencode launch

3.2 **Skills Configuration**
   - Configure skills in appropriate directories
   - Set up skill loading priorities (user > project > builtin)
   - Test skill discovery and loading

3.3 **Integration Testing**
   - Test end-to-end skill invocation
   - Verify lazy MCP server startup
   - Confirm proper cleanup on session end

### Phase 4: Performance Optimization (Week 2-3)
**Goal**: Optimize resource usage and performance

#### Tasks:
4.1 **Resource Monitoring**
   - Add metrics for connection count and resource usage
   - Monitor baseline resource consumption
   - Track connection lifecycle events

4.2 **Connection Pooling**
   - Implement connection reuse optimization
   - Add connection health checking
   - Optimize reconnection logic

4.3 **Error Recovery**
   - Enhance error handling and recovery
   - Add connection retry logic
   - Implement circuit breaker patterns

### Phase 5: Production Deployment (Week 3)
**Goal**: Deploy optimized system to production

#### Tasks:
5.1 **Final Testing**
   - Comprehensive integration testing
   - Performance benchmarking (before/after comparison)
   - Error scenario testing

5.2 **Documentation Updates**
   - Update README and architecture docs
   - Document new skills-based integration
   - Create migration guide for users

5.3 **Deployment & Monitoring**
   - Deploy to production environment
   - Monitor resource usage improvements
   - Set up alerting for connection issues

## Success Metrics

### Quantitative Metrics
- **Resource Reduction**: 90%+ reduction in baseline node processes
- **Startup Time**: opencode startup time unchanged (no server loading)
- **Memory Usage**: Baseline memory usage reduced by 500MB+
- **Connection Efficiency**: 95%+ connection reuse rate

### Qualitative Metrics
- **User Experience**: Skills load instantly, no startup delays
- **Reliability**: Proper cleanup prevents zombie processes
- **Maintainability**: Skills system provides better organization
- **Scalability**: Easy to add new MCP servers as skills

## Risk Mitigation

### Rollback Plan
- Keep current .mcp.json as backup
- Maintain direct MCP integration as fallback
- Document rollback procedures

### Testing Strategy
- Unit tests for each component
- Integration tests for skills system
- Performance tests for resource usage
- End-to-end tests for user workflows

### Monitoring Plan
- Connection count monitoring
- Resource usage tracking
- Error rate monitoring
- Performance benchmarking

## Timeline & Milestones

### Week 1: Foundation
- [ ] Skill definitions created
- [ ] Plugin integration updated
- [ ] Basic lazy loading working

### Week 2: Optimization
- [ ] Lifecycle management complete
- [ ] Configuration optimized
- [ ] Performance testing passed

### Week 3: Production
- [ ] Full integration testing
- [ ] Documentation updated
- [ ] Production deployment

## Dependencies & Prerequisites

### Technical Requirements
- oh-my-opencode plugin architecture understanding
- MCP protocol knowledge
- Skills system familiarity
- Node.js async/await patterns

### Resource Requirements
- Development environment with opencode
- Test MCP servers for validation
- Performance monitoring tools
- Documentation tools

## Post-Migration Benefits

1. **Resource Efficiency**: Near-zero baseline resource usage
2. **Better UX**: Instant skill availability without startup delays
3. **Maintainability**: Skills system provides better organization
4. **Scalability**: Easy addition of new MCP capabilities
5. **Reliability**: Proper lifecycle management prevents issues

## Conclusion

This migration will transform our MCP server integration from a resource-intensive auto-start system to an efficient, lazy-loaded skills-based system that matches oh-my-opencode's best practices. The result will be significantly better performance, reliability, and user experience.