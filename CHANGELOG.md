# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2025-07-28

### Added
- **Context-Forge Integration**: Full support for context-forge projects
  - Automatic detection of context-forge structure
  - Smart command placement in `.claude/commands/agents/` to avoid conflicts
  - Respect for existing CLAUDE.md, PRPs, and project structure
  - Agent commands prefixed with `agent-` in context-forge projects
- **Init Command**: `claude-agents init` for project initialization
  - `--respect-context-forge` flag to preserve existing files
  - `--merge` flag to append to existing CLAUDE.md
  - Installs all agents and creates proper directory structure
- **Uninstall Command**: `claude-agents uninstall` for bulk agent removal
  - `--all` flag to remove all agents
  - `--clean` flag to remove empty directories
  - Scope selection (user/project/both)
  - Preserves context-forge files

### Fixed
- **Install Command**: Project scope now works correctly
  - Agents properly installed to `.claude/agents/` when project scope selected
  - Config saved to correct location based on scope
  - Commands placed in appropriate directories

### Enhanced
- Install command now detects context-forge projects
- Better integration messages for context-forge users
- Improved command organization to prevent conflicts

## [1.3.1] - 2025-07-27

### Fixed
- **Agent Path Resolution**: Fixed "agent not found" error for globally installed packages
  - Added multiple fallback paths for npm global installations
  - Enhanced path resolution to check various npm configurations
  - Added debug mode to help troubleshoot path issues
- **Documentation**: Added troubleshooting section for global install issues

### Added
- Debug mode support: `DEBUG=claude-agents` to see agent search paths
- Better error messages when agents are not found

## [1.3.0] - 2025-07-27

### Added
- **Context-Forge Integration**: Full awareness and integration with context-forge projects
  - Automatic detection of context-forge project structures
  - Respect for existing PRPs, CLAUDE.md, and implementation plans
  - Smart adaptation of agent behavior in context-forge projects
- **Enhanced Memory System**: Context-forge specific memory operations
  - Track PRP execution states
  - Monitor implementation progress
  - Share context between agents in context-forge projects
- **New Context-Aware Commands**:
  - `prime-context`: Smart project detection and loading
  - `prp-execute`: Execute PRPs with validation gates
  - `continue-implementation`: Follow implementation plans
  - `implementation-status`: Track progress
- **Improved Agent Behaviors**:
  - Project-planner now detects and uses existing plans
  - API-developer executes PRPs directly
  - All agents respect context-forge conventions

### Changed
- Agents now automatically detect context-forge projects
- Memory system initializes with context-forge awareness
- Enhanced agent instructions for context-forge compatibility

### Fixed
- ES module compatibility issues in detection utilities
- Memory persistence in context-forge projects

## [1.2.0] - Previous Release

### Added
- 15 specialized AI agents
- Concurrent execution patterns
- Shared memory system
- Web dashboard
- Slash command integration

## [1.1.0] - Initial Release

### Added
- Core agent system
- Basic CLI commands
- Installation framework