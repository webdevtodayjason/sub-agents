import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env');
const ENV_BACKUP_PATH = join(process.cwd(), '.env.backup');

/**
 * Load environment variables from .env file
 * @returns {Object} Parsed environment variables
 */
export function loadEnv() {
  const env = {};
  
  if (!existsSync(ENV_PATH)) {
    return env;
  }
  
  try {
    const content = readFileSync(ENV_PATH, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Parse key=value
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim();
        
        // Remove quotes if present
        env[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  } catch (error) {
    console.error('Error reading .env file:', error.message);
  }
  
  return env;
}

/**
 * Save environment variables to .env file
 * @param {Object} updates - Key-value pairs to update/add
 * @param {boolean} merge - Whether to merge with existing values (default: true)
 */
export function saveEnv(updates, merge = true) {
  let env = {};
  let existingLines = [];
  let hasExistingContent = false;
  
  // Read existing file if merging
  if (merge && existsSync(ENV_PATH)) {
    hasExistingContent = true;
    const content = readFileSync(ENV_PATH, 'utf-8');
    existingLines = content.split('\n');
    env = loadEnv();
  }
  
  // Apply updates
  env = { ...env, ...updates };
  
  // Build new content preserving comments and structure
  const newLines = [];
  const processedKeys = new Set();
  
  if (hasExistingContent) {
    // Process existing lines, updating values where needed
    for (const line of existingLines) {
      const trimmed = line.trim();
      
      // Preserve empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        newLines.push(line);
        continue;
      }
      
      // Check if this is a key=value line
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        
        if (key in updates) {
          // Update existing key
          newLines.push(`${key}=${updates[key]}`);
          processedKeys.add(key);
        } else {
          // Preserve existing line
          newLines.push(line);
        }
      } else {
        // Preserve non-key-value lines
        newLines.push(line);
      }
    }
  }
  
  // Add new keys that weren't in the original file
  const newKeys = Object.keys(updates).filter(key => !processedKeys.has(key));
  
  if (newKeys.length > 0) {
    // Add section separator if file has content
    if (newLines.length > 0 && !newLines[newLines.length - 1].trim().startsWith('#')) {
      newLines.push('');
      newLines.push('# Added by claude-agents setup');
    }
    
    for (const key of newKeys) {
      if (updates[key] !== undefined && updates[key] !== null) {
        newLines.push(`${key}=${updates[key]}`);
      }
    }
  }
  
  // Ensure file ends with newline
  if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
    newLines.push('');
  }
  
  // Write the file
  writeFileSync(ENV_PATH, newLines.join('\n'));
}

/**
 * Create a backup of the current .env file
 * @returns {boolean} True if backup was created
 */
export function backupEnv() {
  if (!existsSync(ENV_PATH)) {
    return false;
  }
  
  try {
    // Create timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(process.cwd(), `.env.backup-${timestamp}`);
    copyFileSync(ENV_PATH, backupPath);
    
    // Also create/update the simple backup
    copyFileSync(ENV_PATH, ENV_BACKUP_PATH);
    
    // Clean old backups (keep last 5)
    cleanOldBackups();
    
    return true;
  } catch (error) {
    console.error('Error creating backup:', error.message);
    return false;
  }
}

/**
 * Restore .env from backup
 * @returns {boolean} True if restore was successful
 */
export function restoreEnv() {
  if (!existsSync(ENV_BACKUP_PATH)) {
    return false;
  }
  
  try {
    copyFileSync(ENV_BACKUP_PATH, ENV_PATH);
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error.message);
    return false;
  }
}

/**
 * Clean old backup files, keeping only the most recent ones
 * @param {number} keepCount - Number of backups to keep (default: 5)
 */
function cleanOldBackups(keepCount = 5) {
  try {
    const files = readdirSync(process.cwd());
    const backupFiles = files
      .filter(f => f.startsWith('.env.backup-') && f.includes('T'))
      .sort()
      .reverse();
    
    // Remove old backups
    for (let i = keepCount; i < backupFiles.length; i++) {
      try {
        unlinkSync(join(process.cwd(), backupFiles[i]));
      } catch (error) {
        // Ignore errors for individual file deletions
      }
    }
  } catch (error) {
    // Ignore errors in cleanup
  }
}

/**
 * Get a specific environment variable value
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The environment variable value
 */
export function getEnvVar(key, defaultValue = '') {
  const env = loadEnv();
  return env[key] || process.env[key] || defaultValue;
}

/**
 * Check if an API key is configured
 * @param {string} key - Environment variable key
 * @returns {boolean} True if the key exists and has a value
 */
export function hasApiKey(key) {
  const value = getEnvVar(key);
  return value && value.trim() !== '';
}

/**
 * Get all configured API keys
 * @returns {Object} Object with API key status
 */
export function getApiKeyStatus() {
  return {
    openai: hasApiKey('OPENAI_API_KEY'),
    anthropic: hasApiKey('ANTHROPIC_API_KEY'),
    elevenlabs: hasApiKey('ELEVENLABS_API_KEY'),
    engineerName: getEnvVar('ENGINEER_NAME', '')
  };
}