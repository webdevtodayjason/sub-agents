#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.blue.bold('\n🧪 Claude Sub-Agents Test Suite\n'));

const tests = [
  { name: 'Memory System', file: 'memory.test.js' },
  { name: 'Concurrent Execution', file: 'concurrent-execution.test.js' },
  { name: 'CLI Commands', file: 'commands.test.js' }
];

let totalPassed = 0;
let totalFailed = 0;

async function runTest(name, file) {
  console.log(chalk.yellow(`\n🏃 Running ${name} tests...`));
  
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, file);
    const proc = spawn('node', [testPath], { stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${name} tests passed`));
        totalPassed++;
      } else {
        console.log(chalk.red(`❌ ${name} tests failed`));
        totalFailed++;
      }
      resolve();
    });
    
    proc.on('error', (error) => {
      console.error(chalk.red(`Error running ${name} tests:`, error));
      totalFailed++;
      resolve();
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();
  
  for (const test of tests) {
    await runTest(test.name, test.file);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(chalk.blue.bold('\n📈 Test Summary'));
  console.log(chalk.blue('='.repeat(40)));
  console.log(chalk.green(`✅ Passed: ${totalPassed}`));
  console.log(chalk.red(`❌ Failed: ${totalFailed}`));
  console.log(chalk.gray(`⏱  Duration: ${duration}s`));
  console.log(chalk.blue('='.repeat(40)));
  
  if (totalFailed > 0) {
    console.log(chalk.red.bold('\n❌ Some tests failed!'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n🎉 All tests passed!'));
  }
}

runAllTests().catch(console.error);