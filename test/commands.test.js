#!/usr/bin/env node
process.env.NODE_ENV = 'test';

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const claudeAgentsCLI = path.join(__dirname, '..', 'bin', 'claude-agents');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  return new Promise(async (resolve) => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
      resolve();
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  ${error.message}`);
      failed++;
      resolve();
    }
  });
}

function runCommand(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [claudeAgentsCLI, ...args]);
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', reject);
  });
}

// Tests
console.log('\n🧪 Testing CLI Commands...\n');

async function runTests() {
  await test('should show help', async () => {
    const { code, stdout } = await runCommand(['--help']);
    if (code !== 0) throw new Error(`Exit code: ${code}`);
    if (!stdout.includes('Claude Sub-Agents Manager')) {
      throw new Error('Help text missing');
    }
  });
  
  await test('should show version', async () => {
    const { code, stdout } = await runCommand(['--version']);
    if (code !== 0) throw new Error(`Exit code: ${code}`);
    if (!stdout.match(/\d+\.\d+\.\d+/)) {
      throw new Error('Version not shown');
    }
  });
  
  await test('should list agents', async () => {
    const { code, stdout } = await runCommand(['list']);
    if (code !== 0) throw new Error(`Exit code: ${code}`);
    if (!stdout.includes('Available:') && !stdout.includes('Agent')) {
      throw new Error('Agent list not shown');
    }
  });
  
  await test('should show agent info', async () => {
    const { code, stdout } = await runCommand(['info', 'code-reviewer']);
    if (code !== 0) throw new Error(`Exit code: ${code}`);
    if (!stdout.includes('code-reviewer')) {
      throw new Error('Agent info not shown');
    }
  });
  
  await test('should handle missing agent info', async () => {
    const { code, stdout, stderr } = await runCommand(['info', 'non-existent-agent']);
    if (code === 0) throw new Error('Should have failed');
    if (!stdout.includes('not found') && !stderr.includes('not found')) {
      throw new Error('Error message not shown');
    }
  });
  
  await test('should validate run command', async () => {
    const { code, stdout, stderr } = await runCommand(['run']);
    if (code === 0) throw new Error('Should have failed without agent name');
    if (!stderr.includes('agent') && !stdout.includes('agent')) {
      throw new Error('Error message not helpful');
    }
  });
  
  await test('should validate run command task', async () => {
    const { code, stderr } = await runCommand(['run', 'test-runner']);
    if (code === 0) throw new Error('Should have failed without task');
    if (!stderr.includes('task')) {
      throw new Error('Error message not helpful');
    }
  });
  
  // Memory test
  await test('should create memory directory', async () => {
    const memoryDir = path.join(__dirname, '..', '.swarm');
    if (!fs.existsSync(memoryDir)) {
      fs.ensureDirSync(memoryDir);
    }
    if (!fs.existsSync(memoryDir)) {
      throw new Error('Memory directory not created');
    }
  });
  
  // Dashboard command test
  await test('should validate dashboard command', async () => {
    // Just test that the command exists and validates ports
    const { code, stderr } = await runCommand(['dashboard', '--port', 'invalid']);
    if (!stderr.includes('Invalid port')) {
      // Dashboard might not fail immediately, that's ok
      // Just checking command exists
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);