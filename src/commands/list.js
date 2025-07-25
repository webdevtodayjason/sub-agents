import chalk from 'chalk';
import Table from 'cli-table3';
import { getAvailableAgents } from '../utils/agents.js';
import { getInstalledAgents, isAgentEnabled } from '../utils/config.js';

export async function listCommand(options) {
  try {
    const availableAgents = getAvailableAgents();
    const installedAgents = getInstalledAgents();
    
    // Create table
    const table = new Table({
      head: [
        chalk.bold('Agent'),
        chalk.bold('Status'),
        chalk.bold('Scope'),
        chalk.bold('Version'),
        chalk.bold('Description')
      ],
      colWidths: [20, 12, 10, 10, 50],
      wordWrap: true
    });
    
    // Process agents
    const allAgents = new Map();
    
    // Add available agents
    availableAgents.forEach(agent => {
      allAgents.set(agent.name, {
        ...agent,
        available: true,
        installed: false
      });
    });
    
    // Update with installed agents
    Object.entries(installedAgents).forEach(([name, info]) => {
      const agent = allAgents.get(name) || { name, description: info.description };
      agent.installed = true;
      agent.installedInfo = info;
      allAgents.set(name, agent);
    });
    
    // Filter based on options
    let agentsToShow = Array.from(allAgents.values());
    
    if (options.installed) {
      agentsToShow = agentsToShow.filter(a => a.installed);
    } else if (options.available) {
      agentsToShow = agentsToShow.filter(a => a.available && !a.installed);
    }
    
    // Sort by name
    agentsToShow.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add to table
    agentsToShow.forEach(agent => {
      let status = '';
      let scope = '-';
      let version = agent.version || '-';
      
      if (agent.installed) {
        const enabled = isAgentEnabled(agent.name);
        status = enabled 
          ? chalk.green('● Enabled') 
          : chalk.gray('○ Disabled');
        scope = agent.installedInfo?.scope || 'unknown';
        version = agent.installedInfo?.version || version;
      } else {
        status = chalk.blue('Available');
      }
      
      table.push([
        chalk.bold(agent.name),
        status,
        scope,
        version,
        agent.description || '-'
      ]);
    });
    
    // Display results
    if (agentsToShow.length === 0) {
      if (options.installed) {
        console.log(chalk.yellow('No agents installed yet.'));
        console.log(chalk.gray('Use "claude-agents install" to install agents.'));
      } else if (options.available) {
        console.log(chalk.yellow('No new agents available.'));
      } else {
        console.log(chalk.yellow('No agents found.'));
      }
    } else {
      console.log(table.toString());
      
      // Show summary
      console.log('');
      const installedCount = agentsToShow.filter(a => a.installed).length;
      const availableCount = agentsToShow.filter(a => !a.installed).length;
      const enabledCount = agentsToShow.filter(a => a.installed && isAgentEnabled(a.name)).length;
      
      if (!options.installed && !options.available) {
        console.log(chalk.gray(`Total: ${agentsToShow.length} agents`));
        console.log(chalk.gray(`Installed: ${installedCount} (${enabledCount} enabled)`));
        console.log(chalk.gray(`Available: ${availableCount}`));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}