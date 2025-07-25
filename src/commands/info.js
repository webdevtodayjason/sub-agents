import chalk from 'chalk';
import { getAgentDetails } from '../utils/agents.js';
import { getInstalledAgents, isAgentEnabled } from '../utils/config.js';

export async function infoCommand(agentName) {
  try {
    const agentDetails = getAgentDetails(agentName);
    const installedAgents = getInstalledAgents();
    const isInstalled = installedAgents.hasOwnProperty(agentName);
    
    if (!agentDetails && !isInstalled) {
      console.log(chalk.red(`Agent "${agentName}" not found.`));
      console.log(chalk.gray('Use "claude-agents list" to see available agents.'));
      process.exit(1);
    }
    
    // Display agent information
    console.log(chalk.bold.blue(`\n${agentName}\n${'='.repeat(agentName.length)}`));
    
    if (agentDetails) {
      console.log(chalk.bold('Description:'), agentDetails.description);
      console.log(chalk.bold('Version:'), agentDetails.version);
      console.log(chalk.bold('Author:'), agentDetails.author || 'Unknown');
      
      if (agentDetails.tags && agentDetails.tags.length > 0) {
        console.log(chalk.bold('Tags:'), agentDetails.tags.join(', '));
      }
      
      console.log('');
      console.log(chalk.bold('Installation Status:'));
      if (isInstalled) {
        const enabled = isAgentEnabled(agentName);
        const installedInfo = installedAgents[agentName];
        console.log(`  Status: ${enabled ? chalk.green('Enabled') : chalk.gray('Disabled')}`);
        console.log(`  Scope: ${installedInfo.scope}`);
        console.log(`  Installed: ${new Date(installedInfo.installedAt).toLocaleDateString()}`);
      } else {
        console.log(`  Status: ${chalk.blue('Available for installation')}`);
      }
      
      console.log('');
      console.log(chalk.bold('Requirements:'));
      if (agentDetails.requirements?.tools) {
        console.log('  Tools:', agentDetails.requirements.tools.join(', '));
      }
      if (agentDetails.requirements?.optional_tools) {
        console.log('  Optional tools:', agentDetails.requirements.optional_tools.join(', '));
      }
      
      if (agentDetails.hooks) {
        console.log('');
        console.log(chalk.bold('Hooks:'));
        if (agentDetails.hooks.recommended) {
          console.log('  Recommended:', agentDetails.hooks.recommended.join(', '));
        }
        if (agentDetails.hooks.optional) {
          console.log('  Optional:', agentDetails.hooks.optional.join(', '));
        }
      }
      
      if (agentDetails.commands && agentDetails.commands.length > 0) {
        console.log('');
        console.log(chalk.bold('Slash Commands:'));
        agentDetails.commands.forEach(cmd => {
          console.log(`  /${cmd}`);
        });
      }
      
      console.log('');
      console.log(chalk.bold('System Prompt Preview:'));
      const promptPreview = agentDetails.content.split('\n').slice(0, 5).join('\n');
      console.log(chalk.gray(promptPreview));
      if (agentDetails.content.split('\n').length > 5) {
        console.log(chalk.gray('  [... truncated ...]'));
      }
      
    } else if (isInstalled) {
      // Agent is installed but not in available agents (custom agent)
      const installedInfo = installedAgents[agentName];
      console.log(chalk.bold('Description:'), installedInfo.description || 'Custom agent');
      console.log(chalk.bold('Version:'), installedInfo.version || 'Unknown');
      console.log(chalk.bold('Scope:'), installedInfo.scope);
      console.log(chalk.bold('Installed:'), new Date(installedInfo.installedAt).toLocaleDateString());
      console.log(chalk.bold('Status:'), isAgentEnabled(agentName) ? chalk.green('Enabled') : chalk.gray('Disabled'));
    }
    
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}