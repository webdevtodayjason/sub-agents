import chalk from 'chalk';
import { getInstalledAgents, enableAgent, isAgentEnabled } from '../utils/config.js';

export async function enableCommand(agentName, options) {
  try {
    const installedAgents = getInstalledAgents();
    
    // Check if agent is installed
    if (!installedAgents[agentName]) {
      console.log(chalk.red(`❌ Agent "${agentName}" is not installed.`));
      console.log(chalk.gray('\nTo see available agents:'));
      console.log(chalk.cyan('  claude-agents list'));
      console.log(chalk.gray('\nTo install this agent:'));
      console.log(chalk.cyan(`  claude-agents install ${agentName}`));
      process.exit(1);
    }
    
    // Check if already enabled
    if (isAgentEnabled(agentName)) {
      console.log(chalk.yellow(`Agent "${agentName}" is already enabled.`));
      return;
    }
    
    // Enable the agent
    const isProject = options.project || installedAgents[agentName].scope === 'project';
    const success = enableAgent(agentName, isProject);
    
    if (success) {
      console.log(chalk.green(`✓ Enabled agent "${agentName}"`));
      console.log(chalk.gray(`Scope: ${isProject ? 'project' : 'user'}`));
    } else {
      console.log(chalk.red(`Failed to enable agent "${agentName}"`));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}