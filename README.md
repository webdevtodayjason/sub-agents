# Claude Sub-Agents Manager

🤖 **A powerful CLI tool to manage specialized AI agents for Claude Code**

Enhance your development workflow by installing, managing, and creating specialized AI agents that work seamlessly with Claude Code. Each agent is designed to excel in specific development tasks like code review, testing, debugging, and more.

```
╔═══════════════════════════════════════════╗
║       Claude Sub-Agents Manager           ║
║   Enhance Claude Code with AI Agents      ║
╚═══════════════════════════════════════════╝
```

## ✨ Features

- **🔧 Install**: Add sub-agents to your system or project directories
- **📋 List**: View available and installed agents with status information
- **⚡ Enable/Disable**: Control which agents are active in your workflow
- **ℹ️ Info**: Get detailed information about any agent
- **🛠️ Create**: Build new custom agents tailored to your needs
- **🔄 Update**: Keep your agents up-to-date (coming soon)
- **⚙️ Config**: Manage default settings (coming soon)

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- Claude Code environment

### Installation

```bash
# Clone the repository
git clone https://github.com/webdevtodayjason/sub-agents.git
cd claude-sub-agents

# Install dependencies
npm install

# Make the CLI available globally (optional)
npm link
```

### Basic Usage

```bash
# See all available commands
claude-agents --help

# List all agents
claude-agents list

# Install agents interactively
claude-agents install

# Install all agents at once
claude-agents install --all

# Get detailed info about an agent
claude-agents info code-reviewer
```

## 📚 Available Agents

The manager comes with several pre-built specialist agents:

### 🔍 **Code Reviewer**
- **Purpose**: Expert code review for quality, security, and maintainability
- **Triggers**: Automatically reviews code after edits
- **Features**: Security scanning, performance analysis, best practices enforcement
- **Tags**: `code-quality`, `review`, `security`, `best-practices`

### 🧪 **Test Runner**
- **Purpose**: Automated test execution and failure analysis
- **Triggers**: Runs tests and fixes failures automatically
- **Features**: Multi-framework support, intelligent failure diagnosis
- **Tags**: `testing`, `automation`, `quality-assurance`, `ci-cd`

### 🐛 **Debugger**
- **Purpose**: Expert debugging specialist for error analysis
- **Triggers**: Activates on errors and stack traces
- **Features**: Advanced error analysis, root cause identification
- **Tags**: `debugging`, `error-analysis`, `troubleshooting`, `diagnostics`

## 📖 Command Reference

### `claude-agents install [options]`

Install agents to your system or project.

**Options:**
- `-p, --project` - Install to project directory instead of user directory
- `-a, --all` - Install all available agents

**Examples:**
```bash
# Interactive installation
claude-agents install

# Install all agents globally
claude-agents install --all

# Install to current project only
claude-agents install --project
```

### `claude-agents list [options]`

List available and installed agents with their status.

**Options:**
- `-i, --installed` - Show only installed agents
- `-a, --available` - Show only available agents

**Examples:**
```bash
# Show all agents
claude-agents list

# Show only installed agents
claude-agents list --installed

# Show only available agents
claude-agents list --available
```

### `claude-agents enable <agent> [options]`

Enable a specific agent.

**Options:**
- `-p, --project` - Enable in project scope only

**Examples:**
```bash
# Enable code reviewer globally
claude-agents enable code-reviewer

# Enable test runner for this project only
claude-agents enable test-runner --project
```

### `claude-agents disable <agent> [options]`

Disable a specific agent without removing it.

**Options:**
- `-p, --project` - Disable in project scope only

**Examples:**
```bash
# Disable debugger globally
claude-agents disable debugger

# Disable code reviewer for this project
claude-agents disable code-reviewer --project
```

### `claude-agents info <agent>`

Show detailed information about an agent.

**Examples:**
```bash
# Get info about code reviewer
claude-agents info code-reviewer

# Get info about test runner
claude-agents info test-runner
```

### `claude-agents create [options]`

Create a new custom agent.

**Options:**
- `-n, --name <name>` - Agent name
- `-t, --template <template>` - Use a template (basic, advanced)

**Examples:**
```bash
# Interactive agent creation
claude-agents create

# Create with specific name and template
claude-agents create --name my-agent --template advanced
```

## 🏗️ Agent Structure

Each agent consists of:

- **`metadata.json`** - Agent configuration and requirements
- **`agent.md`** - Agent instructions and behavior
- **`hooks.json`** - Hook configurations (optional)

### Example Agent Structure

```
agents/
└── my-agent/
    ├── metadata.json    # Agent metadata and requirements
    ├── agent.md         # Agent instructions
    └── hooks.json       # Hook configurations (optional)
```

### Metadata Schema

```json
{
  "name": "agent-name",
  "version": "1.0.0",
  "description": "Agent description",
  "author": "Your Name",
  "tags": ["tag1", "tag2"],
  "requirements": {
    "tools": ["Read", "Edit", "Bash"],
    "optional_tools": ["WebSearch"]
  },
  "hooks": {
    "recommended": ["PostToolUse:Edit"],
    "optional": ["Stop"]
  },
  "commands": ["command1"],
  "compatible_with": ["claude-code@>=1.0.0"]
}
```

## 🔧 Configuration

Agents can be installed in two scopes:

- **User Scope**: Available across all projects (`~/.claude/agents/`)
- **Project Scope**: Available only in current project (`./.claude/agents/`)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/amazing-agent`)
4. **Make** your changes
5. **Test** your changes thoroughly
6. **Commit** your changes (`git commit -am 'Add amazing agent'`)
7. **Push** to the branch (`git push origin feature/amazing-agent`)
8. **Create** a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-sub-agents.git
cd claude-sub-agents

# Install dependencies
npm install

# Link for local development
npm link

# Run linting
npm run lint
```

### Creating New Agents

When contributing new agents:

1. Follow the agent structure guidelines
2. Include comprehensive metadata
3. Write clear, specific instructions
4. Test with various scenarios
5. Document any special requirements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

Found a bug or need help?

- **Bug Reports**: [Open an issue](https://github.com/webdevtodayjason/sub-agents/issues/new?template=bug_report.md)
- **Feature Requests**: [Request a feature](https://github.com/webdevtodayjason/sub-agents/issues/new?template=feature_request.md)
- **Questions**: [Start a discussion](https://github.com/webdevtodayjason/sub-agents/discussions)

## 🚀 Roadmap

- [ ] Agent marketplace integration
- [ ] Agent templates and scaffolding
- [ ] Automatic agent updates
- [ ] Agent performance analytics
- [ ] Custom hook system
- [ ] Agent dependencies management
- [ ] Configuration management UI

---

**Made with ❤️ for the Claude Code community**

*Enhance your development workflow with specialized AI agents!*

# sub-agents
