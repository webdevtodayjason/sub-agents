import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Commands
import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { enableCommand } from './commands/enable.js';
import { disableCommand } from './commands/disable.js';
import { infoCommand } from './commands/info.js';
import { createCommand } from './commands/create.js';
import { removeCommand } from './commands/remove.js';
import { runCommand } from './commands/run.js';
import { dashboardCommand } from './commands/dashboard.js';
import { initCommand } from './commands/init.js';
import { uninstallCommand } from './commands/uninstall.js';
import { voiceCommand } from './commands/voice.js';
import { chainCommand } from './commands/chain.js';
import { setupCommand } from './commands/setup.js';
import { diagnoseCommand } from './commands/diagnose.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

// ASCII Art Banner
console.log(chalk.blue(`
╔═══════════════════════════════════════════╗
║       Claude Sub-Agents Manager           ║
║   Enhance Claude Code with AI Agents      ║
╚═══════════════════════════════════════════╝
`));

program
  .name('claude-agents')
  .description('CLI tool to manage Claude Code sub-agents')
  .version(packageJson.version);

// Init command
program
  .command('init')
  .description('Initialize sub-agents in the current project')
  .option('--respect-context-forge', 'Preserve existing context-forge files')
  .option('--merge', 'Merge with existing CLAUDE.md (default: true)')
  .option('--no-merge', 'Do not modify existing CLAUDE.md')
  .option('--force', 'Overwrite existing files')
  .option('--no-hooks', 'Skip Claude Code hooks installation')
  .action(initCommand);

// Install command
program
  .command('install')
  .description('Install sub-agents to your system')
  .option('-p, --project', 'Install to project directory instead of user directory')
  .option('-a, --all', 'Install all available agents')
  .action(installCommand);

// List command
program
  .command('list')
  .description('List available and installed agents')
  .option('-i, --installed', 'Show only installed agents')
  .option('-a, --available', 'Show only available agents')
  .action(listCommand);

// Enable command
program
  .command('enable <agent>')
  .description('Enable a specific agent')
  .option('-p, --project', 'Enable in project scope')
  .action(enableCommand);

// Disable command
program
  .command('disable <agent>')
  .description('Disable a specific agent without removing it')
  .option('-p, --project', 'Disable in project scope')
  .action(disableCommand);

// Info command
program
  .command('info <agent>')
  .description('Show detailed information about an agent')
  .action(infoCommand);

// Create command
program
  .command('create')
  .description('Create a new custom agent')
  .option('-n, --name <name>', 'Agent name')
  .option('-t, --template <template>', 'Use a template (basic, advanced)')
  .action(createCommand);

// Remove command
program
  .command('remove <agent>')
  .description('Remove an installed agent')
  .option('-p, --project', 'Remove from project scope')
  .action(removeCommand);

// Uninstall command
program
  .command('uninstall')
  .description('Uninstall agents with cleanup options')
  .option('--all', 'Uninstall all agents')
  .option('--agent <name>', 'Uninstall specific agent')
  .option('--user', 'Uninstall from user scope only')
  .option('--project', 'Uninstall from project scope only')
  .option('--clean', 'Remove empty directories after uninstall')
  .action(uninstallCommand);

// Run command
program
  .command('run <agent>')
  .description('Run a specific agent independently')
  .option('-t, --task <task>', 'Task description for the agent')
  .option('-f, --file <file>', 'Target file or directory')
  .option('-i, --interactive', 'Interactive mode for task input')
  .option('--voice', 'Enable voice announcements')
  .option('--no-voice', 'Disable voice announcements')
  .action(runCommand);

// Update command
program
  .command('update')
  .description('Update agents to latest versions')
  .option('-a, --all', 'Update all installed agents')
  .action(() => {
    console.log(chalk.yellow('Update command coming soon!'));
  });

// Dashboard command
program
  .command('dashboard')
  .description('Launch the web dashboard for agent management')
  .option('-p, --port <port>', 'Dashboard port', '7842')
  .option('--no-browser', "Don't open browser automatically")
  .action(dashboardCommand);

// Voice command
program
  .command('voice')
  .description('Configure voice announcements')
  .option('--setup', 'Run interactive setup wizard')
  .option('--status', 'Show voice system status')
  .option('--enable', 'Enable voice announcements')
  .option('--disable', 'Disable voice announcements')
  .option('--provider <provider>', 'Set voice provider (auto, mcp, openai, local)')
  .option('--test [text]', 'Test voice with optional text')
  .option('--api-key', 'Configure API keys interactively')
  .action(voiceCommand);

// Chain command
program
  .command('chain <nameOrAgents...>')
  .description('Run agents in sequence or parallel')
  .option('--task <task>', 'Task description for all agents')
  .option('--tasks <tasks...>', 'Individual tasks for each agent')
  .option('--voice', 'Enable voice announcements')
  .option('--isolated', 'Run agents in isolated mode')
  .option('--concurrent', 'Run agents concurrently where possible')
  .option('--save <name>', 'Save as a reusable chain')
  .action(chainCommand);

// Setup command
program
  .command('setup')
  .description('Interactive setup wizard for agents, voice, and API keys')
  .option('--agents-only', 'Configure only agents')
  .option('--voice-only', 'Configure only voice settings')
  .option('--keys-only', 'Configure only API keys')
  .action(setupCommand);

// Diagnose command
program
  .command('diagnose')
  .description('Diagnose installation issues and check hook health')
  .action(diagnoseCommand);

// Config command
program
  .command('config')
  .description('Configure default settings')
  .action(() => {
    console.log(chalk.yellow('Config command coming soon!'));
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}