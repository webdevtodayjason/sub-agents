# Voice Integration with Sub-Agents

This guide shows how to use voice announcements with Claude Sub-Agents using the ElevenLabs MCP server.

## Setup

### 1. Configure ElevenLabs MCP in Claude Code

Run this command:

```bash
claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-api-key -- uvx elevenlabs-mcp
```

This will automatically configure the MCP server. Alternatively, you can manually add to `settings.json`:

```json
{
  "mcpServers": {
    "ElevenLabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 2. Configure Voice in Claude Agents

```bash
# Enable voice globally
claude-agents voice --enable

# Set provider to MCP
claude-agents voice --provider mcp
```

## Usage Examples

### Running Agents with Voice

```bash
# Single agent with voice announcement
claude-agents run api-developer --task "Create user authentication endpoints" --voice

# Multiple agents with voice
claude-agents run project-planner --task "Design e-commerce platform" --voice
claude-agents run frontend-developer --task "Build product catalog UI" --voice
```

### In Claude Code

When agents complete tasks, they'll automatically call the MCP tool:

```javascript
// Agent completion announcement
mcp__ElevenLabs__text_to_speech(
  text: "I've finished implementing the user authentication API. All endpoints are secured with JWT tokens and tests are passing.",
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  output_directory: "."
)
```

## Voice Assignments

Each agent has a unique voice personality:

| Agent | Voice | Character |
|-------|-------|-----------|
| project-planner | Daniel | Clear & Professional |
| api-developer | Rachel | Authoritative |
| frontend-developer | Bella | Creative & Warm |
| tdd-specialist | Antoni | Precise |
| code-reviewer | Sam | Problem Solver |
| debugger | Michael | Serious |
| security-scanner | Liam | Stoic |
| devops-engineer | Clyde | Technical |
| shadcn-ui-builder | Elli | Engaging |
| product-manager | Brian | Trustworthy |
| marketing-writer | Dorothy | Business |

## Advanced Usage

### Custom Voice Messages

Agents can customize their announcements based on results:

```javascript
// In agent code
const message = result.errors > 0 
  ? `I've completed the security scan and found ${result.errors} vulnerabilities that need attention.`
  : `Security scan complete. No critical vulnerabilities found. The code is secure.`;

mcp__ElevenLabs__text_to_speech(
  text: message,
  voice_id: "flq6f7yk4E4fJM5XTYuZ",
  output_directory: process.cwd()
)
```

### Concurrent Agent Announcements

When running multiple agents, each will announce completion:

```bash
# All agents will announce when they complete
claude-agents run api-developer --task "Build REST API" --voice &
claude-agents run frontend-developer --task "Create UI" --voice &
claude-agents run tdd-specialist --task "Write tests" --voice &
```

## Configuration Options

### Voice Settings

Configure which events trigger announcements:

```bash
claude-agents voice
# Then select "View announcements settings"
```

Options:
- Agent start announcements
- Agent complete announcements (default: enabled)
- Error announcements
- Progress updates

### Output Location

Voice files are saved to the output directory with format:
```
tts_I've___20250726_113401.mp3
```

## Troubleshooting

### No Voice Output?

1. Check MCP server is connected in Claude Code
2. Verify ElevenLabs API key is set
3. Ensure voice is enabled: `claude-agents voice --enable`
4. Check provider: `claude-agents voice --provider mcp`

### Wrong Voice?

Each agent has an assigned voice ID. Check `agents/[agent-name]/agent.md` for the voice_id.

### API Limits?

ElevenLabs has usage limits. To manage:
- Monitor usage in your ElevenLabs dashboard
- Use local TTS as fallback: `claude-agents voice --provider local`
- The MCP tool will show cost warnings before making API calls

## Best Practices

1. **Keep announcements brief**: 2-3 sentences maximum
2. **Be informative**: State what was done and outcomes
3. **Suggest next steps**: Help maintain workflow momentum
4. **Use appropriate voice**: Match voice personality to agent role
5. **Handle errors gracefully**: Announce issues clearly

## Example Workflow

```bash
# 1. Plan the project
claude-agents run project-planner --task "Design authentication system" --voice
# Voice: "I've completed the project planning for the authentication system..."

# 2. Implement API
claude-agents run api-developer --task "Build auth endpoints from plan" --voice
# Voice: "I've finished implementing the authentication API endpoints..."

# 3. Create UI
claude-agents run frontend-developer --task "Build login forms" --voice
# Voice: "I've completed the login UI. The interface is responsive..."

# 4. Write tests
claude-agents run tdd-specialist --task "Test auth flow" --voice
# Voice: "I've written comprehensive tests for the authentication flow..."

# 5. Review security
claude-agents run security-scanner --task "Audit auth implementation" --voice
# Voice: "I've completed the security scan. No critical vulnerabilities found..."
```

Each agent announces completion, creating an audio log of your development progress!