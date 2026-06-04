/**
 * Hooks System Integration
 * 
 * Integrates sub-agents with Claude Code hooks system for event-driven orchestration.
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

/**
 * Detect if we're running inside Claude Code (MCP environment)
 */
export function isClaudeCodeEnvironment() {
  // Check for MCP availability or Claude Code environment indicators
  const mcpIndicators = [
    process.env.MCP_SERVER_RUNNING,
    process.env.CLAUDE_CODE_SESSION,
    process.env.ANTHROPIC_MCP_CLIENT,
    // Check if specific MCP tools are available by looking for process args
    process.argv.some(arg => arg.includes('claude') || arg.includes('mcp'))
  ];
  
  return mcpIndicators.some(indicator => indicator);
}

/**
 * Load hooks configuration from .claude/settings.json
 */
export function loadHooksConfig(projectPath = process.cwd()) {
  const settingsPath = join(projectPath, '.claude', 'settings.json');
  
  if (!existsSync(settingsPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    return settings.hooks || null;
  } catch (error) {
    console.error(chalk.yellow('Warning: Failed to load hooks config:'), error.message);
    return null;
  }
}

/**
 * Execute hooks for a specific event type
 */
export async function executeHooks(eventType, data, options = {}) {
  const { projectPath = process.cwd(), verbose = false } = options;
  
  // Only execute hooks if we're in Claude Code environment
  if (!isClaudeCodeEnvironment()) {
    if (verbose) {
      console.log(chalk.gray(`Skipping hooks (not in Claude Code environment)`));
    }
    return;
  }
  
  const hooksConfig = loadHooksConfig(projectPath);
  if (!hooksConfig || !hooksConfig[eventType]) {
    if (verbose) {
      console.log(chalk.gray(`No hooks configured for event: ${eventType}`));
    }
    return;
  }
  
  const eventHooks = hooksConfig[eventType];
  
  for (const hookGroup of eventHooks) {
    const { matcher = '', hooks = [] } = hookGroup;
    
    // Simple matcher support (empty matcher matches all)
    if (matcher && !matchesFilter(data, matcher)) {
      continue;
    }
    
    for (const hook of hooks) {
      if (hook.type === 'command') {
        try {
          await executeCommandHook(hook.command, data, { projectPath, verbose });
        } catch (error) {
          console.error(chalk.red(`Hook execution failed: ${hook.command}`), error.message);
        }
      }
    }
  }
}

/**
 * Execute a command hook with data passed via stdin
 */
async function executeCommandHook(command, data, options = {}) {
  const { projectPath, verbose } = options;
  
  return new Promise((resolve, reject) => {
    if (verbose) {
      console.log(chalk.gray(`Executing hook: ${command}`));
    }
    
    const child = spawn('sh', ['-c', command], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        if (verbose && stdout) {
          console.log(chalk.gray('Hook output:'), stdout.trim());
        }
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Hook exited with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
    
    // Send data to hook via stdin as JSON
    if (data) {
      child.stdin.write(JSON.stringify(data, null, 2));
    }
    child.stdin.end();
  });
}

/**
 * Simple matcher function
 */
function matchesFilter(data, matcher) {
  if (!matcher) return true;
  
  // For now, just support simple string matching
  const dataStr = JSON.stringify(data).toLowerCase();
  return dataStr.includes(matcher.toLowerCase());
}

/**
 * Emit SubagentStop event when agent completes
 */
export async function emitSubagentStop(agentData, options = {}) {
  const eventData = {
    event: 'SubagentStop',
    timestamp: new Date().toISOString(),
    agent: {
      name: agentData.name,
      task: agentData.task,
      status: agentData.status,
      duration: agentData.duration,
      result: agentData.result
    },
    context: {
      executionId: agentData.executionId,
      targetFile: agentData.targetFile,
      handoffs: agentData.handoffs || []
    }
  };
  
  await executeHooks('SubagentStop', eventData, options);
}

/**
 * Emit Stop event when session completes
 */
export async function emitStop(sessionData, options = {}) {
  const eventData = {
    event: 'Stop',
    timestamp: new Date().toISOString(),
    session: {
      totalAgents: sessionData.totalAgents,
      completedTasks: sessionData.completedTasks,
      duration: sessionData.duration
    }
  };
  
  await executeHooks('Stop', eventData, options);
}

/**
 * Create a default .claude/settings.json template
 */
export function createDefaultHooksConfig() {
  return {
    hooks: {
      SubagentStop: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: 'node .claude/hooks/subagent-completion.js'
            }
          ]
        }
      ],
      Stop: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: 'node .claude/hooks/session-complete.js'
            }
          ]
        }
      ],
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: 'command',
              command: 'node .claude/hooks/orchestrator.js'
            }
          ]
        }
      ]
    }
  };
}