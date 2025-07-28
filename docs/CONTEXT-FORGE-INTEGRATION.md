# Context-Forge Integration Guide

## Overview

The Claude Sub-Agents system now seamlessly integrates with context-forge projects, providing intelligent awareness and adaptation without modifying context-forge at all.

## What We Built

### 1. Context-Forge Detection System
- **Module**: `src/utils/contextForgeDetector.js`
- Detects context-forge project structure
- Parses CLAUDE.md, PRPs, Implementation.md
- Lists available slash commands and hooks
- Creates context-aware configurations

### 2. Enhanced Agent System
- **Module**: `src/utils/agents.js` 
- Agents automatically detect context-forge projects
- Inject context-specific instructions
- Provide runtime behaviors based on project type
- Respect existing conventions and structures

### 3. Memory Integration
- **Module**: `src/memory/index.js`
- Stores context-forge configuration in memory
- Tracks PRP execution states
- Monitors implementation progress
- Shares context across all agents

### 4. Context-Aware Commands
- **Location**: `commands/context-forge/`
- `prime-context.md` - Smart project detection
- `prp-execute.md` - Execute PRPs with validation
- `continue-implementation.md` - Follow implementation plans
- `implementation-status.md` - Track progress

## How It Works

### Detection Flow
1. Agent starts → Checks for context-forge markers
2. If detected → Read project configuration
3. Load PRPs, commands, implementation plan
4. Store in memory for coordination
5. Inject context instructions into agent

### Agent Behavior Changes

**In Context-Forge Projects:**
- Read existing files before creating new ones
- Use PRPs instead of creating duplicate plans
- Follow validation gates from PRPs
- Respect Implementation.md stages
- Track progress in memory

**In Standard Projects:**
- Normal agent behavior
- Can suggest using context-forge
- Create new plans and structures

## Usage Examples

### 1. Project Planning
```bash
# The project-planner detects context-forge automatically
claude-agents run project-planner --task "Review project status"

# Output will reference existing PRPs and implementation stages
```

### 2. PRP Execution
```bash
# API developer uses existing PRP
claude-agents run api-developer --prp feature-auth-prp

# Follows PRP blueprint and validation gates
```

### 3. Progress Tracking
```bash
# Check implementation status
claude-agents run project-planner --task "Show current progress"

# Memory tracks PRP states and stage completion
```

## Benefits

1. **Zero Conflicts**: Works WITH context-forge, not against it
2. **No Duplication**: Uses existing PRPs and plans
3. **Progress Continuity**: Tracks where you left off
4. **Team Coordination**: All agents share context
5. **Validation Respect**: Follows PRP gates

## Technical Implementation

### Context Detection
```javascript
const detection = detectContextForge(projectPath);
if (detection.hasContextForge) {
  // Adapt behavior
}
```

### Agent Enhancement
```javascript
const agent = createContextAwareAgent(agentName, projectPath);
// Agent now includes context instructions
```

### Memory Tracking
```javascript
memory.updatePRPState('feature-auth-prp.md', {
  executed: true,
  validationPassed: true
});
```

## Testing

Run integration tests:
```bash
node test/context-forge-integration.test.js
```

Test with real project:
```bash
node test-real-project.js
```

## Future Enhancements

1. **Hook Integration**: Trigger context-forge hooks from agents
2. **Dashboard Updates**: Show PRP progress in dashboard
3. **Command Bridge**: Direct integration with slash commands
4. **Validation Runner**: Automated validation gate execution
5. **Cross-Project Learning**: Share patterns across projects

## Conclusion

The Claude Sub-Agents system now provides intelligent, non-invasive integration with context-forge projects. Agents automatically detect and respect existing structures while enhancing development workflows with specialized capabilities.