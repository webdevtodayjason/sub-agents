import chalk from 'chalk';
import ora from 'ora';
import { existsSync, unlinkSync, readdirSync, rmdirSync, statSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import { 
  getAgentsDir, 
  getCommandsDir,
  CLAUDE_USER_DIR,
  CLAUDE_PROJECT_DIR,
  CLAUDE_USER_AGENTS_DIR,
  CLAUDE_PROJECT_AGENTS_DIR,
  CLAUDE_USER_COMMANDS_DIR,
  CLAUDE_PROJECT_COMMANDS_DIR
} from '../utils/paths.js';
import { 
  loadConfig,
  saveConfig,
  removeInstalledAgent,
  getInstalledAgents 
} from '../utils/config.js';
import { detectContextForge } from '../utils/contextForgeDetector.js';

export async function uninstallCommand(options) {
  const spinner = ora();
  
  try {
    // Detect context-forge project
    const contextForgeInfo = detectContextForge();
    
    // Determine scope
    let scope = 'both';
    if (options.user) {
      scope = 'user';
    } else if (options.project) {
      scope = 'project';
    } else if (!options.all && !options.agent) {
      // Ask for scope if not specified
      const { selectedScope } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedScope',
        message: 'Which scope to uninstall from?',
        choices: [
          { name: 'User directory (~/.claude/)', value: 'user' },
          { name: 'Project directory (.claude/)', value: 'project' },
          { name: 'Both', value: 'both' }
        ],
        default: 'user'
      }]);
      scope = selectedScope;
    }
    
    // Get installed agents
    const userAgents = scope !== 'project' ? Object.keys(loadConfig(false).installedAgents) : [];
    const projectAgents = scope !== 'user' ? Object.keys(loadConfig(true).installedAgents) : [];
    const allAgents = [...new Set([...userAgents, ...projectAgents])];
    
    if (allAgents.length === 0) {
      console.log(chalk.yellow('No agents installed.'));
      return;
    }
    
    // Determine which agents to uninstall
    let agentsToUninstall = [];
    
    if (options.all) {
      agentsToUninstall = allAgents;
    } else if (options.agent) {
      if (!allAgents.includes(options.agent)) {
        console.log(chalk.red(`Agent "${options.agent}" is not installed.`));
        return;
      }
      agentsToUninstall = [options.agent];
    } else {
      // Interactive selection
      const { selectedAgents } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedAgents',
        message: 'Select agents to uninstall:',
        choices: allAgents.map(agent => ({
          name: agent,
          value: agent,
          checked: false
        })),
        validate: (answers) => {
          if (answers.length === 0) {
            return 'You must select at least one agent';
          }
          return true;
        }
      }]);
      agentsToUninstall = selectedAgents;
    }
    
    // Confirm uninstallation
    const confirmMessage = `Uninstall ${agentsToUninstall.length} agent(s) from ${scope} scope?`;
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: confirmMessage,
      default: false
    }]);
    
    if (!confirmed) {
      console.log(chalk.yellow('Uninstallation cancelled.'));
      return;
    }
    
    // Uninstall agents
    console.log('');
    let uninstalledCount = 0;
    
    for (const agentName of agentsToUninstall) {
      spinner.start(`Uninstalling ${chalk.bold(agentName)}...`);
      
      try {
        // Remove from user scope
        if (scope !== 'project' && userAgents.includes(agentName)) {
          // Remove agent file
          const userAgentPath = join(CLAUDE_USER_AGENTS_DIR, `${agentName}.md`);
          if (existsSync(userAgentPath)) {
            unlinkSync(userAgentPath);
          }
          
          // Remove commands
          removeAgentCommands(agentName, CLAUDE_USER_COMMANDS_DIR, false);
          
          // Update config
          removeInstalledAgent(agentName, false);
        }
        
        // Remove from project scope
        if (scope !== 'user' && projectAgents.includes(agentName)) {
          // Remove agent file
          const projectAgentPath = join(CLAUDE_PROJECT_AGENTS_DIR, `${agentName}.md`);
          if (existsSync(projectAgentPath)) {
            unlinkSync(projectAgentPath);
          }
          
          // Remove commands
          const isContextForge = contextForgeInfo.hasContextForge;
          removeAgentCommands(agentName, CLAUDE_PROJECT_COMMANDS_DIR, isContextForge);
          
          // Update config
          removeInstalledAgent(agentName, true);
        }
        
        uninstalledCount++;
        spinner.succeed(`Uninstalled ${chalk.bold(agentName)}`);
      } catch (error) {
        spinner.fail(`Failed to uninstall ${agentName}: ${error.message}`);
      }
    }
    
    // Clean up empty directories if requested
    if (options.clean) {
      spinner.start('Cleaning up empty directories...');
      
      if (scope !== 'project') {
        cleanEmptyDirectories(CLAUDE_USER_DIR);
      }
      if (scope !== 'user' && !contextForgeInfo.hasContextForge) {
        cleanEmptyDirectories(CLAUDE_PROJECT_DIR);
      }
      
      spinner.succeed('Cleaned up empty directories');
    }
    
    // Final message
    console.log('');
    console.log(chalk.green(`✓ Uninstalled ${uninstalledCount} agent(s)`));
    
    if (contextForgeInfo.hasContextForge && scope !== 'user') {
      console.log(chalk.gray('Context-forge files were preserved.'));
    }
    
  } catch (error) {
    spinner.fail('Uninstallation failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function removeAgentCommands(agentName, commandsDir, isContextForge) {
  // Map of agent names to their command files
  const agentCommands = {
    'api-developer': ['api'],
    'api-documenter': ['apidoc'],
    'code-reviewer': ['review'],
    'debugger': ['debug'],
    'devops-engineer': ['devops'],
    'doc-writer': ['document'],
    'frontend-developer': ['frontend'],
    'marketing-writer': ['marketing'],
    'product-manager': ['product'],
    'project-planner': ['plan'],
    'refactor': ['refactor'],
    'security-scanner': ['security-scan'],
    'shadcn-ui-builder': ['ui', 'shadcn'],
    'tdd-specialist': ['tdd'],
    'test-runner': ['test']
  };
  
  const commands = agentCommands[agentName] || [];
  
  for (const command of commands) {
    const fileName = isContextForge ? `agent-${command}.md` : `${command}.md`;
    const targetDir = isContextForge ? join(commandsDir, 'agents') : commandsDir;
    const commandPath = join(targetDir, fileName);
    
    if (existsSync(commandPath)) {
      unlinkSync(commandPath);
    }
  }
}

function cleanEmptyDirectories(dir) {
  if (!existsSync(dir)) return;
  
  try {
    const files = readdirSync(dir);
    
    if (files.length === 0) {
      rmdirSync(dir);
    } else {
      // Recursively clean subdirectories
      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          cleanEmptyDirectories(fullPath);
        }
      }
      
      // Check again after cleaning subdirectories
      const remainingFiles = readdirSync(dir);
      if (remainingFiles.length === 0) {
        rmdirSync(dir);
      }
    }
  } catch (error) {
    // Ignore errors (e.g., permission issues)
  }
}