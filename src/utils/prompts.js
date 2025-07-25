import inquirer from 'inquirer';
import chalk from 'chalk';

export async function selectAgents(availableAgents, message = 'Select agents to install:') {
  const choices = availableAgents.map(agent => ({
    name: `${chalk.bold(agent.name)} - ${agent.description}`,
    value: agent.name,
    short: agent.name
  }));
  
  const { selectedAgents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedAgents',
      message,
      choices,
      pageSize: 10,
      validate: (answers) => {
        if (answers.length === 0) {
          return 'You must select at least one agent';
        }
        return true;
      }
    }
  ]);
  
  return selectedAgents;
}

export async function confirmAction(message, defaultValue = true) {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue
    }
  ]);
  
  return confirmed;
}

export async function selectInstallScope() {
  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Where would you like to install the agents?',
      choices: [
        {
          name: 'User directory (~/.claude/agents/) - Available in all projects',
          value: 'user',
          short: 'User'
        },
        {
          name: 'Project directory (.claude/agents/) - Only for this project',
          value: 'project',
          short: 'Project'
        }
      ],
      default: 'user'
    }
  ]);
  
  return scope;
}

export async function inputAgentDetails() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Agent name (lowercase, hyphens allowed):',
      validate: (input) => {
        if (!input) return 'Agent name is required';
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Agent name must be lowercase letters, numbers, and hyphens only';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Agent description:',
      validate: (input) => {
        if (!input) return 'Description is required';
        return true;
      }
    },
    {
      type: 'checkbox',
      name: 'tools',
      message: 'Select tools the agent should have access to:',
      choices: [
        'Read',
        'Write',
        'Edit',
        'MultiEdit',
        'Bash',
        'Grep',
        'Glob',
        'WebSearch',
        'WebFetch',
        'Task',
        'TodoWrite',
        'NotebookRead',
        'NotebookEdit'
      ],
      default: ['Read', 'Edit', 'Grep', 'Glob']
    },
    {
      type: 'editor',
      name: 'systemPrompt',
      message: 'Enter the system prompt for the agent (press Enter to open editor):'
    }
  ]);
  
  return answers;
}

export async function selectHookOptions() {
  const { configureHooks } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureHooks',
      message: 'Would you like to configure hooks for this agent?',
      default: false
    }
  ]);
  
  if (!configureHooks) return null;
  
  const { hooks } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'hooks',
      message: 'Select hooks to configure:',
      choices: [
        {
          name: 'PostToolUse:Edit - Run after file edits',
          value: 'PostToolUse:Edit',
          short: 'Post Edit'
        },
        {
          name: 'PostToolUse:Write - Run after file writes',
          value: 'PostToolUse:Write',
          short: 'Post Write'
        },
        {
          name: 'Stop - Run when task completes',
          value: 'Stop',
          short: 'On Stop'
        },
        {
          name: 'PreToolUse:Bash - Run before shell commands',
          value: 'PreToolUse:Bash',
          short: 'Pre Bash'
        }
      ]
    }
  ]);
  
  return hooks;
}