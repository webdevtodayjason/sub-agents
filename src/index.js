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
  .alias('uninstall')
  .description('Remove an installed agent')
  .option('-p, --project', 'Remove from project scope')
  .action(removeCommand);

// Update command
program
  .command('update')
  .description('Update agents to latest versions')
  .option('-a, --all', 'Update all installed agents')
  .action(() => {
    console.log(chalk.yellow('Update command coming soon!'));
  });

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