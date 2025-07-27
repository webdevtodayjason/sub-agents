#!/usr/bin/env node
process.env.NODE_ENV = 'test';

import SimpleMemoryStore from '../src/memory/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test utilities
const testDir = path.join(__dirname, '.test-swarm');
const testMemoryPath = path.join(testDir, 'memory.json');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Setup
fs.ensureDirSync(testDir);
if (fs.existsSync(testMemoryPath)) {
  fs.unlinkSync(testMemoryPath);
}

// Tests
console.log('\n🧪 Testing SimpleMemoryStore...\n');

const memory = new SimpleMemoryStore(testMemoryPath);

test('should create memory store', () => {
  assert(memory instanceof SimpleMemoryStore);
});

test('should set and get values', () => {
  memory.set('test:key', { value: 'test data' });
  const result = memory.get('test:key');
  assert(result.value === 'test data');
});

test('should handle TTL expiration', () => {
  memory.set('test:ttl', { value: 'expires' }, 100); // 100ms TTL
  assert(memory.get('test:ttl').value === 'expires');
  
  // Wait for expiration
  const start = Date.now();
  while (Date.now() - start < 150) {} // Busy wait
  
  assert(memory.get('test:ttl') === null);
});

test('should get values by pattern', () => {
  memory.set('agent:planner:task1', { task: 'plan' });
  memory.set('agent:planner:task2', { task: 'design' });
  memory.set('agent:developer:task1', { task: 'code' });
  
  const plannerTasks = memory.getByPattern('agent:planner:*');
  assert(Object.keys(plannerTasks).length === 2);
  assert(plannerTasks['agent:planner:task1'].task === 'plan');
});

test('should clear values by pattern', () => {
  memory.set('temp:file1', { data: '1' });
  memory.set('temp:file2', { data: '2' });
  memory.set('permanent:file', { data: '3' });
  
  memory.clearPattern('temp:*');
  
  assert(memory.get('temp:file1') === null);
  assert(memory.get('temp:file2') === null);
  assert(memory.get('permanent:file').data === '3');
});

test('should clear all values', () => {
  memory.set('key1', { data: '1' });
  memory.set('key2', { data: '2' });
  
  memory.clear();
  
  assert(memory.get('key1') === null);
  assert(memory.get('key2') === null);
});

test('should persist to disk', () => {
  memory.set('persistent:key', { value: 'saved' });
  memory.saveSync();
  
  assert(fs.existsSync(testMemoryPath));
  const data = JSON.parse(fs.readFileSync(testMemoryPath, 'utf-8'));
  assert(data.entries['persistent:key'].value.value === 'saved');
});

test('should load from disk', () => {
  // Create new instance
  const memory2 = new SimpleMemoryStore(testMemoryPath);
  const result = memory2.get('persistent:key');
  assert(result && result.value === 'saved');
});

test('should return stats', () => {
  memory.clear();
  memory.set('key1', { data: '1' });
  memory.set('key2', { data: '2' }, 1000);
  
  const stats = memory.stats();
  assert(stats.totalKeys === 2);
  assert(stats.keysWithTTL === 1);
  assert(stats.keysWithoutTTL === 1);
});

// Cleanup
try {
  // Destroy the memory store first
  memory.destroy();
  
  // Small delay to ensure all async operations complete
  setTimeout(() => {
    if (fs.existsSync(testDir)) {
      fs.removeSync(testDir);
    }
    
    // Results
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
    
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }, 100);
} catch (error) {
  console.error('Cleanup error:', error);
  process.exit(1);
}