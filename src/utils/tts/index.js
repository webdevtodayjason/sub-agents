import MCPProvider from './providers/mcp.js';
import OpenAIProvider from './providers/openai.js';
import LocalProvider from './providers/local.js';
import { getVoiceConfig } from '../config.js';

class TTSManager {
  constructor() {
    this.providers = {
      mcp: new MCPProvider(), // Uses ElevenLabs MCP server
      openai: new OpenAIProvider(),
      local: new LocalProvider()
    };
  }

  async speak(text, options = {}) {
    const config = getVoiceConfig();
    
    if (!config.enabled && !options.force) {
      return { success: false, reason: 'Voice disabled' };
    }

    const provider = this.selectProvider(config, options);
    
    if (!provider) {
      return { success: false, reason: 'No available TTS provider' };
    }

    try {
      return await provider.speak(text, options);
    } catch (error) {
      // Try fallback providers
      const fallbacks = this.getFallbackProviders(provider.name);
      
      for (const fallback of fallbacks) {
        try {
          return await fallback.speak(text, options);
        } catch (fallbackError) {
          continue;
        }
      }
      
      return { success: false, reason: error.message };
    }
  }

  selectProvider(config, options) {
    // Check if specific provider requested
    if (options.provider) {
      const provider = this.providers[options.provider];
      if (provider && provider.isAvailable()) {
        return provider;
      }
    }

    // Use configured provider preference
    if (config.provider && config.provider !== 'auto') {
      const provider = this.providers[config.provider];
      if (provider && provider.isAvailable()) {
        return provider;
      }
    }

    // Auto-select based on priority
    const priority = ['mcp', 'openai', 'local'];
    
    for (const name of priority) {
      const provider = this.providers[name];
      if (provider && provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }

  getFallbackProviders(excludeName) {
    const priority = ['mcp', 'openai', 'local'];
    return priority
      .filter(name => name !== excludeName)
      .map(name => this.providers[name])
      .filter(provider => provider && provider.isAvailable());
  }

  async testVoice(text = 'Claude agents voice test successful!') {
    const config = getVoiceConfig();
    const results = {};

    for (const [name, provider] of Object.entries(this.providers)) {
      if (provider.isAvailable()) {
        try {
          const result = await provider.speak(text, { test: true });
          results[name] = { available: true, success: result.success };
        } catch (error) {
          results[name] = { available: true, success: false, error: error.message };
        }
      } else {
        results[name] = { available: false };
      }
    }

    return results;
  }
}

// Singleton instance
let ttsManager;

function getTTS() {
  if (!ttsManager) {
    ttsManager = new TTSManager();
  }
  return ttsManager;
}

// Convenience functions
async function speak(text, options = {}) {
  return getTTS().speak(text, options);
}

async function announceAgentComplete(agentName, taskDescription) {
  const messages = [
    `${agentName} agent has completed its task`,
    `${agentName} finished: ${taskDescription}`,
    `Task complete by ${agentName}`,
    `${agentName} agent done`
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  return speak(message);
}

async function announceError(error, context) {
  const message = context 
    ? `Error in ${context}: ${error}`
    : `Error encountered: ${error}`;
  
  return speak(message, { priority: 'high' });
}

export {
  getTTS,
  speak,
  announceAgentComplete,
  announceError,
  TTSManager
};