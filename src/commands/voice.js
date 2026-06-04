import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { getVoiceConfig, saveVoiceConfig, getAPIKeys, saveAPIKey } from '../utils/config.js';
import { hasApiKey, getEnvVar, saveEnv, loadEnv } from '../utils/env.js';
import { getTTS } from '../utils/tts/index.js';

const execAsync = promisify(exec);

export async function voiceCommand(options) {
  const spinner = ora();
  
  try {
    // Handle new options
    if (options.setup) {
      await handleSetup();
      return;
    }
    
    if (options.status) {
      await handleStatus();
      return;
    }
    
    // If specific action provided
    if (options.enable !== undefined) {
      await handleEnable(options.enable);
      return;
    }
    
    if (options.provider) {
      await handleProvider(options.provider);
      return;
    }
    
    if (options.test) {
      await handleTest(options.test);
      return;
    }
    
    if (options.apiKey) {
      await handleAPIKey(options.apiKey);
      return;
    }
    
    // Interactive menu
    await showInteractiveMenu();
    
  } catch (error) {
    spinner.fail('Voice command failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function handleSetup() {
  console.log(chalk.bold.blue('\n🎙️  Claude Agents Voice Setup Wizard\n'));
  
  // Step 1: Check ffmpeg installation
  await checkFFmpegInstallation();
  
  // Step 2: Select voice provider
  const provider = await selectVoiceProvider();
  
  // Step 3: Configure API keys based on provider selection
  await configureProviderKeys(provider);
  
  // Step 4: Provide MCP setup instructions if needed
  if (provider === 'mcp' || provider === 'elevenlabs') {
    await showMCPSetupInstructions();
  }
  
  // Step 5: Save configuration
  await saveSetupConfiguration(provider);
  
  // Step 6: Test voice setup
  await testVoiceSetup();
  
  console.log(chalk.green.bold('\n🎉 Voice setup completed successfully!'));
  console.log(chalk.gray('You can now use voice features with claude-agents.'));
}

async function handleStatus() {
  console.log(chalk.bold.blue('\n🔊 Voice System Status\n'));
  
  // Check ffmpeg
  const ffmpegStatus = await checkFFmpegAvailable();
  console.log(chalk.bold('System Dependencies:'));
  console.log(chalk.gray('├─'), 'FFmpeg:', ffmpegStatus ? chalk.green('Installed') : chalk.red('Not installed'));
  
  // Check configuration
  const config = getVoiceConfig();
  const env = loadEnv();
  
  console.log(chalk.bold('\nConfiguration:'));
  console.log(chalk.gray('├─'), 'Status:', config.enabled ? chalk.green('Enabled') : chalk.red('Disabled'));
  console.log(chalk.gray('├─'), 'Provider:', chalk.cyan(config.provider));
  
  // Check API keys
  console.log(chalk.bold('\nAPI Keys:'));
  console.log(chalk.gray('├─'), 'OpenAI:', hasApiKey('OPENAI_API_KEY') ? chalk.green('Configured') : chalk.gray('Not set'));
  console.log(chalk.gray('├─'), 'ElevenLabs:', hasApiKey('ELEVENLABS_API_KEY') ? chalk.green('Configured') : chalk.gray('Not set'));
  console.log(chalk.gray('└─'), 'Anthropic:', hasApiKey('ANTHROPIC_API_KEY') ? chalk.green('Configured') : chalk.gray('Not set'));
  
  // Check MCP setup for ElevenLabs
  if (config.provider === 'mcp') {
    console.log(chalk.bold('\nMCP Integration:'));
    console.log(chalk.gray('└─'), 'ElevenLabs MCP:', chalk.yellow('Check Claude Code MCP tools'));
  }
  
  // Show recommendations
  const recommendations = getSetupRecommendations();
  if (recommendations.length > 0) {
    console.log(chalk.bold('\nRecommendations:'));
    recommendations.forEach((rec, index) => {
      const isLast = index === recommendations.length - 1;
      console.log(chalk.gray(isLast ? '└─' : '├─'), chalk.yellow(rec));
    });
  }
}

async function checkFFmpegInstallation() {
  const spinner = ora('Checking FFmpeg installation...').start();
  
  const isInstalled = await checkFFmpegAvailable();
  
  if (isInstalled) {
    spinner.succeed('FFmpeg is already installed');
  } else {
    spinner.warn('FFmpeg is not installed');
    
    console.log(chalk.yellow('\n⚠️  FFmpeg is required for voice functionality'));
    console.log(chalk.bold('\nInstallation Instructions:'));
    
    const platform = process.platform;
    switch (platform) {
      case 'darwin':
        console.log(chalk.white('  macOS:'), chalk.cyan('brew install ffmpeg'));
        break;
      case 'win32':
        console.log(chalk.white('  Windows:'), chalk.cyan('choco install ffmpeg'));
        console.log(chalk.gray('    or download from: https://ffmpeg.org/download.html'));
        break;
      case 'linux':
        console.log(chalk.white('  Ubuntu/Debian:'), chalk.cyan('sudo apt-get install ffmpeg'));
        console.log(chalk.white('  CentOS/RHEL:'), chalk.cyan('sudo yum install ffmpeg'));
        console.log(chalk.white('  Arch:'), chalk.cyan('sudo pacman -S ffmpeg'));
        break;
      default:
        console.log(chalk.white('  Your platform:'), chalk.cyan('Visit https://ffmpeg.org/download.html'));
    }
    
    const proceed = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Continue setup without FFmpeg? (You can install it later)',
      default: true
    });
    
    if (!proceed.continue) {
      console.log(chalk.yellow('Setup cancelled. Install FFmpeg and run setup again.'));
      process.exit(0);
    }
  }
}

async function selectVoiceProvider() {
  const answers = await inquirer.prompt({
    type: 'list',
    name: 'provider',
    message: 'Select your preferred voice provider:',
    choices: [
      {
        name: 'Auto (best available) - Recommended',
        value: 'auto',
        short: 'Auto'
      },
      {
        name: 'ElevenLabs (via Claude Code MCP) - High quality',
        value: 'mcp',
        short: 'ElevenLabs MCP'
      },
      {
        name: 'OpenAI - Good quality, reliable',
        value: 'openai',
        short: 'OpenAI'
      },
      {
        name: 'Local (system TTS) - No API key needed',
        value: 'local',
        short: 'Local'
      }
    ],
    default: 'auto'
  });
  
  return answers.provider;
}

async function configureProviderKeys(provider) {
  const requiredKeys = getRequiredKeysForProvider(provider);
  
  if (requiredKeys.length === 0) {
    console.log(chalk.green('✓ No API keys required for selected provider'));
    return;
  }
  
  console.log(chalk.bold('\n🔑 API Key Configuration'));
  
  const env = loadEnv();
  const updates = {};
  
  for (const keyInfo of requiredKeys) {
    const { key, name, required } = keyInfo;
    const currentValue = env[key] || process.env[key];
    
    if (currentValue && !required) {
      const useExisting = await inquirer.prompt({
        type: 'confirm',
        name: 'use',
        message: `${name} API key is already configured. Keep existing?`,
        default: true
      });
      
      if (useExisting.use) {
        continue;
      }
    }
    
    const answer = await inquirer.prompt({
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${name} API key:`,
      mask: '*',
      validate: input => {
        if (!input.trim()) {
          return required ? 'API key is required for this provider' : true;
        }
        return true;
      }
    });
    
    if (answer.apiKey) {
      updates[key] = answer.apiKey;
    }
  }
  
  if (Object.keys(updates).length > 0) {
    saveEnv(updates);
    console.log(chalk.green('✓ API keys saved to .env file'));
  }
}

async function showMCPSetupInstructions() {
  console.log(chalk.bold('\n📡 ElevenLabs MCP Setup'));
  console.log(chalk.gray('To use ElevenLabs through Claude Code MCP integration:\n'));
  
  const apiKey = getEnvVar('ELEVENLABS_API_KEY');
  const mcpCommand = apiKey 
    ? `claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=${apiKey} -- uvx elevenlabs-mcp`
    : 'claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-api-key -- uvx elevenlabs-mcp';
  
  console.log(chalk.yellow('Run this command in your terminal:'));
  console.log(chalk.white.bold(mcpCommand));
  console.log();
  
  console.log(chalk.gray('This will:'));
  console.log(chalk.gray('• Install the ElevenLabs MCP server'));
  console.log(chalk.gray('• Configure it with your API key'));
  console.log(chalk.gray('• Make it available in Claude Code'));
  console.log();
  
  const runNow = await inquirer.prompt({
    type: 'confirm',
    name: 'run',
    message: 'Would you like me to run this command now?',
    default: false
  });
  
  if (runNow.run) {
    const spinner = ora('Setting up ElevenLabs MCP...').start();
    try {
      await execAsync(mcpCommand);
      spinner.succeed('ElevenLabs MCP setup completed');
    } catch (error) {
      spinner.fail(`MCP setup failed: ${error.message}`);
      console.log(chalk.yellow('You can run the command manually later.'));
    }
  }
}

async function saveSetupConfiguration(provider) {
  const config = {
    enabled: true,
    provider: provider
  };
  
  saveVoiceConfig(config);
  
  // Also save to .env for environment override capability
  const envUpdates = {
    CLAUDE_AGENTS_VOICE_ENABLED: 'true',
    CLAUDE_AGENTS_VOICE_PROVIDER: provider
  };
  
  saveEnv(envUpdates);
  
  console.log(chalk.green('✓ Voice configuration saved'));
}

async function testVoiceSetup() {
  const testVoice = await inquirer.prompt({
    type: 'confirm',
    name: 'test',
    message: 'Test voice setup now?',
    default: true
  });
  
  if (testVoice.test) {
    await handleTest('Voice setup test completed successfully!');
  }
}

async function checkFFmpegAvailable() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

function getRequiredKeysForProvider(provider) {
  const keyMap = {
    auto: [
      { key: 'OPENAI_API_KEY', name: 'OpenAI', required: false },
      { key: 'ELEVENLABS_API_KEY', name: 'ElevenLabs', required: false },
      { key: 'ANTHROPIC_API_KEY', name: 'Anthropic', required: false }
    ],
    mcp: [
      { key: 'ELEVENLABS_API_KEY', name: 'ElevenLabs', required: true }
    ],
    elevenlabs: [
      { key: 'ELEVENLABS_API_KEY', name: 'ElevenLabs', required: true }
    ],
    openai: [
      { key: 'OPENAI_API_KEY', name: 'OpenAI', required: true }
    ],
    local: []
  };
  
  return keyMap[provider] || [];
}

function getSetupRecommendations() {
  const recommendations = [];
  const config = getVoiceConfig();
  
  if (!config.enabled) {
    recommendations.push('Enable voice with: claude-agents voice --enable');
  }
  
  if (config.provider === 'local' && !hasApiKey('OPENAI_API_KEY') && !hasApiKey('ELEVENLABS_API_KEY')) {
    recommendations.push('Consider adding API keys for better voice quality');
  }
  
  if (config.provider === 'mcp' && !hasApiKey('ELEVENLABS_API_KEY')) {
    recommendations.push('ElevenLabs API key needed for MCP integration');
  }
  
  return recommendations;
}

async function handleEnable(enable) {
  const config = getVoiceConfig();
  config.enabled = enable;
  
  saveVoiceConfig({ enabled: enable });
  
  console.log(chalk.green('✓'), `Voice ${enable ? 'enabled' : 'disabled'} successfully`);
  
  if (enable && !hasAPIKeys()) {
    console.log(chalk.yellow('\n⚠️  No API keys configured for voice providers'));
    console.log(chalk.gray('Run "claude-agents voice --setup" for guided configuration'));
  }
}

async function handleProvider(provider) {
  const validProviders = ['auto', 'mcp', 'openai', 'local'];
  
  if (!validProviders.includes(provider)) {
    console.error(chalk.red('✗'), `Invalid provider: ${provider}`);
    console.log(chalk.gray('Valid providers:', validProviders.join(', ')));
    return;
  }
  
  saveVoiceConfig({ provider });
  console.log(chalk.green('✓'), `Voice provider set to: ${provider}`);
  
  if (provider === 'mcp') {
    console.log(chalk.cyan('\n📌 To use ElevenLabs MCP:'));
    console.log(chalk.yellow('\nRun this command:'));
    console.log(chalk.white.bold('claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-api-key -- uvx elevenlabs-mcp'));
    console.log();
    console.log(chalk.gray('This will:'));
    console.log(chalk.gray('• Install the ElevenLabs MCP server'));
    console.log(chalk.gray('• Configure it with your API key'));
    console.log(chalk.gray('• Make it available in Claude Code'));
    console.log();
    console.log(chalk.gray('After setup, the mcp__ElevenLabs__text_to_speech tool will be available'));
  }
}

async function handleTest(text) {
  const spinner = ora('Testing voice...').start();
  const tts = getTTS();
  
  try {
    const result = await tts.speak(text || 'Claude agents voice test successful!', { force: true });
    
    if (result.success) {
      spinner.succeed(`Voice test successful using ${result.provider || 'default'} provider`);
    } else {
      spinner.fail(`Voice test failed: ${result.reason}`);
    }
  } catch (error) {
    spinner.fail(`Voice test error: ${error.message}`);
  }
}

async function handleAPIKey(provider) {
  if (provider === true) {
    // Interactive API key setup
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select provider to configure:',
        choices: [
          { name: 'OpenAI', value: 'openai' }
        ]
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter API key:',
        mask: '*',
        validate: input => input.trim() ? true : 'API key cannot be empty'
      }
    ]);
    
    saveAPIKey(answers.provider, answers.apiKey);
    console.log(chalk.green('✓'), `${answers.provider} API key saved successfully`);
  } else {
    // Direct provider specified
    console.log(chalk.yellow('Please use interactive mode: claude-agents voice --api-key'));
  }
}

async function showInteractiveMenu() {
  const config = getVoiceConfig();
  const apiKeys = getAPIKeys();
  
  console.log(chalk.bold.blue('\n🔊 Voice Configuration\n'));
  
  console.log(chalk.bold('Current Settings:'));
  console.log(chalk.gray('├─'), 'Status:', config.enabled ? chalk.green('Enabled') : chalk.red('Disabled'));
  console.log(chalk.gray('├─'), 'Provider:', chalk.cyan(config.provider));
  console.log(chalk.gray('├─'), 'OpenAI API:', hasApiKey('OPENAI_API_KEY') ? chalk.green('Configured') : chalk.gray('Not set'));
  console.log(chalk.gray('├─'), 'Anthropic API:', hasApiKey('ANTHROPIC_API_KEY') ? chalk.green('Configured') : chalk.gray('Not set'));
  console.log(chalk.gray('├─'), 'ElevenLabs API:', hasApiKey('ELEVENLABS_API_KEY') ? chalk.green('Configured') : chalk.gray('Not set'));
  console.log(chalk.gray('└─'), 'Engineer Name:', getEnvVar('ENGINEER_NAME') || chalk.gray('Not set'));
  
  const choices = [
    { name: config.enabled ? 'Disable voice' : 'Enable voice', value: 'toggle' },
    { name: 'Run setup wizard', value: 'setup' },
    { name: 'Show system status', value: 'status' },
    { name: 'Change provider', value: 'provider' },
    { name: 'Configure API keys', value: 'apikeys' },
    { name: 'Test voice', value: 'test' },
    { name: 'View announcements settings', value: 'announcements' },
    new inquirer.Separator(),
    { name: 'Exit', value: 'exit' }
  ];
  
  const answer = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices
  });
  
  switch (answer.action) {
    case 'toggle':
      await handleEnable(!config.enabled);
      break;
      
    case 'setup':
      await handleSetup();
      break;
      
    case 'status':
      await handleStatus();
      break;
      
    case 'provider':
      const providerAnswer = await inquirer.prompt({
        type: 'list',
        name: 'provider',
        message: 'Select voice provider:',
        choices: [
          { name: 'Auto (best available)', value: 'auto' },
          { name: 'ElevenLabs (via Claude Code MCP)', value: 'mcp' },
          { name: 'OpenAI', value: 'openai' },
          { name: 'Local (system TTS)', value: 'local' }
        ],
        default: config.provider
      });
      await handleProvider(providerAnswer.provider);
      break;
      
    case 'apikeys':
      await handleAPIKey(true);
      break;
      
    case 'test':
      await handleTest();
      break;
      
    case 'announcements':
      await configureAnnouncements();
      break;
  }
}

async function configureAnnouncements() {
  const config = getVoiceConfig();
  
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'announcements',
      message: 'Select which events should trigger voice announcements:',
      choices: [
        { name: 'Agent start', value: 'agentStart', checked: config.announcements.agentStart },
        { name: 'Agent complete', value: 'agentComplete', checked: config.announcements.agentComplete },
        { name: 'Errors', value: 'errors', checked: config.announcements.errors },
        { name: 'Progress updates', value: 'progress', checked: config.announcements.progress }
      ]
    }
  ]);
  
  const announcements = {
    agentStart: answers.announcements.includes('agentStart'),
    agentComplete: answers.announcements.includes('agentComplete'),
    errors: answers.announcements.includes('errors'),
    progress: answers.announcements.includes('progress')
  };
  
  saveVoiceConfig({ announcements });
  console.log(chalk.green('✓'), 'Announcement settings updated');
}

function hasAPIKeys() {
  return hasApiKey('OPENAI_API_KEY') || hasApiKey('ELEVENLABS_API_KEY') || hasApiKey('ANTHROPIC_API_KEY');
}