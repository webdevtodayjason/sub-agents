import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getConfigPath } from './paths.js';

export const DEFAULT_CONFIG = {
  version: '1.0.0',
  installedAgents: {},
  enabledAgents: [],
  disabledAgents: [],
  settings: {
    autoEnableOnInstall: true,
    preferProjectScope: false,
    autoUpdateCheck: true
  },
  voice: {
    enabled: false,
    provider: 'auto', // auto, mcp, openai, local
    announcements: {
      agentStart: false,
      agentComplete: true,
      errors: true,
      progress: false
    },
    autoCleanup: true,    // Auto-delete audio files after playback
    cleanupDelay: 15000   // Wait 15 seconds before cleanup
  },
  api_keys: {}
};

export function loadConfig(isProject = false) {
  const configPath = getConfigPath(isProject);
  
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config, isProject = false) {
  const configPath = getConfigPath(isProject);
  
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

export function addInstalledAgent(agentName, metadata, isProject = false) {
  const config = loadConfig(isProject);
  
  config.installedAgents[agentName] = {
    version: metadata.version,
    installedAt: new Date().toISOString(),
    scope: isProject ? 'project' : 'user',
    ...metadata
  };
  
  // Auto-enable if setting is true
  if (config.settings.autoEnableOnInstall && !config.disabledAgents.includes(agentName)) {
    if (!config.enabledAgents.includes(agentName)) {
      config.enabledAgents.push(agentName);
    }
  }
  
  return saveConfig(config, isProject);
}

export function removeInstalledAgent(agentName, isProject = false) {
  const config = loadConfig(isProject);
  
  delete config.installedAgents[agentName];
  config.enabledAgents = config.enabledAgents.filter(name => name !== agentName);
  config.disabledAgents = config.disabledAgents.filter(name => name !== agentName);
  
  return saveConfig(config, isProject);
}

export function enableAgent(agentName, isProject = false) {
  const config = loadConfig(isProject);
  
  // Remove from disabled list
  config.disabledAgents = config.disabledAgents.filter(name => name !== agentName);
  
  // Add to enabled list if not already there
  if (!config.enabledAgents.includes(agentName)) {
    config.enabledAgents.push(agentName);
  }
  
  return saveConfig(config, isProject);
}

export function disableAgent(agentName, isProject = false) {
  const config = loadConfig(isProject);
  
  // Remove from enabled list
  config.enabledAgents = config.enabledAgents.filter(name => name !== agentName);
  
  // Add to disabled list if not already there
  if (!config.disabledAgents.includes(agentName)) {
    config.disabledAgents.push(agentName);
  }
  
  return saveConfig(config, isProject);
}

export function isAgentEnabled(agentName, checkBothScopes = true) {
  const userConfig = loadConfig(false);
  const projectConfig = checkBothScopes ? loadConfig(true) : null;
  
  // Check if explicitly disabled
  if (userConfig.disabledAgents.includes(agentName)) return false;
  if (projectConfig && projectConfig.disabledAgents.includes(agentName)) return false;
  
  // Check if enabled
  const enabledInUser = userConfig.enabledAgents.includes(agentName);
  const enabledInProject = projectConfig && projectConfig.enabledAgents.includes(agentName);
  
  return enabledInUser || enabledInProject;
}

export function getInstalledAgents(checkBothScopes = true) {
  const userConfig = loadConfig(false);
  const projectConfig = checkBothScopes ? loadConfig(true) : null;
  
  const agents = { ...userConfig.installedAgents };
  
  if (projectConfig) {
    Object.assign(agents, projectConfig.installedAgents);
  }
  
  return agents;
}

// Voice configuration functions
export function getVoiceConfig(isProject = false, projectPath = process.cwd()) {
  const config = loadConfig(isProject);
  const envVars = loadEnvFile(projectPath);
  
  // Merge with environment variable overrides
  const voiceConfig = { ...config.voice };
  
  // Check process.env first, then .env file, then config
  const voiceEnabled = process.env.CLAUDE_AGENTS_VOICE_ENABLED || 
                      envVars.CLAUDE_AGENTS_VOICE_ENABLED;
  if (voiceEnabled !== undefined) {
    voiceConfig.enabled = voiceEnabled === 'true';
  }
  
  const voiceProvider = process.env.CLAUDE_AGENTS_VOICE_PROVIDER || 
                       envVars.CLAUDE_AGENTS_VOICE_PROVIDER;
  if (voiceProvider) {
    voiceConfig.provider = voiceProvider;
  }
  
  return voiceConfig;
}

export function saveVoiceConfig(voiceUpdates, isProject = false) {
  const config = loadConfig(isProject);
  
  config.voice = {
    ...config.voice,
    ...voiceUpdates
  };
  
  return saveConfig(config, isProject);
}

/**
 * Load environment variables from .env file if present
 */
function loadEnvFile(projectPath = process.cwd()) {
  const envPath = join(projectPath, '.env');
  
  if (!existsSync(envPath)) {
    return {};
  }
  
  try {
    const content = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.warn('Warning: Failed to load .env file:', error.message);
    return {};
  }
}

export function getAPIKeys(projectPath = process.cwd()) {
  const userConfig = loadConfig(false);
  const envVars = loadEnvFile(projectPath);
  
  return {
    anthropic: process.env.ANTHROPIC_API_KEY || envVars.ANTHROPIC_API_KEY || userConfig.api_keys?.anthropic,
    elevenlabs: process.env.ELEVENLABS_API_KEY || envVars.ELEVENLABS_API_KEY || userConfig.api_keys?.elevenlabs,
    openai: process.env.OPENAI_API_KEY || envVars.OPENAI_API_KEY || userConfig.api_keys?.openai,
    deepseek: process.env.DEEPSEEK_API_KEY || envVars.DEEPSEEK_API_KEY || userConfig.api_keys?.deepseek,
    gemini: process.env.GEMINI_API_KEY || envVars.GEMINI_API_KEY || userConfig.api_keys?.gemini,
    groq: process.env.GROQ_API_KEY || envVars.GROQ_API_KEY || userConfig.api_keys?.groq,
    firecrawl: process.env.FIRECRAWL_API_KEY || envVars.FIRECRAWL_API_KEY || userConfig.api_keys?.firecrawl
  };
}

export function saveAPIKey(provider, apiKey) {
  const config = loadConfig(false);
  
  if (!config.api_keys) {
    config.api_keys = {};
  }
  
  if (apiKey) {
    config.api_keys[provider] = apiKey;
  } else {
    delete config.api_keys[provider];
  }
  
  return saveConfig(config, false);
}