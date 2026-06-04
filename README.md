> [!IMPORTANT]
> ## 🗄️ This project is archived (June 2026)
>
> **`@webdevtoday/claude-agents` is no longer maintained.** When it was built (mid-2025) it filled a real gap: there was no first-class way to install and manage a pack of subagents, slash commands, and hooks in Claude Code. **Claude Code now provides all of that natively** — so a framework that copies these files into your project is no longer needed.
>
> **Use the built-in primitives instead:**
> - **Subagents** — specialized workers with their own context, auto-delegated by description → https://code.claude.com/docs/en/sub-agents
> - **Skills** — reusable workflows/knowledge invoked with `/name` or auto-loaded (custom slash commands have been **merged into skills**) → https://code.claude.com/docs/en/skills
> - **Hooks** — event-driven automation → https://code.claude.com/docs/en/hooks
> - **Plugins + marketplaces** — the modern way to package and share a bundle of agents/skills/hooks/MCP across projects and teams → https://code.claude.com/docs/en/plugins
> - **Memory** — CLAUDE.md plus native auto-memory replace the in-process "memory" store this tool simulated → https://code.claude.com/docs/en/memory
>
> The final release (`v1.5.5`) is left intact for reference. Thanks to everyone who used or contributed to it. The content below is preserved as historical documentation.

---

# Claude Sub-Agents Manager - AI-Powered Development Assistants for Claude Code

<div align="center">

![Claude Sub-Agents](https://img.shields.io/badge/Claude-Sub--Agents-blue?style=for-the-badge&logo=anthropic)
[![npm version](https://img.shields.io/npm/v/@webdevtoday/claude-agents?style=flat-square)](https://www.npmjs.com/package/@webdevtoday/claude-agents)
[![npm downloads](https://img.shields.io/npm/dm/@webdevtoday/claude-agents?style=flat-square)](https://www.npmjs.com/package/@webdevtoday/claude-agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/webdevtodayjason/sub-agents.svg?style=flat-square)](https://github.com/webdevtodayjason/sub-agents/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg?style=flat-square)](https://github.com/webdevtodayjason)

**🚀 Supercharge Claude Code with Specialized AI Sub-Agents for Code Review, Testing, Debugging & More**

**Transform your development workflow with intelligent AI assistants that excel at specific programming tasks**

[Installation](#-installation) • [Quick Start](#-quick-start) • [Available Agents](#-available-sub-agents) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🎯 What is Claude Sub-Agents Manager?

Claude Sub-Agents Manager is a powerful CLI tool that enhances Claude Code with specialized AI assistants designed for specific development tasks. Each sub-agent is an expert in its domain - from automated code reviews and test fixing to intelligent debugging and documentation generation. Install production-ready agents instantly or create custom agents tailored to your unique workflow needs.

### ✨ Why Claude Sub-Agents?

- **🧠 Specialized Intelligence**: Each agent is an expert in its domain
- **⚡ Zero Configuration**: Pre-built agents work out of the box
- **🎨 Fully Customizable**: Create agents that match your workflow
- **🔄 Smart Context Management**: Agents operate in isolated contexts
- **🛠️ Developer First**: Built by developers, for developers
- **🔗 Context-Forge Integration**: Seamlessly works with context-forge projects and PRPs

### 🎉 New in v1.5.1 - Enhanced Voice Integration & Hook Improvements

- **🔊 Voice Announcements**: Real-time audio feedback when agents complete tasks
- **🎙️ ElevenLabs Integration**: High-quality voice synthesis with Sarah voice
- **🪝 Improved Hook System**: Better settings.json merging during updates
- **🔧 Voice Setup Wizard**: Interactive configuration with `claude-agents voice --setup`
- **📢 Auto-Announcements**: Hear when sub-agents complete tasks in Claude Code
- **🎯 FFmpeg Detection**: Automatic detection and installation guidance

### 📦 New in v1.5.0 - Voice Features, Chaining & Meta-Agent

- **🔗 Agent Chaining**: Run multiple agents in powerful sequences with data handoffs
- **🤖 Meta-Agent**: Automatically generate new specialized agents from descriptions
- **🎙️ Multiple TTS Providers**: ElevenLabs (via MCP), OpenAI, and local system TTS
- **⚙️ Voice Configuration**: Easy setup with `claude-agents voice` command
- **🎯 Enhanced Orchestration**: Context-preserving handoffs between agents

### 📦 New in v1.4.0 - Context-Forge Integration

- **🛠️ Full Context-Forge Support**: Automatic detection and smart integration
- **📦 Init Command**: `claude-agents init` for one-command project setup
- **🧹 Uninstall Command**: Bulk removal with cleanup options
- **📁 Smart Command Organization**: No conflicts with existing context-forge commands
- **⚡ Concurrent Execution Rules**: Enforces best practices for maximum performance
- **📝 CLAUDE.md Integration**: Appends configuration without overwriting
- **🎯 PRP Awareness**: Agents understand and work with your existing PRPs

## 🚀 Installation

### NPM (Recommended)
```bash
# Install latest version
npm install -g @webdevtoday/claude-agents@latest

# Or install without @latest (gets latest by default)
npm install -g @webdevtoday/claude-agents
```

### Yarn
```bash
# Install latest version
yarn global add @webdevtoday/claude-agents@latest
```

### From Source
```bash
git clone https://github.com/webdevtodayjason/sub-agents.git
cd sub-agents
npm install
npm link
```

### 🔄 Updating Existing Installation

If you already have claude-agents installed:

```bash
# Update to latest version
npm update -g @webdevtoday/claude-agents@latest

# Or with yarn
yarn global upgrade @webdevtoday/claude-agents@latest
```

After updating the package, **update your projects** to get the latest features:

```bash
# In your project directory, run init to update hooks and configurations
claude-agents init

# This will:
# - Update Claude Code hooks to latest versions
# - Merge new hook configurations into existing settings.json
# - Add any new agent features
# - Preserve your existing configurations
```

## ⚡ Quick Start

### For New Projects
```bash
# Initialize all agents in your project
claude-agents init

# List available agents
claude-agents list
```

### For Context-Forge Projects
```bash
# Initialize with context-forge awareness
claude-agents init --respect-context-forge

# Agents will:
# - Detect existing PRPs and CLAUDE.md
# - Place commands in .claude/commands/agents/
# - Append to CLAUDE.md without overwriting
# - Work alongside your existing setup
```

## 🔊 Voice Setup (Optional)

Voice announcements provide real-time audio feedback when agents complete tasks in Claude Code.

### Quick Setup
```bash
# Run the interactive setup wizard
claude-agents voice --setup

# Or configure manually
claude-agents voice --enable
claude-agents voice --provider mcp  # or openai, local
```

### Voice Requirements

#### Basic Voice (Local TTS)
- **No additional requirements** - works out of the box
- Uses system text-to-speech (macOS/Windows/Linux)

#### High-Quality Voice (ElevenLabs/OpenAI)
- **FFmpeg**: Required for audio playback
  - macOS: `brew install ffmpeg`
  - Windows: `choco install ffmpeg` or download from ffmpeg.org
  - Linux: `sudo apt-get install ffmpeg`
- **API Keys**: 
  - ElevenLabs: Get from [elevenlabs.io](https://elevenlabs.io)
  - OpenAI: Get from [platform.openai.com](https://platform.openai.com)

### Voice Features
- **Auto-Announcements**: Hear when sub-agents complete tasks
- **AI Summaries**: OpenAI/Anthropic generates contextual completion messages
- **Multiple Providers**: ElevenLabs (best quality), OpenAI, or local TTS
- **Claude Code Integration**: Works seamlessly with hooks system

### Testing Voice
```bash
# Test with default message
claude-agents voice --test

# Test with custom message
claude-agents voice --test "Hello from Claude Agents"

# Check voice status
claude-agents voice --status
```

### Example Agent Tasks

```bash
# Project Planning - Reads and understands your PRPs
claude-agents run project-planner --task "Create implementation roadmap from existing PRPs"
claude-agents run project-planner --task "Break down auth-prp into sprint tasks"

# API Development - PRP-aware implementation
claude-agents run api-developer --task "Implement user endpoints from feature-auth-prp.md"
claude-agents run api-developer --task "Create REST API following our conventions"

# Frontend Development
claude-agents run frontend-developer --task "Build login UI matching dark-theme-ui-prp"
claude-agents run frontend-developer --task "Create dashboard from feature-dashboard-prp.md"

# Testing & Quality
claude-agents run tdd-specialist --task "Create tests for authentication flow"
claude-agents run code-reviewer --task "Review API endpoints for security"
claude-agents run security-scanner --task "Scan authentication implementation"

# Documentation
claude-agents run api-documenter --task "Generate OpenAPI spec from implemented endpoints"
claude-agents run doc-writer --task "Update Implementation.md with progress"

# Debugging & Refactoring
claude-agents run debugger --task "Analyze login timeout issue"
claude-agents run refactor --task "Improve error handling in auth module"

# DevOps & Deployment
claude-agents run devops-engineer --task "Setup CI/CD for main branch"
claude-agents run devops-engineer --task "Create Docker configuration"

# Product & Marketing
claude-agents run product-manager --task "Create user stories from PRPs"
claude-agents run marketing-writer --task "Write feature announcement for auth system"

# Agent Chaining - NEW!
claude-agents chain feature-development  # Full development pipeline
claude-agents chain api-developer frontend-developer --task "Build user feature"
claude-agents chain debugger api-developer test-runner --voice  # With voice announcements
```

### Using in Claude Code
```bash
# Via slash commands (in .claude/commands/agents/)
> /agent-review            # Triggers code review
> /agent-api              # Triggers API development
> /agent-debug login issue # Debug specific problem

# Via Task tool
> Task("project-planner: analyze all PRPs and create sprint plan")
> Task("api-developer: implement endpoints from feature-auth-prp.md")
> Task("frontend-developer: build UI from feature-dashboard-prp.md")
```

## 📋 Available Sub-Agents

| Agent Name | Description | Slash Command |
|------------|-------------|---------------|
| **code-reviewer** | Expert code review specialist for quality, security, and maintainability | `/review` |
| **test-runner** | Automated test execution specialist that runs tests and fixes failures | `/test [pattern]` |
| **debugger** | Expert debugging specialist for analyzing errors, stack traces, and fixing issues | `/debug [error]` |
| **refactor** | Code refactoring specialist for improving code structure, patterns, and maintainability | `/refactor [target]` |
| **doc-writer** | Documentation specialist for creating and updating technical documentation, API docs, and README files | `/document [type]` |
| **security-scanner** | Security vulnerability scanner that detects common security issues and suggests fixes | `/security-scan [path]` |
| **shadcn-ui-builder** | UI/UX specialist for designing and implementing interfaces using ShadCN UI components | `/ui` or `/shadcn` |
| **project-planner** | Strategic planning specialist for project decomposition and workflow management | `/plan [project]` |
| **api-developer** | Backend API development specialist for REST, GraphQL, and microservices | `/api [spec]` |
| **frontend-developer** | Frontend development specialist for modern web applications | `/frontend [feature]` |
| **tdd-specialist** | Test-Driven Development specialist for comprehensive testing strategies | `/tdd [component]` |
| **api-documenter** | API documentation specialist for OpenAPI, Swagger, and technical docs | `/apidoc [endpoint]` |
| **devops-engineer** | DevOps specialist for CI/CD, infrastructure automation, and deployment | `/devops [task]` |
| **product-manager** | Product management specialist for requirements, roadmaps, and user stories | `/product [feature]` |
| **marketing-writer** | Marketing content specialist for technical marketing and product messaging | `/marketing [content]` |
| **meta-agent** | Agent generator that creates new specialized agents from descriptions | `/meta [description]` |

## 🤖 Detailed Agent Descriptions

### 🔍 Code Reviewer
*Your personal code quality guardian*

- Comprehensive security analysis
- Best practices enforcement
- Performance optimization suggestions
- Clean code principles

```bash
# Install
claude-agents install code-reviewer

# Use
> /review
```

### 🧪 Test Runner
*Intelligent test automation specialist*

- Auto-detects test frameworks
- Fixes failing tests automatically
- Improves test coverage
- Supports all major languages

```bash
# Install
claude-agents install test-runner

# Use
> /test
> /test src/**/*.test.js
```

### 🐛 Debugger
*Expert problem solver and bug hunter*

- Root cause analysis
- Stack trace interpretation
- Performance profiling
- Memory leak detection

```bash
# Install
claude-agents install debugger

# Use
> /debug Cannot read property 'map' of undefined
```

### 🔧 Refactor Assistant
*Code transformation specialist*

- Apply design patterns
- Modernize legacy code
- Improve code structure
- Maintain functionality

```bash
# Install
claude-agents install refactor

# Use
> /refactor improve performance
> /refactor apply SOLID principles
```

### 📝 Documentation Writer
*Technical writing expert*

- API documentation
- README generation
- Architecture docs
- Code comments

```bash
# Install
claude-agents install doc-writer

# Use
> /document API
> /document architecture
```

### 🔒 Security Scanner
*Vulnerability detection specialist*

- Secret detection
- OWASP compliance
- Dependency auditing
- Security best practices

```bash
# Install
claude-agents install security-scanner

# Use
> /security-scan
> /security-scan src/api/
```

### 🎨 ShadCN UI Builder
*Your expert UI/UX implementation specialist*

- Modern component-based UI development
- Accessibility-first design approach
- Responsive interface implementation
- ShadCN component ecosystem expertise
- Design system compliance

```bash
# Install
claude-agents install shadcn-ui-builder

# Use
> /ui create a login page
> /shadcn implement dashboard with sidebar
```

### 📋 Project Planner
*Strategic planning and task decomposition expert*

- Project architecture design
- Task breakdown and prioritization
- Dependency mapping
- Timeline estimation
- Risk assessment

```bash
# Install
claude-agents install project-planner

# Use
> /plan e-commerce platform
> /plan microservices migration
```

### 🔌 API Developer
*Backend development specialist*

- RESTful API design
- GraphQL implementation
- Microservices architecture
- Database schema design
- API security best practices

```bash
# Install
claude-agents install api-developer

# Use
> /api user authentication endpoints
> /api payment processing service
```

### 💻 Frontend Developer
*Modern web interface specialist*

- React/Vue/Angular expertise
- Responsive design implementation
- State management
- Performance optimization
- Accessibility compliance

```bash
# Install
claude-agents install frontend-developer

# Use
> /frontend user dashboard
> /frontend shopping cart component
```

### 🧪 TDD Specialist
*Test-driven development expert*

- Unit test creation
- Integration testing
- E2E test scenarios
- Test coverage analysis
- Mock and stub implementation

```bash
# Install
claude-agents install tdd-specialist

# Use
> /tdd UserService class
> /tdd API integration tests
```

### 📚 API Documenter
*Technical documentation specialist*

- OpenAPI/Swagger specs
- API endpoint documentation
- Integration guides
- SDK documentation
- Example code generation

```bash
# Install
claude-agents install api-documenter

# Use
> /apidoc REST endpoints
> /apidoc GraphQL schema
```

### 🚀 DevOps Engineer
*Infrastructure and deployment expert*

- CI/CD pipeline setup
- Docker containerization
- Kubernetes orchestration
- Infrastructure as Code
- Monitoring and logging

```bash
# Install
claude-agents install devops-engineer

# Use
> /devops GitHub Actions workflow
> /devops Kubernetes deployment
```

### 📊 Product Manager
*Product strategy and planning specialist*

- User story creation
- Feature specification
- Roadmap planning
- Requirements documentation
- Stakeholder communication

```bash
# Install
claude-agents install product-manager

# Use
> /product user onboarding flow
> /product feature prioritization
```

### ✍️ Marketing Writer
*Technical marketing content expert*

- Product launch materials
- Technical blog posts
- Feature announcements
- Documentation marketing
- Developer advocacy content

```bash
# Install
claude-agents install marketing-writer

# Use
> /marketing product launch post
> /marketing API feature announcement

### 🤖 Meta-Agent
*Agent generator for creating new specialized agents*

- Fetches latest Claude Code documentation
- Generates properly formatted agent files
- Suggests optimal tool configurations
- Creates both simple and complex agents
- Follows best practices automatically

```bash
# Install
claude-agents install meta-agent

# Use
> /meta create a database migration specialist
> Task("meta-agent: create an agent for monitoring system performance")
```

## 🔊 Voice Features

Enable real-time voice announcements for agent completions and errors:

### Setup Voice

#### Option 1: ElevenLabs via MCP (Recommended)

Run this command to add the ElevenLabs MCP server:

```bash
claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-api-key -- uvx elevenlabs-mcp
```

#### Option 2: OpenAI TTS

```bash
# Configure API key
claude-agents voice --api-key

# Select OpenAI and enter your API key
```

#### Option 3: Local System TTS

Works out of the box on macOS (say), Linux (espeak), and Windows (PowerShell).

### Using Voice

```bash
# Configure voice settings
claude-agents voice

# Enable/disable voice
claude-agents voice --enable
claude-agents voice --disable

# Test voice
claude-agents voice --test "Hello from Claude agents"

# Run agent with voice
claude-agents run api-developer --task "Create user API" --voice

# Set voice provider
claude-agents voice --provider mcp     # ElevenLabs via MCP
claude-agents voice --provider openai  # OpenAI TTS
claude-agents voice --provider local   # System TTS
```

### Voice Configuration

Voice settings are stored in `~/.claude-agents/config.json`:

```json
{
  "voice": {
    "enabled": true,
    "provider": "auto",
    "announcements": {
      "agentStart": false,
      "agentComplete": true,
      "errors": true,
      "progress": false
    }
  }
}
```

## 🚨 Troubleshooting

### Hook Errors and API Failures

If you're seeing errors like:
- `Failed to spawn: .claude/hooks/stop.py`
- `No such file or directory (os error 2)`
- API Error 400: `tool_use ids were found without tool_result blocks`

**Quick Fix:**
```bash
# In your project directory
chmod +x .claude/hooks/*.py
chmod +x .claude/hooks/utils/llm/*.py
chmod +x .claude/hooks/utils/tts/*.py

# Or run our fix script
curl -sSL https://raw.githubusercontent.com/webdevtodayjason/sub-agents/main/scripts/fix-hooks.sh | bash
```

**Full Diagnosis:**
```bash
# Check your installation health
claude-agents diagnose

# Reinstall hooks with proper permissions
claude-agents init
```

### Common Issues

1. **Hooks not executable**: Run the chmod commands above
2. **Hooks missing**: Run `claude-agents init` to restore
3. **Python/uv not found**: Install uv from https://github.com/astral-sh/uv
4. **Voice not working**: Install ffmpeg and run `claude-agents voice --setup`

## 📖 Documentation

### Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize agents in project | `claude-agents init` |
| `init --respect-context-forge` | Init preserving context-forge | `claude-agents init --respect-context-forge` |
| `install` | Install agents interactively | `claude-agents install` |
| `install --all` | Install all available agents | `claude-agents install --all` |
| `install --project` | Install to project directory | `claude-agents install --project` |
| `list` | Show all agents | `claude-agents list` |
| `list --installed` | Show only installed agents | `claude-agents list --installed` |
| `enable <agent>` | Enable a disabled agent | `claude-agents enable code-reviewer` |
| `disable <agent>` | Disable an agent | `claude-agents disable test-runner` |
| `remove <agent>` | Remove specific agent | `claude-agents remove debugger` |
| `uninstall` | Bulk uninstall with options | `claude-agents uninstall --all --clean` |
| `info <agent>` | Show agent details | `claude-agents info debugger` |
| `create` | Create a custom agent | `claude-agents create` |
| `run <agent>` | Run agent independently | `claude-agents run marketing-writer --task "write launch post"` |
| `diagnose` | Check installation health | `claude-agents diagnose` |
| `voice` | Configure voice settings | `claude-agents voice --setup` |
| `chain` | Run multiple agents | `claude-agents chain api-developer test-runner` |

### Independent Agent Execution

Run agents outside of Claude Code for automation and scripting:

```bash
# Run with inline task
claude-agents run marketing-writer --task "Write launch announcement for v2.0"

# Run with task file
claude-agents run api-developer --file api-spec.md

# Interactive mode
claude-agents run tdd-specialist --interactive
```

### Creating Custom Agents

#### Interactive Creation
```bash
claude-agents create
```

#### Manual Creation
Create `~/.claude/agents/my-agent.md`:

```markdown
---
name: my-agent
description: What this agent does and when to use it
tools: Read, Edit, Grep, Bash
---

You are an expert in [DOMAIN]. Your role is to [PURPOSE].

When invoked, you will:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Always ensure [KEY PRINCIPLE].
```

### Installation Scopes

**User Scope** (`~/.claude/agents/`)
- Available in all projects
- Personal agents
- Default installation location

**Project Scope** (`.claude/agents/`)
- Project-specific agents
- Shared with team via version control
- Use `--project` flag

### Advanced Configuration

#### State Management
Agent states are tracked in `.claude-agents.json`:

```json
{
  "installedAgents": {
    "code-reviewer": {
      "version": "1.0.0",
      "scope": "user",
      "installedAt": "2024-01-20T10:00:00Z"
    }
  },
  "enabledAgents": ["code-reviewer"],
  "disabledAgents": []
}
```

### Hooks System

The hooks system enables automated workflows and agent coordination. Each agent can define hooks that trigger on specific events.

#### Hook Types

| Hook Type | Description | Trigger |
|-----------|-------------|---------|
| `PostToolUse:Edit` | After file edits | Any file modification |
| `PostToolUse:Write` | After file creation | New file written |
| `PostToolUse:Bash` | After command execution | Bash commands run |
| `PreToolUse` | Before any tool use | Tool about to run |
| `TaskComplete` | After task completion | Agent finishes task |
| `Stop` | On conversation end | Session terminating |

#### Hook Actions

```json
{
  "PostToolUse:Edit": {
    "condition": "file.endsWith('.js')",
    "commands": ["npm run lint", "npm test"]
  },
  "TaskComplete": {
    "notify": "Task {{task_name}} completed",
    "store": "agent:{{agent_name}}:last_task"
  }
}
```

#### Example: Auto-Review Hook

Create hooks for automatic code review after edits:

```json
{
  "hooks": {
    "PostToolUse:Edit": [{
      "matcher": "\\.(js|ts|py)$",
      "hooks": [{
        "type": "command",
        "command": "echo 'Consider running /review' >&2"
      }]
    }]
  }
}
```

#### Example: Test Runner Hook

Automatically run tests after code changes:

```json
{
  "PostToolUse:Edit": {
    "condition": "file.includes('src/')",
    "commands": ["npm test -- --watch=false"]
  }
}
```

## 🌟 Our Ecosystem

Check out our other tools for Claude Code:

### 🪝 [Claude Hooks Manager](https://github.com/webdevtodayjason/claude-hooks)
Powerful hook management system for Claude Code automation

### 🔨 [Context Forge](https://github.com/webdevtodayjason/context-forge)
Our flagship tool for intelligent context generation and management

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-agent`)
3. **Commit** your changes (`git commit -m 'Add amazing agent'`)
4. **Push** to the branch (`git push origin feature/amazing-agent`)
5. **Open** a Pull Request

### Adding New Agents

1. Create agent structure:
```
agents/
└── your-agent/
    ├── agent.md       # Agent definition
    ├── metadata.json  # Agent metadata
    └── hooks.json     # Optional hooks
```

2. Add slash command:
```
commands/
└── your-command.md
```

3. Submit PR with description

## 🐛 Troubleshooting

### Agent Not Found After Global Install?

```bash
# Enable debug mode to see where agents are being searched
DEBUG=claude-agents claude-agents run project-planner --task "test"

# Check npm global installation path
npm list -g @webdevtoday/claude-agents

# Verify agents are included in the package
ls -la $(npm root -g)/@webdevtoday/claude-agents/agents/
```

### Agent Not Working?

```bash
# Check installation
claude-agents list

# Verify agent status
claude-agents info <agent-name>

# Re-enable if disabled
claude-agents enable <agent-name>
```

### Debug Mode

```bash
# Run Claude with debug output
claude --debug

# Run claude-agents with debug output
DEBUG=claude-agents claude-agents run <agent> --task "test"
```

### Common Issues

- **Permission denied**: Use `sudo` for global install
- **Agent not found**: Check spelling and installation
- **Command not working**: Ensure Claude Code is updated
- **"Agent not found" error**: Enable debug mode to see search paths

## 📊 Release Notes

### Version 1.5.0 (Latest) - Voice Features & Meta-Agent
- 🔊 **Voice Announcements**: Real-time TTS feedback for agent completions
- 🤖 **Meta-Agent**: Automatically generate new specialized agents
- 🎙️ **MCP Integration**: ElevenLabs TTS via MCP server
- 🔧 **Voice CLI**: Complete voice configuration command
- 📝 **Enhanced CLAUDE.md**: More aggressive concurrent execution rules
- ⚡ **Performance**: Improved agent orchestration patterns

### Version 1.4.0 - Context-Forge Integration
- 🛠️ **Context-Forge Support**: Full integration with context-forge projects
- 📦 **Init Command**: One-command setup with `claude-agents init`
- 🧹 **Uninstall Command**: Bulk removal with cleanup options
- 🎯 **PRP Awareness**: Agents understand and work with existing PRPs
- 📁 **Smart Commands**: Organized in `.claude/commands/agents/` to avoid conflicts
- ⚡ **Concurrent Execution**: CLAUDE.md rules for maximum performance
- 📝 **Safe Integration**: Appends to CLAUDE.md without overwriting
- 🔧 **Bug Fixes**: Project scope installation now works correctly

### Version 1.3.1
- 🐛 Fixed "agent not found" error for global installations
- 📍 Enhanced path resolution for various npm configurations
- 🔍 Added debug mode with `DEBUG=claude-agents`

### Version 1.3.0
- 🎯 Context-forge detection utility
- 🧠 Enhanced agent system with PRP awareness
- 💾 Memory system integration
- 📚 Context-aware command templates

### Version 1.2.0
- 🤖 15 specialized AI agents
- ⚡ Concurrent execution patterns
- 💾 Shared memory system
- 🌐 Web dashboard
- 🎯 Slash command integration

### Version 1.0.0
- 🎉 Initial release
- 6 production-ready agents
- Interactive CLI interface
- Custom agent creation
- Project/user scope support
- Comprehensive documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Claude Code team at Anthropic
- Our amazing community of developers
- All contributors and testers

## 📬 Connect

- 🐛 [Report Issues](https://github.com/webdevtodayjason/sub-agents/issues)
- 💡 [Request Features](https://github.com/webdevtodayjason/sub-agents/discussions)
- 🐦 [Follow Updates](https://twitter.com/webdevtodayjason)
- ⭐ [Star on GitHub](https://github.com/webdevtodayjason/sub-agents)

## 🔍 SEO Keywords & Use Cases

### Perfect for developers who want to:
- **Automate code reviews** with AI-powered analysis
- **Fix failing tests automatically** using intelligent test runners
- **Debug complex issues** with expert error analysis
- **Generate documentation** from existing code
- **Scan for security vulnerabilities** proactively
- **Refactor legacy code** with modern patterns
- **Enhance Claude Code** with specialized capabilities
- **Create custom AI agents** for specific workflows

### Technologies & Integrations:
- Works with **Claude Code** by Anthropic
- Supports all major programming languages
- Integrates with existing development workflows
- Compatible with Git, npm, yarn, and more
- Extensible through custom agent creation

---

<div align="center">

**Made with ❤️ by [WebDev Today Jason](https://github.com/webdevtodayjason)**

*Building AI-powered developer tools to enhance productivity and code quality*

**Claude Sub-Agents Manager** - Your AI-Powered Development Team in Claude Code

[![Star History Chart](https://api.star-history.com/svg?repos=webdevtodayjason/sub-agents&type=Date)](https://star-history.com/#webdevtodayjason/sub-agents&Date)

</div>
