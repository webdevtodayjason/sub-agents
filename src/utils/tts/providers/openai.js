import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

class OpenAIProvider {
  constructor() {
    this.name = 'openai';
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1/audio/speech';
    this.defaultVoice = 'nova'; // alloy, echo, fable, onyx, nova, shimmer
    this.defaultModel = 'tts-1'; // tts-1 or tts-1-hd
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async speak(text, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const voice = options.voice || this.defaultVoice;
    const model = options.model || this.defaultModel;
    
    try {
      // Create temp file for audio
      const tempFile = path.join(os.tmpdir(), `claude-agents-tts-${Date.now()}.mp3`);
      
      // Make API request using fetch (Node 18+) or fall back to curl
      const response = await this.fetchAudio(text, voice, model);
      
      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status}`);
      }

      // Save audio to temp file
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(tempFile, Buffer.from(buffer));

      // Play the audio file
      await this.playAudio(tempFile);

      // Clean up
      fs.unlinkSync(tempFile);

      return {
        success: true,
        provider: 'openai',
        voice,
        model
      };
    } catch (error) {
      throw new Error(`OpenAI TTS failed: ${error.message}`);
    }
  }

  async fetchAudio(text, voice, model) {
    // Try native fetch first (Node 18+)
    if (global.fetch) {
      return fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format: 'mp3'
        })
      });
    }

    // Fall back to curl for older Node versions
    const curlCommand = `curl -s -X POST ${this.baseUrl} \
      -H "Authorization: Bearer ${this.apiKey}" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify({ model, input: text, voice })}' \
      --output -`;

    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stderr) {
      throw new Error(stderr);
    }

    // Mock response object for compatibility
    return {
      ok: true,
      arrayBuffer: async () => Buffer.from(stdout, 'binary')
    };
  }

  async playAudio(filePath) {
    const platform = os.platform();
    let command;

    if (platform === 'darwin') {
      command = `afplay "${filePath}"`;
    } else if (platform === 'linux') {
      // Try multiple players in order of preference
      const players = ['mpg123', 'play', 'aplay', 'ffplay'];
      for (const player of players) {
        try {
          await execAsync(`which ${player}`);
          command = `${player} "${filePath}"`;
          break;
        } catch (e) {
          continue;
        }
      }
      if (!command) {
        throw new Error('No audio player found. Install mpg123 or sox.');
      }
    } else if (platform === 'win32') {
      command = `powershell -c "(New-Object Media.SoundPlayer '${filePath}').PlaySync()"`;
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    await execAsync(command);
  }
}

export default OpenAIProvider;