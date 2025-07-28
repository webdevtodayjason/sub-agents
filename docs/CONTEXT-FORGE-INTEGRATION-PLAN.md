# Complete Plan: Claude Sub-Agents + Context-Forge Integration

## Understanding Context-Forge Structure

Context-forge creates:
- **CLAUDE.md** - Project rules and configuration (MUST NOT OVERWRITE)
- **Docs/** - Implementation.md, project_structure.md, etc.
- **PRPs/** - Product Requirement Prompts with ai_docs/
- **.context-forge/** - Configuration and progress tracking
- **.claude/** - Commands and hooks directories

## 1. Fix Install Command Bug (Priority: HIGH) ✅

- Debug why `selectInstallScope()` returns project but saves to user
- Ensure when project scope is selected:
  - Agents go to `.claude/agents/`
  - Commands go to `.claude/commands/`
  - Config goes to `.claude-agents.json` in project root
- Add debug logging to trace the scope selection

**Status**: Completed
- Fixed scope detection and directory creation
- Added context-forge awareness to install command
- Commands now placed in `.claude/commands/agents/` for context-forge projects

## 2. Create Context-Aware Init Command ✅

```bash
claude-agents init [options]
  --respect-context-forge  # Auto-detect and preserve existing files
  --merge                  # Merge with existing CLAUDE.md
  --force                  # Overwrite (with warning)
```

Logic:
1. Detect if context-forge project (check for CLAUDE.md, PRPs/, .context-forge/)
2. If context-forge detected:
   - Create `.claude/agents/` directory only
   - Copy agents but NOT commands (avoid conflicts)
   - **APPEND** to CLAUDE.md with sub-agents section
   - Preserve all existing context-forge files
3. If not context-forge:
   - Create full structure as normal

**Status**: Completed
- Created init command with full context-forge detection
- Respects existing files and appends to CLAUDE.md
- Smart command placement to avoid conflicts

## 3. CLAUDE.md Append Functionality ✅

Create a section to append to existing CLAUDE.md:

```markdown
## 🤖 Claude Sub-Agents Integration

This project includes specialized AI sub-agents for enhanced development:

### Available Agents
- project-planner: Strategic planning and task decomposition
- api-developer: Backend API development with PRP awareness
- [... list installed agents ...]

### Agent Commands
Agents work alongside your existing PRPs and can be invoked via:
- Direct execution: `claude-agents run <agent> --task "..."`
- Task tool in Claude Code: `Task("agent-name: description")`

### Memory System
Agents share context through `.swarm/memory.json` for coordination.
```

**Status**: Completed - Implemented in init command

## 4. Create Uninstall Command ✅

```bash
claude-agents uninstall [options]
  --all                    # Remove all agents
  --agent <name>          # Remove specific agent
  --scope <user|project>  # Target scope
  --clean                 # Remove empty directories
```

Actions:
- Remove agent files from specified scope
- Remove associated commands
- Update config files
- Clean up empty directories
- Preserve context-forge files

**Status**: Completed
- Full uninstall command with scope selection
- Preserves context-forge structure
- Clean option for directory cleanup

## 5. Enhanced Context-Forge Detection ✅

Update `contextForgeDetector.js` to also check:
- `.context-forge/` directory
- `CLAUDE.md` file
- Existing `.claude/commands/` from context-forge
- Return detailed structure info

**Status**: Completed - Already implemented in previous work

## 6. Smart Command Merging ✅

When installing in context-forge project:
- Don't overwrite existing commands
- Create sub-agents category: `.claude/commands/agents/`
- Prefix agent commands to avoid conflicts: `agent-review.md` instead of `review.md`

**Status**: Completed
- Commands placed in agents subdirectory
- Prefixed with `agent-` to avoid conflicts

## 7. Configuration Management ✅

- Project config: `.claude-agents.json` (in project root)
- User config: `~/.claude-agents.json`
- Never modify `.context-forge/config.json`
- Track which agents are context-forge aware

**Status**: Completed - Config properly scoped

## 8. Fix Path Resolution Order ✅

1. Project `.claude/agents/` (highest priority)
2. User `~/.claude/agents/`
3. NPM package agents
4. Ensure project scope always takes precedence

**Status**: Completed in previous v1.3.1 release

## Implementation Summary

### What Was Built:
1. **Context-Forge Detection**: Full awareness of context-forge project structure
2. **Smart Install Command**: Detects context-forge and adapts behavior
3. **Init Command**: Bulk initialization with CLAUDE.md append support
4. **Uninstall Command**: Clean removal with scope selection
5. **Command Namespacing**: Prevents conflicts with existing commands
6. **Memory Integration**: Agents share context through .swarm/memory.json

### Key Features:
- **Non-invasive**: Never overwrites context-forge files
- **Smart Placement**: Commands in subdirectories to avoid conflicts
- **CLAUDE.md Aware**: Appends instead of overwrites
- **PRP Integration**: Agents understand and work with PRPs
- **Scope Management**: Clear user vs project separation

### Usage in Context-Forge Projects:

```bash
# Initialize sub-agents in context-forge project
cd my-context-forge-project
claude-agents init --respect-context-forge

# Agents now available via:
# 1. Task tool: Task("api-developer: implement user auth")
# 2. Direct run: claude-agents run api-developer --task "implement user auth"
# 3. Commands: .claude/commands/agents/agent-api.md
```

This approach ensures claude-sub-agents enhances context-forge projects without disrupting their structure.