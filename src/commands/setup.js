import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { existsSync } from 'fs';
import { getAvailableAgents } from '../utils/agents.js';
import { loadEnv, saveEnv, backupEnv } from '../utils/env.js';
import { loadConfig, saveConfig } from '../utils/config.js';
import { execSync } from 'child_process';
import { join } from 'path';

// Agent categories for better organization
const AGENT_CATEGORIES = {
  'Development': ['api-developer', 'frontend-developer', 'refactor'],
  'Testing': ['tdd-specialist', 'test-runner', 'debugger'],
  'Documentation': ['doc-writer', 'api-documenter'],
  'Review & Security': ['code-reviewer', 'security-scanner'],
  'DevOps': ['devops-engineer'],
  'Product': ['product-manager', 'project-planner'],
  'UI/UX': ['shadcn-ui-builder'],
  'Meta': ['meta-agent'],
  'Marketing': ['marketing-writer']
};

export async function setupCommand(options) {
  console.log(chalk.bold.blue('🧙 Claude Sub-Agents Setup Wizard\n'));
  
  // Determine setup mode
  let setupMode = 'full';
  if (options.agentsOnly) setupMode = 'agents';
  else if (options.voiceOnly) setupMode = 'voice';
  else if (options.keysOnly) setupMode = 'keys';
  
  try {
    // Load current configuration
    const currentEnv = loadEnv();
    const config = loadConfig();
    
    // Create backup of .env file
    backupEnv();
    
    let setupData = {
      agents: Object.keys(config.installedAgents || {}),
      voiceProvider: currentEnv.VOICE_PROVIDER || 'local',
      llmProvider: currentEnv.LLM_PROVIDER || 'openai',
      apiKeys: {}
    };
    
    // Run appropriate setup steps based on mode
    if (setupMode === 'full' || setupMode === 'agents') {
      setupData = await setupAgents(setupData);
    }
    
    if (setupMode === 'full' || setupMode === 'voice') {
      setupData = await setupVoice(setupData);
    }
    
    if (setupMode === 'full' || setupMode === 'keys') {
      setupData = await setupApiKeys(setupData);
    }
    
    // Show summary
    console.log('\n' + chalk.bold.cyan('📋 Setup Summary:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (setupData.agents) {
      console.log(chalk.yellow('Agents:'), setupData.agents.length ? 
        setupData.agents.join(', ') : 'None selected');
    }
    
    console.log(chalk.yellow('Voice Provider:'), setupData.voiceProvider);
    console.log(chalk.yellow('LLM Provider:'), setupData.llmProvider);
    
    const configuredKeys = Object.keys(setupData.apiKeys).filter(k => setupData.apiKeys[k]);
    console.log(chalk.yellow('API Keys:'), configuredKeys.length ? 
      configuredKeys.join(', ') : 'None configured');
    
    // Confirm and apply
    const { confirmSetup } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmSetup',
      message: 'Apply this configuration?',
      default: true
    }]);
    
    if (!confirmSetup) {
      console.log(chalk.yellow('\n✖ Setup cancelled'));
      return;
    }
    
    // Apply configuration
    const spinner = ora('Applying configuration...').start();
    
    // Update environment variables
    const envUpdates = {
      VOICE_PROVIDER: setupData.voiceProvider,
      VOICE_ENABLED: setupData.voiceProvider !== 'none' ? 'true' : 'false',
      LLM_PROVIDER: setupData.llmProvider,
      ...setupData.apiKeys
    };
    
    saveEnv(envUpdates);
    
    // Update config for agents
    if (setupData.agents) {
      // This would normally update the actual agent installation
      // For now, just update the config
      config.installedAgents = setupData.agents;
      saveConfig(config);
    }
    
    spinner.succeed('Configuration applied successfully!');
    
    // Test voice if configured
    if (setupData.voiceProvider !== 'none' && setupData.voiceProvider !== 'mcp') {
      const { testVoice } = await inquirer.prompt([{
        type: 'confirm',
        name: 'testVoice',
        message: 'Would you like to test voice announcements?',
        default: true
      }]);
      
      if (testVoice) {
        console.log(chalk.gray('\n🔊 Testing voice...'));
        try {
          execSync(`node ${join(process.cwd(), 'src/index.js')} voice --test "Setup complete!"`, 
            { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Voice test failed:'), error.message);
        }
      }
    }
    
    // Show next steps
    console.log('\n' + chalk.bold.green('✨ Setup Complete!'));
    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.gray('1.'), 'Run an agent:', chalk.cyan('claude-agents run <agent> --task "..."'));
    console.log(chalk.gray('2.'), 'View status:', chalk.cyan('claude-agents status'));
    console.log(chalk.gray('3.'), 'Launch dashboard:', chalk.cyan('claude-agents dashboard'));
    
    if (setupData.voiceProvider === 'mcp') {
      console.log('\n' + chalk.yellow('⚠️  MCP ElevenLabs requires:'));
      console.log(chalk.gray('1. Install MCP server:'), chalk.cyan('claude mcp add ElevenLabs'));
      console.log(chalk.gray('2. Add API key:'), chalk.cyan('-e ELEVENLABS_API_KEY=your-key'));
      console.log(chalk.gray('3. Complete command:'), chalk.cyan('-- uvx elevenlabs-mcp'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n✖ Setup failed:'), error.message);
    console.log(chalk.yellow('Your .env file has been backed up to .env.backup'));
    process.exit(1);
  }
}

async function setupAgents(setupData) {
  console.log(chalk.bold.cyan('\n🤖 Agent Selection'));
  console.log(chalk.gray('Select which agents to install/enable:\n'));
  
  const availableAgents = getAvailableAgents();
  const config = loadConfig();
  const installedAgentNames = Object.keys(config.installedAgents || {});
  
  // Create choices organized by category
  const choices = [];
  
  for (const [category, agentNames] of Object.entries(AGENT_CATEGORIES)) {
    choices.push(new inquirer.Separator(chalk.bold.yellow(`\n${category}`)));
    
    for (const agentName of agentNames) {
      const agent = availableAgents.find(a => a.name === agentName);
      if (agent) {
        const isInstalled = installedAgentNames.includes(agentName);
        choices.push({
          name: `${agent.name} - ${agent.description} ${isInstalled ? chalk.green('(installed)') : ''}`,
          value: agent.name,
          checked: isInstalled
        });
      }
    }
  }
  
  const { selectedAgents } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedAgents',
    message: 'Select agents:',
    choices,
    pageSize: 20
  }]);
  
  setupData.agents = selectedAgents;
  return setupData;
}

async function setupVoice(setupData) {
  console.log(chalk.bold.cyan('\n🔊 Voice Configuration'));
  
  const { voiceProvider } = await inquirer.prompt([{
    type: 'list',
    name: 'voiceProvider',
    message: 'Select voice provider:',
    choices: [
      {
        name: 'Local TTS (Fast, Offline) - macOS/Linux system voices',
        value: 'local'
      },
      {
        name: 'OpenAI TTS (High Quality) - Requires API key',
        value: 'openai'
      },
      {
        name: 'MCP ElevenLabs (Premium) - For Claude Code only',
        value: 'mcp'
      },
      {
        name: 'None - Disable voice announcements',
        value: 'none'
      }
    ],
    default: setupData.voiceProvider
  }]);
  
  setupData.voiceProvider = voiceProvider;
  
  // Configure provider-specific settings
  if (voiceProvider === 'openai') {
    setupData.requiresOpenAI = true;
  } else if (voiceProvider === 'mcp') {
    console.log(chalk.yellow('\n⚠️  MCP ElevenLabs requires additional setup in Claude Code'));
  }
  
  return setupData;
}

async function setupApiKeys(setupData) {
  console.log(chalk.bold.cyan('\n🔑 API Key Configuration'));
  console.log(chalk.gray('Enter API keys for selected services (leave blank to skip):\n'));
  
  const keysToConfig = [];
  
  // Determine which keys we need based on selections
  if (setupData.llmProvider === 'openai' || setupData.requiresOpenAI) {
    keysToConfig.push({ name: 'OpenAI', key: 'OPENAI_API_KEY' });
  }
  
  if (setupData.llmProvider === 'anthropic') {
    keysToConfig.push({ name: 'Anthropic', key: 'ANTHROPIC_API_KEY' });
  }
  
  if (setupData.voiceProvider === 'mcp' || setupData.voiceProvider === 'elevenlabs') {
    keysToConfig.push({ name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY' });
  }
  
  // Always offer to configure engineer name
  keysToConfig.push({ name: 'Engineer Name (for personalized messages)', key: 'ENGINEER_NAME', isName: true });
  
  const currentEnv = loadEnv();
  
  for (const keyConfig of keysToConfig) {
    const currentValue = currentEnv[keyConfig.key];
    const hasValue = currentValue && currentValue !== '';
    
    const prompt = {
      type: keyConfig.isName ? 'input' : 'password',
      name: 'value',
      message: `${keyConfig.name}:`,
      default: hasValue ? (keyConfig.isName ? currentValue : '(configured)') : undefined,
      when: () => {
        if (hasValue && !keyConfig.isName) {
          return inquirer.prompt([{
            type: 'confirm',
            name: 'update',
            message: `${keyConfig.name} is already configured. Update it?`,
            default: false
          }]).then(a => a.update);
        }
        return true;
      }
    };
    
    const { value } = await inquirer.prompt([prompt]);
    
    if (value && value !== '(configured)') {
      setupData.apiKeys[keyConfig.key] = value;
    }
  }
  
  return setupData;
}