#!/usr/bin/env node
process.env.NODE_ENV = 'test';

import SimpleMemoryStore from '../src/memory/index.js';
import { performance } from 'perf_hooks';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test concurrent execution patterns
console.log('\n⚡ Testing Concurrent Execution Patterns...\n');

const memory = new SimpleMemoryStore();

// Simulate agent operations
function simulateFileRead(filename, delay = 100) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`Content of ${filename}`);
    }, delay);
  });
}

function simulateAgentTask(agentName, taskName, delay = 200) {
  return new Promise(resolve => {
    setTimeout(() => {
      memory.set(`agent:${agentName}:${taskName}`, {
        status: 'completed',
        result: `${taskName} done by ${agentName}`
      });
      resolve(`${agentName} completed ${taskName}`);
    }, delay);
  });
}

// Test 1: Sequential vs Concurrent File Operations
async function testFileOperations() {
  console.log('📄 Testing File Operations...');
  
  const files = ['file1.js', 'file2.js', 'file3.js', 'file4.js', 'file5.js'];
  
  // Sequential approach
  const sequentialStart = performance.now();
  for (const file of files) {
    await simulateFileRead(file);
  }
  const sequentialTime = performance.now() - sequentialStart;
  
  // Concurrent approach
  const concurrentStart = performance.now();
  await Promise.all(files.map(file => simulateFileRead(file)));
  const concurrentTime = performance.now() - concurrentStart;
  
  const improvement = ((sequentialTime - concurrentTime) / sequentialTime * 100).toFixed(1);
  console.log(`  Sequential: ${sequentialTime.toFixed(0)}ms`);
  console.log(`  Concurrent: ${concurrentTime.toFixed(0)}ms`);
  console.log(`  ✅ ${improvement}% improvement\n`);
}

// Test 2: Multi-Agent Task Execution
async function testMultiAgentExecution() {
  console.log('🤖 Testing Multi-Agent Execution...');
  
  const tasks = [
    { agent: 'planner', task: 'design-architecture' },
    { agent: 'api-developer', task: 'create-endpoints' },
    { agent: 'frontend-developer', task: 'build-ui' },
    { agent: 'tdd-specialist', task: 'write-tests' },
    { agent: 'documenter', task: 'generate-docs' }
  ];
  
  // Sequential approach
  const sequentialStart = performance.now();
  for (const { agent, task } of tasks) {
    await simulateAgentTask(agent, task);
  }
  const sequentialTime = performance.now() - sequentialStart;
  
  // Concurrent approach
  const concurrentStart = performance.now();
  await Promise.all(
    tasks.map(({ agent, task }) => simulateAgentTask(agent, task))
  );
  const concurrentTime = performance.now() - concurrentStart;
  
  const improvement = ((sequentialTime - concurrentTime) / sequentialTime * 100).toFixed(1);
  console.log(`  Sequential: ${sequentialTime.toFixed(0)}ms`);
  console.log(`  Concurrent: ${concurrentTime.toFixed(0)}ms`);
  console.log(`  ✅ ${improvement}% improvement\n`);
  
  // Verify all tasks completed
  const completedTasks = memory.getByPattern('agent:*:*');
  console.log(`  ✅ ${Object.keys(completedTasks).length} tasks completed successfully\n`);
}

// Test 3: Mixed Operations Pattern
async function testMixedOperations() {
  console.log('🌀 Testing Mixed Operations Pattern...');
  
  const operations = [
    simulateFileRead('config.json', 50),
    simulateFileRead('package.json', 50),
    simulateAgentTask('planner', 'analyze-requirements', 150),
    simulateFileRead('src/index.js', 100),
    simulateAgentTask('developer', 'implement-feature', 200),
    simulateFileRead('test/spec.js', 75)
  ];
  
  const start = performance.now();
  const results = await Promise.all(operations);
  const time = performance.now() - start;
  
  console.log(`  Completed ${results.length} operations in ${time.toFixed(0)}ms`);
  console.log(`  Average time per operation: ${(time / results.length).toFixed(0)}ms`);
  console.log(`  ✅ All operations completed concurrently\n`);
}

// Test 4: Memory Coordination Between Agents
async function testMemoryCoordination() {
  console.log('🧠 Testing Memory Coordination...');
  
  // Agent 1 discovers API endpoints
  await simulateAgentTask('api-developer', 'discover-endpoints', 100);
  memory.set('api:endpoints', {
    users: '/api/users',
    products: '/api/products',
    orders: '/api/orders'
  });
  
  // Multiple agents use the discovered information concurrently
  const start = performance.now();
  await Promise.all([
    new Promise(resolve => {
      const endpoints = memory.get('api:endpoints');
      memory.set('frontend:components:users', {
        endpoint: endpoints.users,
        component: 'UserList'
      });
      resolve();
    }),
    new Promise(resolve => {
      const endpoints = memory.get('api:endpoints');
      memory.set('tests:api:users', {
        endpoint: endpoints.users,
        tests: ['GET', 'POST', 'PUT', 'DELETE']
      });
      resolve();
    }),
    new Promise(resolve => {
      const endpoints = memory.get('api:endpoints');
      memory.set('docs:api:endpoints', {
        documented: Object.keys(endpoints).length
      });
      resolve();
    })
  ]);
  const time = performance.now() - start;
  
  const coordinated = memory.getByPattern('*:*:*');
  console.log(`  ✅ ${Object.keys(coordinated).length} coordinated entries created`);
  console.log(`  Time taken: ${time.toFixed(0)}ms\n`);
}

// Run all tests
async function runTests() {
  try {
    await testFileOperations();
    await testMultiAgentExecution();
    await testMixedOperations();
    await testMemoryCoordination();
    
    console.log('🎆 All concurrent execution tests completed!\n');
    
    // Clean up memory store
    memory.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests();