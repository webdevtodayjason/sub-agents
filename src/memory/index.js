import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple memory store with JSON persistence
 * Provides shared memory for agent coordination
 */
class SimpleMemoryStore {
  constructor(optionsOrPath = {}) {
    // Support passing a file path directly for testing
    if (typeof optionsOrPath === 'string') {
      this.memoryFile = optionsOrPath;
      this.memoryDir = dirname(optionsOrPath);
    } else {
      this.memoryDir = optionsOrPath.memoryDir || join(process.cwd(), '.swarm');
      this.memoryFile = join(this.memoryDir, 'memory.json');
    }
    this.store = new Map();
    this.ttlTimers = new Map();
    
    // Ensure directory exists
    if (!existsSync(this.memoryDir)) {
      mkdirSync(this.memoryDir, { recursive: true });
    }
    
    // Load existing memory
    this.load();
    
    // Auto-save every 30 seconds (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      this.autoSaveInterval = setInterval(() => this.save(), 30000);
    }
  }
  
  /**
   * Set a value in memory with optional TTL
   * @param {string} key - Namespaced key (e.g., "agent:planner:tasks")
   * @param {any} value - Value to store
   * @param {number|null} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = null) {
    // Clear existing TTL timer if present
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }
    
    // Store the value with metadata
    this.store.set(key, {
      value,
      created: Date.now(),
      expires: ttl ? Date.now() + ttl : null,
      accessed: Date.now(),
      accessCount: 1
    });
    
    // Set TTL timer if needed
    if (ttl) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.ttlTimers.set(key, timer);
    }
    
    // Save to disk
    this.save();
    
    return value;
  }
  
  /**
   * Get a value from memory
   * @param {string} key - Key to retrieve
   * @returns {any|null} - Stored value or null if not found/expired
   */
  get(key) {
    const item = this.store.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (item.expires && Date.now() > item.expires) {
      this.delete(key);
      return null;
    }
    
    // Update access metadata
    item.accessed = Date.now();
    item.accessCount++;
    
    return item.value;
  }
  
  /**
   * Delete a key from memory
   * @param {string} key - Key to delete
   */
  delete(key) {
    // Clear TTL timer if present
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }
    
    const result = this.store.delete(key);
    if (result) {
      this.save();
    }
    return result;
  }
  
  /**
   * Check if a key exists
   * @param {string} key - Key to check
   * @returns {boolean}
   */
  has(key) {
    const item = this.store.get(key);
    if (!item) return false;
    
    // Check if expired
    if (item.expires && Date.now() > item.expires) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get all keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., "agent:planner:*")
   * @returns {string[]} - Matching keys
   */
  keys(pattern = '*') {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const validKeys = [];
    
    for (const [key, item] of this.store.entries()) {
      // Skip expired items
      if (item.expires && Date.now() > item.expires) {
        this.delete(key);
        continue;
      }
      
      if (regex.test(key)) {
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }
  
  /**
   * Get all values matching a pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {object} - Object with matching keys and values
   */
  getByPattern(pattern) {
    const keys = this.keys(pattern);
    const result = {};
    
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Clear all values matching a pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {number} - Number of entries cleared
   */
  clearPattern(pattern) {
    const keys = this.keys(pattern);
    let cleared = 0;
    
    for (const key of keys) {
      this.delete(key);
      cleared++;
    }
    
    return cleared;
  }
  
  /**
   * Clear all memory
   */
  clear() {
    // Clear all TTL timers
    for (const timer of this.ttlTimers.values()) {
      clearTimeout(timer);
    }
    this.ttlTimers.clear();
    
    this.store.clear();
    this.save();
  }
  
  /**
   * Get memory statistics
   * @returns {object} - Memory stats
   */
  stats() {
    let totalSize = 0;
    let expiredCount = 0;
    let keysWithTTL = 0;
    let keysWithoutTTL = 0;
    const namespaces = new Set();
    
    for (const [key, item] of this.store.entries()) {
      if (item.expires && Date.now() > item.expires) {
        expiredCount++;
        continue;
      }
      
      if (item.expires) {
        keysWithTTL++;
      } else {
        keysWithoutTTL++;
      }
      
      totalSize += JSON.stringify(item).length;
      const namespace = key.split(':')[0];
      if (namespace) namespaces.add(namespace);
    }
    
    return {
      totalKeys: this.store.size,
      totalEntries: this.store.size,
      expiredEntries: expiredCount,
      activeEntries: this.store.size - expiredCount,
      keysWithTTL,
      keysWithoutTTL,
      totalSize,
      namespaces: Array.from(namespaces),
      memoryFile: this.memoryFile
    };
  }
  
  /**
   * Clean up expired entries
   */
  cleanup() {
    let cleaned = 0;
    
    for (const [key, item] of this.store.entries()) {
      if (item.expires && Date.now() > item.expires) {
        this.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.save();
    }
    
    return cleaned;
  }
  
  /**
   * Save memory to disk
   */
  save() {
    try {
      // Ensure directory exists before saving
      if (!existsSync(this.memoryDir)) {
        mkdirSync(this.memoryDir, { recursive: true });
      }
      
      const data = {
        version: '1.0.0',
        saved: new Date().toISOString(),
        entries: Object.fromEntries(this.store)
      };
      
      writeFileSync(this.memoryFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }
  
  /**
   * Save memory to disk synchronously (alias for save)
   */
  saveSync() {
    this.save();
  }
  
  /**
   * Load memory from disk
   */
  load() {
    try {
      if (!existsSync(this.memoryFile)) {
        return;
      }
      
      const data = JSON.parse(readFileSync(this.memoryFile, 'utf-8'));
      
      // Restore entries
      for (const [key, item] of Object.entries(data.entries || {})) {
        // Skip expired entries
        if (item.expires && Date.now() > item.expires) {
          continue;
        }
        
        this.store.set(key, item);
        
        // Restore TTL timer if needed
        if (item.expires) {
          const remaining = item.expires - Date.now();
          if (remaining > 0) {
            const timer = setTimeout(() => {
              this.delete(key);
            }, remaining);
            this.ttlTimers.set(key, timer);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
    }
  }
  
  /**
   * Destroy the memory store
   */
  destroy() {
    // Clear auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // Clear all TTL timers
    for (const timer of this.ttlTimers.values()) {
      clearTimeout(timer);
    }
    
    this.ttlTimers.clear();
    this.store.clear();
  }
}

// Export singleton instance
let memoryStore = null;

export function getMemoryStore(options) {
  if (!memoryStore) {
    memoryStore = new SimpleMemoryStore(options);
  }
  return memoryStore;
}

export default SimpleMemoryStore;