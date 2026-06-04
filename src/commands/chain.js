#!/usr/bin/env node

import chalk from 'chalk';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import { loadConfig, getVoiceConfig } from '../utils/config.js';
import { getMemoryStore } from '../memory/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function chainCommand(chainNameOrAgents, options) {
  const spinner = ora();
  const memory = getMemoryStore();
  const voiceConfig = getVoiceConfig();
  const useVoice = options.voice !== undefined ? options.voice : voiceConfig.enabled;
  
  try {
    console.log(chalk.bold.blue('🔗 Agent Chain Execution\n'));
    
    let chain;
    
    // Check if it's a predefined chain or ad-hoc agents
    if (chainNameOrAgents.length === 1 && !chainNameOrAgents[0].includes(',')) {
      // Try to load predefined chain
      const chainPath = join(process.cwd(), '.claude', 'chains', `${chainNameOrAgents[0]}.json`);
      
      if (existsSync(chainPath)) {
        chain = JSON.parse(readFileSync(chainPath, 'utf-8'));
        console.log(chalk.cyan(`Loading chain: ${chain.name}`));
        console.log(chalk.gray(chain.description));
        console.log();
      } else {
        // List available chains
        const chainsDir = join(process.cwd(), '.claude', 'chains');
        if (existsSync(chainsDir)) {
          const chains = readdirSync(chainsDir)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
          
          if (chains.length > 0) {
            console.error(chalk.red(`Chain "${chainNameOrAgents[0]}" not found.\n`));
            console.log(chalk.yellow('Available chains:'));
            chains.forEach(c => console.log(chalk.gray('  -'), c));
          } else {
            console.error(chalk.red('No predefined chains found.'));
          }
        } else {
          console.error(chalk.red('No chains directory found.'));
        }
        process.exit(1);
      }
    } else {
      // Ad-hoc chain from command line
      const agents = chainNameOrAgents.join(',').split(',').map(a => a.trim());
      chain = {
        name: 'ad-hoc-chain',
        description: `Running ${agents.length} agents sequentially`,
        steps: agents.map((agent, i) => ({
          agent,
          task: options.tasks?.[i] || options.task || `Task for ${agent}`
        }))
      };
    }
    
    // Display chain plan
    console.log(chalk.bold('📋 Chain Plan:'));
    chain.steps.forEach((step, i) => {
      const prefix = i === chain.steps.length - 1 ? '└─' : '├─';
      console.log(chalk.gray(prefix), `${i + 1}.`, chalk.cyan(step.agent), '→', chalk.yellow(step.task));
    });
    console.log();
    
    // Execute chain
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < chain.steps.length; i++) {
      const step = chain.steps[i];
      const stepNum = i + 1;
      
      console.log(chalk.bold(`\n🚀 Step ${stepNum}/${chain.steps.length}: ${step.agent}`));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Check if we should run concurrently
      if (step.concurrent && i < chain.steps.length - 1) {
        // Run this and next steps concurrently
        const concurrentSteps = [step];
        while (i + 1 < chain.steps.length && chain.steps[i + 1].concurrent) {
          i++;
          concurrentSteps.push(chain.steps[i]);
        }
        
        console.log(chalk.yellow('Running concurrently:'));
        concurrentSteps.forEach(s => console.log(chalk.gray('  •'), s.agent));
        
        // Execute concurrent steps
        const promises = concurrentSteps.map(s => executeAgent(s.agent, s.task, options));
        const concurrentResults = await Promise.all(promises);
        results.push(...concurrentResults);
      } else {
        // Execute single step
        const result = await executeAgent(step.agent, step.task, options);
        results.push(result);
      }
      
      // Small delay between steps
      if (i < chain.steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(chalk.bold.green(`\n✅ Chain Completed in ${duration}s`));
    
    // Show handoffs created
    const handoffPattern = 'handoff:*:*:*';
    const handoffs = memory.keys(handoffPattern);
    
    if (handoffs.length > 0) {
      console.log(chalk.bold('\n📦 Handoffs Created:'));
      handoffs.slice(-5).forEach(key => {
        const handoff = memory.get(key);
        if (handoff) {
          console.log(chalk.gray('├─'), 
            chalk.cyan(handoff.from), '→', 
            chalk.yellow(handoff.type), '→',
            chalk.green(handoff.to === '*' ? 'any' : handoff.to)
          );
        }
      });
    }
    
    // Tips
    console.log('\n' + chalk.bold('💡 Next Steps:'));
    console.log(chalk.gray('•'), 'View handoffs:', chalk.yellow('memory.keys("handoff:*:*:*")'));
    console.log(chalk.gray('•'), 'Create chain file:', chalk.yellow('claude-agents chain --save my-chain'));
    console.log(chalk.gray('•'), 'Run with voice:', chalk.yellow('claude-agents chain my-chain --voice'));
    
  } catch (error) {
    spinner.fail('Chain execution failed');
    console.error(chalk.red(error.message));
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

async function executeAgent(agentName, task, options) {
  return new Promise((resolve, reject) => {
    const args = ['run', agentName, '--task', task];
    
    if (options.voice) {
      args.push('--voice');
    }
    
    if (options.isolated) {
      args.push('--isolated');
    }
    
    const child = spawn('claude-agents', args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ agent: agentName, task, status: 'completed' });
      } else {
        reject(new Error(`Agent ${agentName} failed with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}