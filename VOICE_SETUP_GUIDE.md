# Voice Setup Guide for Claude Sub-Agents

## Overview

The enhanced voice command now provides a complete setup wizard that guides you through configuring voice functionality, checking dependencies, setting up API keys, and testing your configuration.

## Quick Start

```bash
# Run the complete setup wizard
claude-agents voice --setup

# Check current status
claude-agents voice --status

# Test current configuration
claude-agents voice --test
```

## Setup Wizard Features

### 1. FFmpeg Detection
The setup wizard automatically checks if FFmpeg is installed and provides platform-specific installation instructions:

- **macOS**: `brew install ffmpeg`
- **Windows**: `choco install ffmpeg` or download from ffmpeg.org
- **Linux**: `sudo apt-get install ffmpeg` (Ubuntu/Debian)

### 2. Voice Provider Selection
Choose from multiple voice providers:

- **Auto** (recommended): Uses the best available provider
- **ElevenLabs MCP**: High-quality voice via Claude Code MCP integration
- **OpenAI**: Reliable voice synthesis
- **Local**: System text-to-speech (no API key required)

### 3. API Key Configuration
The wizard prompts for the necessary API keys based on your provider selection:

- OpenAI API key for OpenAI provider
- ElevenLabs API key for MCP/ElevenLabs provider
- Multiple keys for Auto provider (optional but recommended)

### 4. MCP Integration Setup
For ElevenLabs MCP provider, the wizard:

- Provides the exact command to run: `claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-key -- uvx elevenlabs-mcp`
- Optionally runs the command automatically
- Configures Claude Code MCP integration

### 5. Configuration Persistence
Settings are saved to:
- Configuration files for agent preferences
- `.env` file for API keys and environment variables
- Both local and global scopes as appropriate

### 6. Voice Testing
The wizard offers to test your configuration immediately after setup.

## Command Options

### Interactive Setup
```bash
claude-agents voice --setup
```
Runs the complete guided setup wizard.

### Status Check
```bash
claude-agents voice --status
```
Shows comprehensive system status including:
- FFmpeg installation status
- Current configuration settings
- API key configuration status
- MCP integration status
- Setup recommendations

### Voice Testing
```bash
claude-agents voice --test
claude-agents voice --test "Custom test message"
```

### Provider Configuration
```bash
claude-agents voice --provider auto
claude-agents voice --provider mcp
claude-agents voice --provider openai
claude-agents voice --provider local
```

### Enable/Disable
```bash
claude-agents voice --enable
claude-agents voice --disable
```

### API Key Setup
```bash
claude-agents voice --api-key
```

## Interactive Menu

When you run `claude-agents voice` without options, you get an interactive menu with:

1. **Enable/Disable voice**
2. **Run setup wizard** - Complete guided setup
3. **Show system status** - Detailed status information
4. **Change provider** - Switch voice providers
5. **Configure API keys** - Interactive API key setup
6. **Test voice** - Test current configuration
7. **View announcements settings** - Configure when voice announcements trigger

## ElevenLabs MCP Integration

For the highest quality voice experience, the wizard can set up ElevenLabs MCP integration:

1. The wizard detects if you want to use ElevenLabs
2. Prompts for your ElevenLabs API key
3. Provides the exact MCP installation command
4. Optionally runs the command automatically
5. Configures Claude Code to use the ElevenLabs MCP server

### Manual MCP Setup
If you prefer to set up MCP manually:

```bash
claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-api-key -- uvx elevenlabs-mcp
```

This command:
- Installs the ElevenLabs MCP server
- Configures it with your API key
- Makes it available in Claude Code
- Enables high-quality voice synthesis

## Configuration Files

### Environment Variables (.env)
```env
# Voice Configuration
CLAUDE_AGENTS_VOICE_ENABLED=true
CLAUDE_AGENTS_VOICE_PROVIDER=mcp
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### Agent Configuration
Voice settings are also stored in the agent configuration for persistence across sessions.

## Troubleshooting

### FFmpeg Issues
If FFmpeg is not detected:
1. Install using your platform's package manager
2. Ensure it's in your system PATH
3. Restart your terminal/shell
4. Run the setup wizard again

### API Key Issues
If API keys aren't working:
1. Verify the key is correct and active
2. Check account billing/usage limits
3. Ensure the key has the necessary permissions
4. Try regenerating the API key

### MCP Issues
If ElevenLabs MCP isn't working:
1. Ensure Claude Code is updated
2. Check that the MCP server is properly installed
3. Verify the API key is correctly configured
4. Restart Claude Code

## Best Practices

1. **Start with the setup wizard**: Use `claude-agents voice --setup` for first-time configuration
2. **Use status checks**: Regularly run `--status` to verify your configuration
3. **Test frequently**: Use `--test` after making changes
4. **Keep API keys secure**: Store them in `.env` files, not in code
5. **Monitor usage**: Be aware of API costs and usage limits

## Integration with Other Commands

Voice features work seamlessly with other claude-agents commands:

```bash
# Enable voice for agent runs
claude-agents run api-developer --task "Create user API" --voice

# Chain commands with voice announcements
claude-agents chain code-reviewer test-runner --voice

# Voice announcements for specific events
# (Configured through the announcements settings)
```

The setup wizard ensures your voice configuration works across all these use cases.