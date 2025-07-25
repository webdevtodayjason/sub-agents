import chalk from 'chalk';
import { getInstalledAgents, disableAgent, isAgentEnabled } from '../utils/config.js';

export async function disableCommand(agentName, options) {
  try {
    const installedAgents = getInstalledAgents();
    
    // Check if agent is installed
    if (!installedAgents[agentName]) {
      console.log(chalk.red(`Agent "${agentName}" is not installed.`));
      console.log(chalk.gray('Use "claude-agents list" to see available agents.'));
      process.exit(1);
    }
    
    // Check if already disabled
    if (!isAgentEnabled(agentName)) {
      console.log(chalk.yellow(`Agent "${agentName}" is already disabled.`));
      return;
    }
    
    // Disable the agent
    const isProject = options.project || installedAgents[agentName].scope === 'project';
    const success = disableAgent(agentName, isProject);
    
    if (success) {
      console.log(chalk.green(`✓ Disabled agent "${agentName}"`));
      console.log(chalk.gray(`Scope: ${isProject ? 'project' : 'user'}`));
      console.log(chalk.gray(`Use "claude-agents enable ${agentName}" to re-enable.`));
    } else {
      console.log(chalk.red(`Failed to disable agent "${agentName}"`));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}