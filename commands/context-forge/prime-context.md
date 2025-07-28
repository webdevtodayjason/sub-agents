---
name: prime-context
description: Load project context and detect context-forge structure
category: context
---

# Prime Context: $ARGUMENTS

## Objective
Load essential project knowledge and determine if this is a context-forge project. Adapt behavior based on detection.

## Steps

1. **Detect Context-Forge Structure**
   - Check for `CLAUDE.md` file
   - Look for `Docs/Implementation.md`
   - Scan `PRPs/` directory
   - Check `.claude/commands/` and `.claude/hooks/`

2. **If Context-Forge Detected**
   
   **Read Core Files**:
   - Read `CLAUDE.md` to understand project rules
   - Review `Docs/Implementation.md` for current progress
   - List available PRPs in `PRPs/` directory
   - Check available slash commands in `.claude/commands/`
   
   **Understand Project State**:
   - Identify current implementation stage
   - Check completed vs pending tasks
   - Note available validation commands
   - Understand tech stack and conventions
   
   **Agent Coordination**:
   - Store context-forge detection in memory
   - Share available PRPs with all agents
   - Track implementation progress
   - Note validation gates for agents to use

3. **If Standard Project**
   
   **Analyze Structure**:
   - Identify project type and tech stack
   - Look for existing documentation
   - Understand file organization
   - Note testing approach
   
   **Prepare for Planning**:
   - Suggest running project-planner agent
   - Identify areas needing documentation
   - Note missing structure elements

## Output Format

### Context-Forge Project
```
✅ Context-Forge Project Detected

📋 Project Overview:
- Name: [from CLAUDE.md]
- Tech Stack: [list technologies]
- Current Stage: [X of Y]
- Progress: [X% complete]

📁 Available Resources:
- PRPs: [list available PRPs]
- Commands: [count] slash commands
- Hooks: [list active hooks]

🎯 Recommended Actions:
1. Continue with Stage [X] tasks
2. Use existing PRP: [relevant PRP]
3. Run validation: [command]

💡 Key Conventions:
- [Important rules from CLAUDE.md]
```

### Standard Project
```
📦 Standard Project Structure

📋 Project Analysis:
- Type: [frontend/backend/fullstack]
- Language: [detected language]
- Framework: [if detected]

🔍 Structure Found:
- Source files: [location]
- Tests: [location or "not found"]
- Documentation: [location or "minimal"]

🎯 Recommended Actions:
1. Run project-planner agent for comprehensive planning
2. Consider using context-forge to scaffold structure
3. Document existing code patterns

💡 Quick Start:
claude-agents run project-planner --task "Create development plan"
```

## Memory Integration

Store findings for agent coordination:
```javascript
// For context-forge projects
memory.set('context:type', 'context-forge');
memory.set('context:stage', currentStage);
memory.set('context:prps', availablePRPs);

// For standard projects  
memory.set('context:type', 'standard');
memory.set('context:structure', projectStructure);
memory.set('context:needs', ['planning', 'documentation']);
```