/**
 * Voice file cleanup utilities
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { getVoiceConfig } from '../config.js';

/**
 * Clean up voice files after playback
 * @param {string} filePath - Path to the audio file
 * @param {Object} options - Cleanup options
 */
export async function cleanupVoiceFile(filePath, options = {}) {
  const config = getVoiceConfig();
  
  // Check if cleanup is enabled
  const shouldCleanup = options.cleanup !== undefined ? options.cleanup : config.autoCleanup;
  
  if (!shouldCleanup) {
    return { cleaned: false, reason: 'Cleanup disabled' };
  }
  
  // Add delay if specified (to ensure playback completes)
  if (options.delay) {
    await new Promise(resolve => setTimeout(resolve, options.delay));
  }
  
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
      return { cleaned: true, file: filePath };
    } else {
      return { cleaned: false, reason: 'File not found' };
    }
  } catch (error) {
    return { cleaned: false, reason: error.message };
  }
}

/**
 * Clean up old TTS files in a directory
 * @param {string} directory - Directory to clean
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 */
export async function cleanupOldVoiceFiles(directory, maxAge = 3600000) {
  const { readdir, stat } = await import('fs/promises');
  
  try {
    const files = await readdir(directory);
    const now = Date.now();
    const cleaned = [];
    
    for (const file of files) {
      // Only clean TTS files (tts_*.mp3)
      if (!file.startsWith('tts_') || !file.endsWith('.mp3')) {
        continue;
      }
      
      const filePath = join(directory, file);
      const stats = await stat(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        await unlink(filePath);
        cleaned.push(file);
      }
    }
    
    return { cleaned: cleaned.length, files: cleaned };
  } catch (error) {
    return { cleaned: 0, error: error.message };
  }
}

/**
 * Schedule periodic cleanup of old voice files
 * @param {string} directory - Directory to monitor
 * @param {Object} options - Cleanup options
 */
export function scheduleVoiceCleanup(directory, options = {}) {
  const interval = options.interval || 3600000; // Default: 1 hour
  const maxAge = options.maxAge || 3600000; // Default: 1 hour
  
  const cleanup = async () => {
    const result = await cleanupOldVoiceFiles(directory, maxAge);
    if (result.cleaned > 0) {
      console.log(`Cleaned ${result.cleaned} old voice files`);
    }
  };
  
  // Initial cleanup
  cleanup();
  
  // Schedule periodic cleanup
  return setInterval(cleanup, interval);
}

/**
 * Get cleanup settings for voice files
 */
export function getCleanupSettings() {
  const config = getVoiceConfig();
  
  return {
    autoCleanup: config.autoCleanup !== false, // Default: true
    cleanupDelay: config.cleanupDelay || 5000, // Default: 5 seconds
    maxAge: config.maxAge || 3600000, // Default: 1 hour
    cleanupInterval: config.cleanupInterval || 3600000 // Default: 1 hour
  };
}