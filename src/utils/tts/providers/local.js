import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
const execAsync = promisify(exec);

class LocalProvider {
  constructor() {
    this.name = 'local';
    this.platform = os.platform();
  }

  isAvailable() {
    // Always available as fallback
    return true;
  }

  async speak(text, options = {}) {
    try {
      const command = await this.getCommand(text);
      
      if (!command) {
        throw new Error('No local TTS command available for this platform');
      }

      await execAsync(command);

      return {
        success: true,
        provider: 'local',
        method: this.getMethod()
      };
    } catch (error) {
      throw new Error(`Local TTS failed: ${error.message}`);
    }
  }

  async getCommand(text) {
    // Escape quotes and special characters for shell
    const escapedText = text.replace(/'/g, "'\"'\"'").replace(/\$/g, '\\$');

    if (this.platform === 'darwin') {
      // macOS - use 'say' command
      const voice = await this.getMacVoice();
      return `say -v "${voice}" '${escapedText}'`;
    } else if (this.platform === 'linux') {
      // Linux - try espeak-ng, then espeak, then festival
      const commands = [
        `espeak-ng '${escapedText}'`,
        `espeak '${escapedText}'`,
        `echo '${escapedText}' | festival --tts`
      ];

      for (const cmd of commands) {
        try {
          const binary = cmd.split(' ')[0];
          await execAsync(`which ${binary}`);
          return cmd;
        } catch (e) {
          continue;
        }
      }
      
      throw new Error('No TTS tool found. Install espeak-ng or espeak.');
    } else if (this.platform === 'win32') {
      // Windows - use PowerShell's speech synthesis
      const psCommand = `Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak('${escapedText}')`;
      return `powershell -Command "${psCommand}"`;
    }

    return null;
  }

  async getMacVoice() {
    try {
      // Get list of available voices
      const { stdout } = await execAsync('say -v ?');
      const voices = stdout.split('\n')
        .filter(line => line.includes('en_'))
        .map(line => line.split(/\s+/)[0]);

      // Prefer these voices in order
      const preferred = ['Samantha', 'Alex', 'Victoria', 'Fred'];
      
      for (const voice of preferred) {
        if (voices.includes(voice)) {
          return voice;
        }
      }

      // Default to first English voice or system default
      return voices[0] || 'Alex';
    } catch (error) {
      return 'Alex'; // Default macOS voice
    }
  }

  getMethod() {
    if (this.platform === 'darwin') return 'say';
    if (this.platform === 'linux') return 'espeak/festival';
    if (this.platform === 'win32') return 'powershell';
    return 'unknown';
  }
}

export default LocalProvider;