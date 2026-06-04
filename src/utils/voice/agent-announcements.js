/**
 * Agent Voice Announcements via ElevenLabs MCP
 * 
 * This module handles voice announcements for agent completions
 * using the ElevenLabs MCP server in Claude Code.
 */

import { getVoiceConfig } from '../config.js';

/**
 * Generate the MCP tool invocation for agent voice announcements
 * 
 * @param {string} agentName - Name of the agent
 * @param {string} message - Completion message
 * @param {Object} options - Additional options
 * @returns {string} MCP tool invocation string
 */
export function generateMCPVoiceCommand(agentName, message, options = {}) {
  const config = getVoiceConfig();
  
  // Use agent-specific voice or default
  const voiceId = options.voiceId || getAgentVoiceId(agentName);
  const outputDirectory = options.outputDirectory || process.cwd();
  
  // Format for Claude Code MCP tool invocation
  return `mcp__ElevenLabs__text_to_speech(
  text: "${message}",
  voice_id: "${voiceId}",
  output_directory: "${outputDirectory}"
)`;
}

/**
 * Agent-specific voice IDs matching ElevenLabs voices
 */
export const AGENT_VOICES = {
  // Professional voices
  'project-planner': 'onwK4e9ZLuTAKqWW03F9',        // Daniel - Clear & Professional
  'api-developer': '21m00Tcm4TlvDq8ikWAM',          // Rachel - Authoritative
  'devops-engineer': '2EiwWnXFnvU5JabPnv8n',        // Clyde - Technical
  
  // Creative voices
  'frontend-developer': 'EXAVITQu4vr4xnSDxMaL',     // Bella - Creative & Warm
  'shadcn-ui-builder': 'jsCqWAovK2LkecY7zXl4',      // Elli - Engaging
  'marketing-writer': 'ThT5KcBeYPX3keUQqHPh',       // Dorothy - Business
  
  // Analytical voices
  'code-reviewer': 'ErXwobaYiN019PkySvjV',          // Antoni - Precise
  'tdd-specialist': 'yoZ06aMxZJJ28mfd3POQ',         // Sam - Problem Solver
  'debugger': 'flq6f7yk4E4fJM5XTYuZ',               // Michael - Serious
  'security-scanner': 'TX3LPaxmHKxFdv7VOQHJ',       // Liam - Stoic
  
  // Documentation voices
  'doc-writer': 'z9fAnlkpzviPz146aGWa',             // Glinda - Witch
  'api-documenter': 'XB0fDUnXU5powFXDhCwa',         // Charlotte - Swedish
  
  // Support voices
  'test-runner': 'cgSgspJ2msm6clMCkdW9',            // Default voice
  'refactor': 'GBv7mTt0atIp3Br8iCZE',               // Thomas - Calm
  'product-manager': 'nPczCjzI2devNBz1zQrb',        // Brian - Trustworthy
  
  // Meta
  'meta-agent': 'zrHiDhphv9ZnVXBqCLjz',             // Mimi - Childish (playful for creation)
  
  // Default fallback
  'default': 'cgSgspJ2msm6clMCkdW9'                 // ElevenLabs default
};

/**
 * Get the appropriate voice ID for an agent
 */
export function getAgentVoiceId(agentName) {
  return AGENT_VOICES[agentName] || AGENT_VOICES.default;
}

/**
 * Generate contextual completion messages for agents
 */
export function generateCompletionMessage(agentName, task, result = {}) {
  const templates = {
    'project-planner': `I've completed the project planning for ${task}. The roadmap includes ${result.milestones || 'key milestones'} and clear deliverables.`,
    'api-developer': `I've finished implementing ${task}. All ${result.endpoints || 'endpoints'} are tested and documented.`,
    'frontend-developer': `I've completed ${task}. The interface is ${result.responsive ? 'responsive and' : ''} ready for review.`,
    'tdd-specialist': `I've written comprehensive tests for ${task}. ${result.coverage ? `Coverage is at ${result.coverage}%` : 'All tests are passing'}.`,
    'code-reviewer': `I've completed the code review for ${task}. ${result.issues ? `Found ${result.issues} areas for improvement` : 'The code looks good'}.`,
    'debugger': `I've resolved the issue with ${task}. ${result.rootCause ? `Root cause: ${result.rootCause}` : 'The bug has been fixed'}.`,
    'security-scanner': `Security scan complete for ${task}. ${result.vulnerabilities ? `Found ${result.vulnerabilities} items to address` : 'No critical issues found'}.`,
    'devops-engineer': `I've set up ${task}. ${result.pipeline ? 'The pipeline is' : 'Everything is'} configured and ready.`,
    'shadcn-ui-builder': `I've built the UI for ${task}. ${result.components ? `Used ${result.components} components` : 'The interface is complete'}.`,
    'product-manager': `I've completed ${task}. ${result.stories ? `Created ${result.stories} user stories` : 'Requirements are documented'}.`,
    'marketing-writer': `I've written ${task}. The content is ${result.wordCount ? `${result.wordCount} words and` : ''} ready for publication.`,
    'api-documenter': `I've documented ${task}. ${result.endpoints ? `Covered ${result.endpoints} endpoints` : 'API documentation is complete'}.`,
    'test-runner': `Test run complete for ${task}. ${result.passed && result.total ? `${result.passed}/${result.total} tests passed` : 'See results above'}.`,
    'refactor': `I've refactored ${task}. ${result.improvements ? `Made ${result.improvements} improvements` : 'Code structure is improved'}.`,
    'doc-writer': `I've written documentation for ${task}. ${result.sections ? `Added ${result.sections} sections` : 'Documentation is complete'}.`,
    'meta-agent': `I've created the ${task} agent. It's ready to use with the specialized capabilities you requested.`,
    'default': `I've completed ${task}. Everything is ready for the next step.`
  };
  
  return templates[agentName] || templates.default;
}

/**
 * Instructions for agents to include voice announcements
 */
export const VOICE_ANNOUNCEMENT_INSTRUCTIONS = `
## Voice Announcements

When you complete a task and voice is enabled, announce your completion using:

\`\`\`
mcp__ElevenLabs__text_to_speech(
  text: "[Your completion message]",
  voice_id: "[Your assigned voice ID]",
  output_directory: "[Current directory]"
)
\`\`\`

Your voice ID: {{VOICE_ID}}

Keep announcements:
- Concise (2-3 sentences max)
- Informative (what you did, key outcomes)
- Forward-looking (suggest next steps)
`;

/**
 * Check if voice announcements are enabled
 */
export function isVoiceEnabled() {
  const config = getVoiceConfig();
  return config.enabled && config.provider === 'mcp';
}

/**
 * Generate hook configuration for agent voice
 */
export function generateVoiceHook(agentName) {
  if (!isVoiceEnabled()) {
    return null;
  }
  
  return {
    type: 'TaskComplete',
    action: 'mcp_tool',
    tool: 'mcp__ElevenLabs__text_to_speech',
    parameters: {
      voice_id: getAgentVoiceId(agentName),
      output_directory: process.cwd()
    }
  };
}