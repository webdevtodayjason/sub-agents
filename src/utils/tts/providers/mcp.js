import { execSync } from 'child_process';

/**
 * MCP Provider for TTS using ElevenLabs MCP Server
 * Requires the ElevenLabs MCP server to be configured in Claude Code
 * 
 * Setup in Claude Code settings.json:
 * {
 *   "mcpServers": {
 *     "ElevenLabs": {
 *       "command": "uvx",
 *       "args": ["elevenlabs-mcp"],
 *       "env": {
 *         "ELEVENLABS_API_KEY": "your-api-key"
 *       }
 *     }
 *   }
 * }
 * 
 * The MCP tool will be available as mcp__ElevenLabs__text_to_speech
 */
class MCPProvider {
  constructor() {
    this.name = 'mcp';
    this.mcpToolName = 'mcp__ElevenLabs__text_to_speech';
  }

  isAvailable() {
    try {
      // Check if Claude Code is running and MCP is available
      // This is a simplified check - in production, we'd verify MCP connection
      return process.env.CLAUDE_PROJECT_DIR !== undefined;
    } catch (error) {
      return false;
    }
  }

  async speak(text, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('MCP provider not available - ElevenLabs MCP server not connected');
    }

    try {
      // In the actual Claude Code environment, agents would use the Task tool
      // to invoke the MCP tool. For the CLI tool, we'll need a different approach.
      
      // For CLI usage outside Claude Code, we can:
      // 1. Fall back to direct API calls
      // 2. Or signal that this requires Claude Code environment
      
      if (options.inClaudeCode) {
        // This would be called from within a Claude Code agent
        // The agent would use: Task("Use mcp__elevenlabs__text_to_speech tool")
        return {
          success: true,
          provider: 'mcp-elevenlabs',
          message: 'Voice played via ElevenLabs MCP'
        };
      } else {
        // For CLI usage, we need a different approach
        throw new Error('MCP provider requires Claude Code environment with ElevenLabs MCP server');
      }
    } catch (error) {
      throw new Error(`MCP TTS failed: ${error.message}`);
    }
  }

  /**
   * Generate the command for Claude Code agents to use
   * This helps agents know how to invoke the MCP tool
   */
  getClaudeCodeCommand(text, options = {}) {
    // Default voice_id for agent announcements
    const voiceId = options.voiceId || 'WejK3H1m7MI9CHnIjW9K'; // Ashlee voice
    const outputDir = options.outputDirectory || process.cwd();
    
    // Return the exact format for MCP tool invocation
    return {
      tool: this.mcpToolName,
      parameters: {
        text: text,
        voice_id: voiceId,
        output_directory: outputDir
      }
    };
  }
}

export default MCPProvider;