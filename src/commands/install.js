import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  getAgentsDir, 
  getCommandsDir, 
  ensureDirectories, 
  ensureProjectDirectories 
} from '../utils/paths.js';
import { 
  selectAgents, 
  confirmAction, 
  selectInstallScope,
  selectHookOptions
} from '../utils/prompts.js';
import { 
  addInstalledAgent, 
  getInstalledAgents 
} from '../utils/config.js';
import { 
  getAvailableAgents, 
  getAgentDetails,
  formatAgentForInstall
} from '../utils/agents.js';
import { detectContextForge } from '../utils/contextForgeDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Force a command file's frontmatter `name` to a given value.
 *
 * Context-forge installs rename command files to `agent-<command>.md` to avoid
 * conflicts, but the slash-command resolver prefers an explicit frontmatter
 * `name:` over the filename. Without rewriting it, a `name: api` field would
 * make the prefixed `agent-api.md` register as `api`, silently defeating the
 * rename. Rewriting the name to match the prefixed filename keeps both the
 * explicit-name discoverability and the conflict-avoidance prefix.
 */
export function setCommandName(content, name) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return `---\nname: ${name}\n---\n\n${content}`;
  }
  const fm = fmMatch[1];
  const newFm = /^name:.*$/m.test(fm)
    ? fm.replace(/^name:.*$/m, `name: ${name}`)
    : `name: ${name}\n${fm}`;
  return content.replace(fmMatch[0], `---\n${newFm}\n---`);
}

export async function installCommand(options) {
  const spinner = ora();
  
  try {
    // Detect context-forge project
    const contextForgeInfo = detectContextForge();
    if (contextForgeInfo.hasContextForge) {
      console.log(chalk.cyan('🛠️  Context-Forge project detected!'));
      console.log(chalk.gray('  Sub-agents will be integrated with your existing setup.\n'));
    }
    
    // Ensure directories exist
    ensureDirectories();
    
    // Get available agents
    spinner.start('Loading available agents...');
    const availableAgents = getAvailableAgents();
    spinner.stop();
    
    if (availableAgents.length === 0) {
      console.log(chalk.yellow('No agents available to install.'));
      return;
    }
    
    // Get already installed agents
    const installedAgents = getInstalledAgents();
    const installedNames = Object.keys(installedAgents);
    
    // Filter out already installed agents
    const installableAgents = availableAgents.filter(
      agent => !installedNames.includes(agent.name)
    );
    
    if (installableAgents.length === 0) {
      console.log(chalk.yellow('All available agents are already installed.'));
      console.log(chalk.gray('Use "claude-agents list" to see installed agents.'));
      return;
    }
    
    // Select agents to install
    let selectedAgents;
    if (options.all) {
      selectedAgents = installableAgents.map(a => a.name);
    } else {
      selectedAgents = await selectAgents(installableAgents);
    }
    
    if (selectedAgents.length === 0) {
      console.log(chalk.yellow('No agents selected for installation.'));
      return;
    }
    
    // Select installation scope
    const scope = options.project ? 'project' : await selectInstallScope();
    const isProject = scope === 'project';
    
    if (isProject) {
      ensureProjectDirectories();
    }
    
    const agentsDir = getAgentsDir(isProject);
    const commandsDir = getCommandsDir(isProject);
    
    // Confirm installation
    const confirmMessage = `Install ${selectedAgents.length} agent(s) to ${scope} directory?`;
    if (!await confirmAction(confirmMessage)) {
      console.log(chalk.yellow('Installation cancelled.'));
      return;
    }
    
    // Install each selected agent
    console.log('');
    for (const agentName of selectedAgents) {
      spinner.start(`Installing ${chalk.bold(agentName)}...`);
      
      try {
        const agentDetails = getAgentDetails(agentName);
        if (!agentDetails) {
          spinner.fail(`Failed to load agent ${agentName}`);
          continue;
        }
        
        // Write agent file
        const agentPath = join(agentsDir, `${agentName}.md`);
        const formattedContent = formatAgentForInstall(agentDetails);
        writeFileSync(agentPath, formattedContent);
        
        // Copy associated slash commands if they exist
        if (agentDetails.commands && agentDetails.commands.length > 0) {
          // If context-forge project, put commands in sub-agents folder to avoid conflicts
          const targetCommandsDir = contextForgeInfo.hasContextForge && isProject
            ? join(commandsDir, 'agents')
            : commandsDir;
            
          // Ensure sub-agents command directory exists
          if (contextForgeInfo.hasContextForge && isProject && !existsSync(targetCommandsDir)) {
            mkdirSync(targetCommandsDir, { recursive: true });
          }
          
          for (const command of agentDetails.commands) {
            const srcPath = join(__dirname, '..', '..', 'commands', `${command}.md`);
            if (existsSync(srcPath)) {
              const isPrefixed = contextForgeInfo.hasContextForge && isProject;
              // Prefix command name if in context-forge project to avoid conflicts
              const commandName = isPrefixed ? `agent-${command}.md` : `${command}.md`;
              const destPath = join(targetCommandsDir, commandName);

              if (isPrefixed) {
                // Rewrite the frontmatter `name` to match the prefixed filename so an
                // explicit `name:` field can't defeat the conflict-avoidance rename.
                const content = readFileSync(srcPath, 'utf-8');
                writeFileSync(destPath, setCommandName(content, `agent-${command}`));
              } else {
                copyFileSync(srcPath, destPath);
              }
            }
          }
        }
        
        // Add to config
        addInstalledAgent(agentName, agentDetails, isProject);
        
        spinner.succeed(`Installed ${chalk.bold(agentName)}`);
        
        // Ask about hooks configuration
        if (agentDetails.hooks?.recommended || agentDetails.hooks?.optional) {
          const hooks = await selectHookOptions();
          if (hooks && hooks.length > 0) {
            console.log(chalk.gray(`  Configure hooks manually in your settings.json`));
          }
        }
        
      } catch (error) {
        spinner.fail(`Failed to install ${agentName}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log(chalk.green('✓ Installation complete!'));
    console.log(chalk.gray('Use "claude-agents list" to see your installed agents.'));
    console.log(chalk.gray('Agents are automatically enabled. Use "claude-agents disable <agent>" to disable.'));
    
    if (contextForgeInfo.hasContextForge && isProject) {
      console.log('');
      console.log(chalk.cyan('📝 Context-Forge Integration:'));
      console.log(chalk.gray('  • Agent commands are in .claude/commands/agents/ to avoid conflicts'));
      console.log(chalk.gray('  • Agents can work with your existing PRPs'));
      console.log(chalk.gray('  • Use Task("agent-name: description") in Claude Code'));
    }
    
  } catch (error) {
    spinner.fail('Installation failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}