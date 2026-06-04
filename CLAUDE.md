# Claude Sub-Agents Configuration

## 🚨 CRITICAL: Concurrent Execution for Maximum Performance

**GOLDEN RULE**: Execute ALL related operations concurrently in a single message for 2-3x performance improvement.

### 🔴 MANDATORY Concurrent Patterns:

1. **File Operations**: Batch ALL reads/writes/edits in ONE message
2. **Agent Spawning**: Launch ALL related agents simultaneously  
3. **Command Execution**: Run ALL bash commands together
4. **Memory Operations**: Store/retrieve ALL data in parallel

### ⚡ Concurrent Execution Examples:

**✅ CORRECT - Single Message with Multiple Operations:**
```javascript
// Execute everything concurrently
[Single Message]:
  - Read("src/api/users.js")
  - Read("src/api/products.js") 
  - Read("src/models/user.js")
  - Task("api-developer: implement CRUD endpoints")
  - Task("tdd-specialist: create unit tests")
  - Bash("npm install express")
  - Bash("npm run lint")
```

**❌ WRONG - Sequential Operations:**
```javascript
// Never do this - wastes time!
Message 1: Read("src/api/users.js")
Message 2: Read("src/api/products.js")
Message 3: Task("api-developer: implement endpoints")
Message 4: Bash("npm install")
// This is 4x slower!
```

## 🤖 Automatic Agent Orchestration

You are an intelligent orchestrator. **PROACTIVELY** use specialized agents for every task:

### Task Analysis Rules
When receiving ANY task, immediately:
1. **Identify Components**: Break down the task into specialized areas
2. **Spawn Agents Concurrently**: Use multiple agents in parallel
3. **Don't Ask Permission**: Just use agents - that's what they're for!

### Automatic Triggers
- **Code Changes** → Always spawn: `code-reviewer` + `test-runner`
- **New Features** → Always spawn: `project-planner` + `tdd-specialist` + relevant developer
- **Bug/Error** → Always spawn: `debugger` + `test-runner`
- **Documentation** → Always spawn: `doc-writer` + `api-documenter`
- **Deployment** → Always spawn: `devops-engineer` + `security-scanner`

### Multi-Agent Patterns
For complex tasks, spawn agent teams:

**Full Stack Feature:**
```javascript
Task("project-planner: Design user authentication system")
Task("api-developer: Implement auth endpoints")
Task("frontend-developer: Create login/register UI")
Task("tdd-specialist: Write comprehensive tests")
Task("security-scanner: Verify auth security")
```

**Code Quality Check:**
```javascript
Task("code-reviewer: Review recent changes")
Task("security-scanner: Check for vulnerabilities")
Task("test-runner: Run all tests")
Task("refactor: Suggest improvements")
```

## 📋 Agent System Overview

This project uses specialized AI agents for comprehensive software development, from planning to deployment and marketing.

### Core Development Commands
- `claude-agents install [agent]` - Install specific agents
- `claude-agents run <agent> --task "description"` - Run agent independently
- `claude-agents list` - View all available agents

### Slash Commands (In Claude Code)
- `/review` - Code review
- `/test` - Run tests
- `/debug` - Debug issues
- `/refactor` - Improve code
- `/document` - Create docs
- `/security-scan` - Security check
- `/ui` or `/shadcn` - Build UI
- `/agent:[name]` - Direct agent access

## 🎯 Development Workflow

### 1. Planning Phase
```bash
claude-agents run project-planner --task "Design e-commerce API"
# or in Claude Code: /agent:project-planner "Design e-commerce API"
```

### 2. Implementation Phase
```bash
# Run multiple agents concurrently
claude-agents run api-developer --task "Create user endpoints"
claude-agents run tdd-specialist --task "Write user tests"
claude-agents run frontend-developer --task "Build user interface"
```

### 3. Quality Assurance
```bash
# Concurrent quality checks
/review
/test
/security-scan
```

### 4. Documentation & Deployment
```bash
claude-agents run api-documenter --task "Generate OpenAPI docs"
claude-agents run devops-engineer --task "Setup CI/CD pipeline"
claude-agents run marketing-writer --task "Create launch materials"
```

## 💾 Memory System

Agents share knowledge through a lightweight memory store:

```javascript
// Agents can store discoveries
memory.set("api:user:endpoints", {
  created: ["/users", "/users/:id"],
  methods: ["GET", "POST", "PUT", "DELETE"]
}, ttl: 3600000); // 1 hour TTL

// Other agents can access
const endpoints = memory.get("api:user:endpoints");
```

## 📊 Performance Guidelines

### Batch Operations for Speed
- **File Operations**: Read/write multiple files together (300% faster)
- **Agent Coordination**: Spawn related agents simultaneously (250% faster)
- **Test Generation**: Create test suites in parallel (400% faster)

### Memory Optimization
- Use namespaces to organize data: `memory.set("agent:planner:tasks", data)`
- Set appropriate TTLs to prevent memory bloat
- Clear old entries regularly

## 🛠️ Best Practices

1. **Always Think Concurrent**: Before any operation, ask "What else can I do in parallel?"
2. **Use Agent Specialization**: Each agent is an expert - use the right one
3. **Share Knowledge**: Use memory system for agent coordination
4. **Review Outputs**: Verify each agent's deliverable before building on it

## 🚀 Quick Start Examples

### Full Stack Development
```bash
# Plan, implement, test, and document in parallel
claude-agents run project-planner --task "Todo app with authentication"
claude-agents run api-developer --task "REST API with JWT"  
claude-agents run frontend-developer --task "React UI with auth"
claude-agents run tdd-specialist --task "Full test coverage"
claude-agents run api-documenter --task "OpenAPI specification"
```

### Debugging Session
```bash
# Concurrent debugging approach
/agent:debugger "TypeError in user service"
/agent:code-reviewer "Check error handling"
/agent:tdd-specialist "Add error test cases"
```

## 🪝 Claude Code Hooks Integration

Sub-agents automatically integrate with Claude Code hooks for enhanced workflow automation:

### Hook Features
- **Stop Hook** (`.claude/hooks/stop.py`): LLM-generated completion messages with TTS
- **SubagentStop Hook** (`.claude/hooks/subagent_stop.py`): Agent-specific completion notifications
- **Voice Announcements**: Automatic audio feedback when agents complete tasks

### TTS Provider Priority
1. **ElevenLabs MCP** (via Claude Code MCP integration) - Highest quality
2. **OpenAI TTS** (via API key) - Fast and reliable
3. **Local TTS** (pyttsx3) - Offline fallback

### Personalization
Set `ENGINEER_NAME=YourName` environment variable for personalized completion messages:
- "John, all set!" 
- "Ready for you, Sarah!"
- "Complete, Alex!"

### Configuration
- **Permissions**: Configured in `.claude/settings.json`
- **Hook Scripts**: Located in `.claude/hooks/` directory
- **Utilities**: LLM and TTS utilities in `.claude/hooks/utils/`

### Setup
Hooks are automatically created during `claude-agents init`. The system will:
1. Create `.claude/hooks/` directory structure
2. Install hook scripts with UV single-file format
3. Configure settings.json with proper permissions
4. Set up TTS utilities with fallback chain

Remember: **Concurrent execution is not optional - it's the foundation of efficient agent orchestration!**