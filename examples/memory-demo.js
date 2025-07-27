#!/usr/bin/env node

import { getMemoryStore } from '../src/memory/index.js';

console.log('🧠 Claude Sub-Agents Memory Store Demo\n');

// Get the memory store instance
const memory = getMemoryStore();

// Example 1: Basic storage
console.log('1️⃣ Basic Storage:');
memory.set('agent:planner:current-task', {
  name: 'Design e-commerce API',
  status: 'in-progress',
  subtasks: ['authentication', 'product-management', 'order-processing']
});
console.log('✓ Stored current task for planner agent');

// Example 2: Storage with TTL
console.log('\n2️⃣ Storage with TTL (5 seconds):');
memory.set('agent:api-developer:temp-data', {
  endpoints: ['/users', '/products'],
  timestamp: Date.now()
}, 5000); // 5 second TTL
console.log('✓ Stored temporary data with 5s TTL');

// Example 3: Retrieve data
console.log('\n3️⃣ Retrieving Data:');
const plannerTask = memory.get('agent:planner:current-task');
console.log('Planner task:', JSON.stringify(plannerTask, null, 2));

// Example 4: Pattern matching
console.log('\n4️⃣ Pattern Matching:');
memory.set('agent:tester:coverage', { overall: 85, unit: 90, integration: 80 });
memory.set('agent:tester:last-run', new Date().toISOString());
const testerKeys = memory.keys('agent:tester:*');
console.log('Tester agent keys:', testerKeys);

// Example 5: Namespace coordination
console.log('\n5️⃣ Agent Coordination Example:');
// Planner stores discovered API endpoints
memory.set('shared:api:endpoints', {
  users: { path: '/api/users', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  products: { path: '/api/products', methods: ['GET', 'POST'] }
});

// API developer can access shared data
const sharedEndpoints = memory.get('shared:api:endpoints');
console.log('Shared endpoints:', JSON.stringify(sharedEndpoints, null, 2));

// Example 6: Memory statistics
console.log('\n6️⃣ Memory Statistics:');
const stats = memory.stats();
console.log('Stats:', JSON.stringify(stats, null, 2));

// Example 7: Demonstrate TTL expiration
console.log('\n7️⃣ TTL Expiration Demo:');
setTimeout(() => {
  const expiredData = memory.get('agent:api-developer:temp-data');
  console.log('Temp data after 6 seconds:', expiredData); // Should be null
  
  // Cleanup expired entries
  const cleaned = memory.cleanup();
  console.log(`Cleaned up ${cleaned} expired entries`);
  
  // Final stats
  console.log('\nFinal memory stats:', JSON.stringify(memory.stats(), null, 2));
  
  // Destroy memory store
  memory.destroy();
  console.log('\n✨ Demo completed!');
  process.exit(0);
}, 6000);

console.log('\n⏳ Waiting 6 seconds to demonstrate TTL expiration...');