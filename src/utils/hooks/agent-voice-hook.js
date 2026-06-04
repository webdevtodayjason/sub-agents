/**
 * Agent Voice Completion Hook
 * 
 * This hook is used by agents to announce task completion via ElevenLabs MCP.
 * 
 * Usage in agent.md files:
 * ```
 * When you complete a task, use the mcp__ElevenLabs__text_to_speech tool:
 * 
 * mcp__ElevenLabs__text_to_speech(
 *   text: "I've completed the API endpoints. Next, we can add authentication.",
 *   voice_id: "WejK3H1m7MI9CHnIjW9K",
 *   output_directory: "."
 * )
 * ```
 */

export function generateAgentVoiceHook(agentName, completionMessage, options = {}) {
  const defaultVoiceId = 'WejK3H1m7MI9CHnIjW9K'; // Ashlee - Pleasant Expressive
  const voiceId = options.voiceId || defaultVoiceId;
  const outputDirectory = options.outputDirectory || process.cwd();
  
  // Generate the exact MCP tool invocation format
  const mcpInvocation = `mcp__ElevenLabs__text_to_speech(
  text: "${completionMessage}",
  voice_id: "${voiceId}",
  output_directory: "${outputDirectory}"
)`;
  
  return mcpInvocation;
}

// Example voice IDs for different agent personalities
export const AGENT_VOICES = {
  'project-planner': 'WejK3H1m7MI9CHnIjW9K',      // Ashlee - Pleasant Expressive
  'api-developer': 'onwK4e9ZLuTAKqWW03F9',        // Daniel - Professional
  'frontend-developer': 'EXAVITQu4vr4xnSDxMaL',   // Bella - Creative
  'tdd-specialist': 'ErXwobaYiN019PkySvjV',       // Antoni - Precise
  'code-reviewer': '21m00Tcm4TlvDq8ikWAM',        // Rachel - Authoritative
  'debugger': 'yoZ06aMxZJJ28mfd3POQ',             // Sam - Problem Solver
  'security-scanner': 'flq6f7yk4E4fJM5XTYuZ',     // Michael - Serious
  'devops-engineer': '2EiwWnXFnvU5JabPnv8n',      // Clyde - Technical
  'product-manager': 'ThT5KcBeYPX3keUQqHPh',      // Dorothy - Business
  'marketing-writer': 'jsCqWAovK2LkecY7zXl4',     // Elli - Engaging
  'default': 'WejK3H1m7MI9CHnIjW9K'               // Ashlee - Default
};

/**
 * Get the appropriate voice ID for an agent
 */
export function getAgentVoiceId(agentName) {
  return AGENT_VOICES[agentName] || AGENT_VOICES.default;
}

/**
 * Generate completion message for different agent types
 */
export function generateCompletionMessage(agentName, task, result) {
  const templates = {
    'project-planner': `I've completed the project planning for ${task}. The roadmap is ready with clear milestones and deliverables.`,
    'api-developer': `I've finished implementing the ${task}. All endpoints are tested and documented.`,
    'frontend-developer': `I've completed the ${task}. The interface is responsive and ready for review.`,
    'tdd-specialist': `I've written comprehensive tests for ${task}. All tests are passing with good coverage.`,
    'code-reviewer': `I've completed the code review for ${task}. I've identified areas for improvement and security considerations.`,
    'debugger': `I've resolved the issue with ${task}. The root cause has been fixed and verified.`,
    'security-scanner': `I've completed the security scan for ${task}. All vulnerabilities have been documented.`,
    'devops-engineer': `I've set up the ${task}. The pipeline is configured and ready to use.`,
    'product-manager': `I've completed the ${task}. User stories and requirements are documented.`,
    'marketing-writer': `I've written the ${task}. The content is ready for publication.`,
    'default': `I've completed ${task}. Everything is ready for the next step.`
  };
  
  return templates[agentName] || templates.default;
}