import chalk from 'chalk';
import ora from 'ora';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { getAgentsDir, getCommandsDir } from '../utils/paths.js';
import { getInstalledAgents, removeInstalledAgent } from '../utils/config.js';
import { confirmAction } from '../utils/prompts.js';
import { getAgentDetails } from '../utils/agents.js';

export async function removeCommand(agentName, options) {
  const spinner = ora();
  
  try {
    // Get installed agents
    const installedAgents = getInstalledAgents();
    
    // Check if agent is installed
    if (!installedAgents[agentName]) {
      console.log(chalk.red(`Agent "${agentName}" is not installed.`));
      console.log(chalk.gray('Use "claude-agents list --installed" to see installed agents.'));
      process.exit(1);
    }
    
    // Get agent info
    const agentInfo = installedAgents[agentName];
    const isProject = options.project || agentInfo.scope === 'project';
    
    // Check if trying to remove from wrong scope
    if (options.project && agentInfo.scope === 'user') {
      console.log(chalk.yellow(`Agent "${agentName}" is installed in user scope, not project scope.`));
      console.log(chalk.gray('Remove --project flag to uninstall from user scope.'));
      process.exit(1);
    }
    
    if (!options.project && agentInfo.scope === 'project') {
      console.log(chalk.yellow(`Agent "${agentName}" is installed in project scope, not user scope.`));
      console.log(chalk.gray('Add --project flag to uninstall from project scope.'));
      process.exit(1);
    }
    
    // Show agent details
    console.log(chalk.bold(`\nAgent to remove: ${agentName}`));
    console.log(`Scope: ${agentInfo.scope}`);
    console.log(`Version: ${agentInfo.version || 'unknown'}`);
    console.log(`Installed: ${new Date(agentInfo.installedAt).toLocaleDateString()}`);
    
    // Confirm removal
    const confirmMessage = `Are you sure you want to remove the "${agentName}" agent?`;
    if (!await confirmAction(confirmMessage, false)) {
      console.log(chalk.yellow('Removal cancelled.'));
      return;
    }
    
    spinner.start(`Removing ${chalk.bold(agentName)}...`);
    
    // Get directories
    const agentsDir = getAgentsDir(isProject);
    const commandsDir = getCommandsDir(isProject);
    
    // Remove agent file
    const agentPath = join(agentsDir, `${agentName}.md`);
    if (existsSync(agentPath)) {
      unlinkSync(agentPath);
    }
    
    // Remove associated slash commands
    const agentDetails = getAgentDetails(agentName);
    if (agentDetails && agentDetails.commands && agentDetails.commands.length > 0) {
      for (const command of agentDetails.commands) {
        const commandPath = join(commandsDir, `${command}.md`);
        if (existsSync(commandPath)) {
          try {
            unlinkSync(commandPath);
          } catch (error) {
            // Ignore errors for command removal
          }
        }
      }
    }
    
    // Remove from config
    removeInstalledAgent(agentName, isProject);
    
    spinner.succeed(`Removed ${chalk.bold(agentName)}`);
    
    console.log('');
    console.log(chalk.green('✓ Agent removed successfully!'));
    console.log(chalk.gray('The agent has been uninstalled from your system.'));
    
    // Suggest reinstallation
    console.log('');
    console.log(chalk.gray(`To reinstall this agent, use:`));
    console.log(chalk.gray(`claude-agents install ${agentName}`));
    
  } catch (error) {
    spinner.fail('Removal failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}