#!/usr/bin/env node

/**
 * Script to add voice announcement instructions to all agents
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { AGENT_VOICES } from '../src/utils/voice/agent-announcements.js';

const AGENTS_DIR = join(process.cwd(), 'agents');

const VOICE_SECTION_TEMPLATE = `

## Voice Announcements

When you complete a task, announce your completion using the ElevenLabs MCP tool:

\`\`\`
mcp__ElevenLabs__text_to_speech(
  text: "{{COMPLETION_MESSAGE}}",
  voice_id: "{{VOICE_ID}}",
  output_directory: "{{OUTPUT_DIR}}"
)
\`\`\`

Your assigned voice: {{VOICE_NAME}} - {{VOICE_DESCRIPTION}}

Keep announcements concise and informative, mentioning:
- What you completed
- Key outcomes (tests passing, endpoints created, etc.)
- Suggested next steps`;

// Voice descriptions for each voice ID
const VOICE_DESCRIPTIONS = {
  'onwK4e9ZLuTAKqWW03F9': 'Daniel - Clear & Professional',
  '21m00Tcm4TlvDq8ikWAM': 'Rachel - Authoritative',
  '2EiwWnXFnvU5JabPnv8n': 'Clyde - Technical',
  'EXAVITQu4vr4xnSDxMaL': 'Bella - Creative & Warm',
  'jsCqWAovK2LkecY7zXl4': 'Elli - Engaging',
  'ThT5KcBeYPX3keUQqHPh': 'Dorothy - Business',
  'ErXwobaYiN019PkySvjV': 'Antoni - Precise',
  'yoZ06aMxZJJ28mfd3POQ': 'Sam - Problem Solver',
  'flq6f7yk4E4fJM5XTYuZ': 'Michael - Serious',
  'TX3LPaxmHKxFdv7VOQHJ': 'Liam - Stoic',
  'z9fAnlkpzviPz146aGWa': 'Glinda - Witch',
  'XB0fDUnXU5powFXDhCwa': 'Charlotte - Swedish',
  'cgSgspJ2msm6clMCkdW9': 'Default Voice',
  'GBv7mTt0atIp3Br8iCZE': 'Thomas - Calm',
  'nPczCjzI2devNBz1zQrb': 'Brian - Trustworthy',
  'zrHiDhphv9ZnVXBqCLjz': 'Mimi - Playful',
};

// Example completion messages for each agent type
const COMPLETION_MESSAGES = {
  'project-planner': "I've completed the project planning. The roadmap is ready with clear milestones and deliverables.",
  'api-developer': "I've finished implementing the API endpoints. All tests are passing and documentation is updated.",
  'frontend-developer': "I've completed the UI implementation. The interface is responsive and ready for review.",
  'tdd-specialist': "I've written comprehensive tests. All tests are passing with good coverage.",
  'code-reviewer': "I've completed the code review. I've identified areas for improvement and security considerations.",
  'debugger': "I've resolved the issue. The root cause has been fixed and verified.",
  'security-scanner': "I've completed the security scan. All vulnerabilities have been documented.",
  'devops-engineer': "I've set up the pipeline. Everything is configured and ready to use.",
  'shadcn-ui-builder': "I've built the UI components. The interface is complete and follows design guidelines.",
  'product-manager': "I've completed the requirements. User stories and acceptance criteria are documented.",
  'marketing-writer': "I've written the content. Everything is ready for publication.",
  'api-documenter': "I've documented the API. All endpoints are covered with examples.",
  'test-runner': "Test run complete. All tests have been executed and results are available.",
  'refactor': "I've refactored the code. The structure is improved and all tests are passing.",
  'doc-writer': "I've written the documentation. All sections are complete and reviewed.",
  'meta-agent': "I've created the new agent. It's ready to use with the specialized capabilities.",
  'default': "I've completed the task. Everything is ready for the next step."
};

function addVoiceToAgent(agentDir) {
  const agentName = agentDir;
  const agentPath = join(AGENTS_DIR, agentDir, 'agent.md');
  
  try {
    const content = readFileSync(agentPath, 'utf-8');
    
    // Check if voice section already exists
    if (content.includes('## Voice Announcements')) {
      console.log(`✓ ${agentName} already has voice announcements`);
      return;
    }
    
    // Get voice configuration for this agent
    const voiceId = AGENT_VOICES[agentName] || AGENT_VOICES.default;
    const voiceDescription = VOICE_DESCRIPTIONS[voiceId] || 'Default Voice';
    const completionMessage = COMPLETION_MESSAGES[agentName] || COMPLETION_MESSAGES.default;
    
    // Replace placeholders in template
    const voiceSection = VOICE_SECTION_TEMPLATE
      .replace('{{COMPLETION_MESSAGE}}', completionMessage)
      .replace('{{VOICE_ID}}', voiceId)
      .replace('{{OUTPUT_DIR}}', process.cwd())
      .replace('{{VOICE_NAME}}', voiceDescription.split(' - ')[0])
      .replace('{{VOICE_DESCRIPTION}}', voiceDescription);
    
    // Append to file
    const updatedContent = content + voiceSection;
    writeFileSync(agentPath, updatedContent);
    
    console.log(`✓ Added voice announcements to ${agentName}`);
  } catch (error) {
    console.error(`✗ Error updating ${agentName}: ${error.message}`);
  }
}

// Main execution
console.log('Adding voice announcements to all agents...\n');

const agentDirs = readdirSync(AGENTS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

agentDirs.forEach(addVoiceToAgent);

console.log('\nDone! Voice announcements have been added to all agents.');
console.log('\nAgents will now announce task completion when voice is enabled.');
console.log('To test, run: claude-agents run <agent> --task "..." --voice');