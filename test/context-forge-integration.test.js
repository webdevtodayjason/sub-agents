#!/usr/bin/env node
process.env.NODE_ENV = 'test';

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { detectContextForge, createContextAwareConfig } from '../src/utils/contextForgeDetector.js';
import { createContextAwareAgent, getAgentRuntimeConfig } from '../src/utils/agents.js';
import SimpleMemoryStore from '../src/memory/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🧪 Testing Context-Forge Integration...\n');

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

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

// Setup test project
const TEST_PROJECT_DIR = join(__dirname, 'test-context-forge-project');

function setupTestProject() {
  // Create test directory
  if (!existsSync(TEST_PROJECT_DIR)) {
    mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  }
  
  // Create CLAUDE.md
  writeFileSync(join(TEST_PROJECT_DIR, 'CLAUDE.md'), `# Test Project - Claude Code Context

## Project Overview
Test project for context-forge integration

## Tech Stack
- Backend: Express.js
- Database: PostgreSQL
- Testing: Jest

## Development Rules
1. Follow REST principles
2. Use TypeScript
3. Write tests first
`);

  // Create Docs directory
  mkdirSync(join(TEST_PROJECT_DIR, 'Docs'), { recursive: true });
  writeFileSync(join(TEST_PROJECT_DIR, 'Docs', 'Implementation.md'), `# Implementation Plan

## Stage 1: Foundation (Complete)
- [x] Project setup
- [x] Database configuration

## Stage 2: Core Features (In Progress)  
- [x] User model
- [ ] Authentication system
- [ ] API endpoints
`);

  // Create PRPs directory
  mkdirSync(join(TEST_PROJECT_DIR, 'PRPs'), { recursive: true });
  writeFileSync(join(TEST_PROJECT_DIR, 'PRPs', 'auth-prp.md'), `# PRP: Authentication System

## Goal
Implement JWT-based authentication

## Success Criteria
- [ ] Login endpoint
- [ ] Register endpoint
- [ ] JWT validation
`);

  // Create .claude directory structure
  mkdirSync(join(TEST_PROJECT_DIR, '.claude', 'commands'), { recursive: true });
  writeFileSync(join(TEST_PROJECT_DIR, '.claude', 'commands', 'test-command.md'), `---
name: test-command
description: Test command for integration
category: test
---

# Test Command
`);

  // Create .context-forge config
  mkdirSync(join(TEST_PROJECT_DIR, '.context-forge'), { recursive: true });
  writeFileSync(join(TEST_PROJECT_DIR, '.context-forge', 'config.json'), JSON.stringify({
    projectName: 'Test Project',
    techStack: {
      backend: 'express',
      database: 'postgresql'
    },
    features: ['auth', 'api']
  }, null, 2));
}

function cleanup() {
  if (existsSync(TEST_PROJECT_DIR)) {
    rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  }
}

// Run tests
try {
  setupTestProject();
  
  console.log('📁 Testing Context-Forge Detection...');
  
  test('should detect context-forge project structure', () => {
    const detection = detectContextForge(TEST_PROJECT_DIR);
    
    assert(detection.hasContextForge === true, 'Should detect context-forge');
    assert(detection.structure.hasClaudeMd === true, 'Should have CLAUDE.md');
    assert(detection.structure.hasPRPs === true, 'Should have PRPs');
    assert(detection.structure.hasSlashCommands === true, 'Should have commands');
  });

  test('should create context-aware configuration', () => {
    const config = createContextAwareConfig(TEST_PROJECT_DIR);
    
    assert(config.isContextForgeProject === true, 'Should be context-forge project');
    assert(config.projectRules !== null, 'Should have project rules');
    assert(config.availablePRPs.length === 1, 'Should find one PRP');
    assert(config.implementationPlan !== null, 'Should have implementation plan');
  });

  test('should parse implementation progress', () => {
    const config = createContextAwareConfig(TEST_PROJECT_DIR);
    const progress = config.implementationPlan;
    
    assert(progress.totalStages === 2, 'Should have 2 stages');
    assert(progress.currentStage === 2, 'Should be on stage 2');
    assert(progress.stages[0].completedTasks === 2, 'Stage 1 should have 2 completed');
    assert(progress.stages[1].completedTasks === 1, 'Stage 2 should have 1 completed');
  });

  console.log('\n🤖 Testing Agent Context Awareness...');

  test('should create context-aware agent', () => {
    const agent = createContextAwareAgent('project-planner', TEST_PROJECT_DIR);
    
    assert(agent !== null, 'Should create agent');
    assert(agent.isContextAware === true, 'Should be context aware');
    assert(agent.contextInstructions.includes('Context-Forge Project Detected'), 'Should have context instructions');
  });

  test('should provide runtime config with behaviors', () => {
    const config = getAgentRuntimeConfig('api-developer', TEST_PROJECT_DIR);
    
    assert(config !== null, 'Should have runtime config');
    assert(config.behaviors.readBeforeWrite === true, 'Should read before write');
    assert(config.behaviors.checkExistingPRPs === true, 'Should check PRPs');
  });

  console.log('\n💾 Testing Memory Integration...');

  test('should detect context-forge in memory system', () => {
    const memory = new SimpleMemoryStore({
      memoryDir: join(TEST_PROJECT_DIR, '.swarm')
    });
    
    // Change to test directory for initialization
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);
    memory.initializeContextForge();
    process.chdir(originalCwd);
    
    assert(memory.get('context-forge:detected') === true, 'Should detect in memory');
    assert(memory.get('context-forge:config') !== null, 'Should store config');
    
    memory.destroy();
  });

  test('should track PRP states in memory', () => {
    const memory = new SimpleMemoryStore({
      memoryDir: join(TEST_PROJECT_DIR, '.swarm')
    });
    
    memory.updatePRPState('auth-prp.md', {
      executed: true,
      validationPassed: false
    });
    
    const state = memory.getPRPState('auth-prp.md');
    assert(state.executed === true, 'Should track execution');
    assert(state.validationPassed === false, 'Should track validation');
    
    memory.destroy();
  });

  // Summary
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ Context-Forge Integration tests passed');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
  
} finally {
  cleanup();
}