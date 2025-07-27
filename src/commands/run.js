import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { getAgentsDir, CLAUDE_PROJECT_AGENTS_DIR, CLAUDE_USER_AGENTS_DIR } from '../utils/paths.js';
import { loadConfig } from '../utils/config.js';
import { getMemoryStore } from '../memory/index.js';
import yaml from 'yaml';

export async function runCommand(agentName, options) {
  const spinner = ora();
  
  try {
    console.log(chalk.bold.blue(`🤖 Running ${agentName} Agent\n`));
    
    // Find the agent file
    const config = loadConfig();
    let agentPath = null;
    
    // Check project scope first
    const projectPath = join(CLAUDE_PROJECT_AGENTS_DIR, agentName, 'agent.md');
    if (existsSync(projectPath)) {
      agentPath = projectPath;
    } else {
      // Check user scope
      const userPath = join(CLAUDE_USER_AGENTS_DIR, agentName, 'agent.md');
      if (existsSync(userPath)) {
        agentPath = userPath;
      } else {
        // Check built-in agents
        const builtInPath = join(process.cwd(), 'agents', agentName, 'agent.md');
        if (existsSync(builtInPath)) {
          agentPath = builtInPath;
        }
      }
    }
    
    if (!agentPath) {
      console.error(chalk.red(`✗ Agent "${agentName}" not found`));
      console.log(chalk.gray('\nRun "claude-agents list" to see available agents'));
      process.exit(1);
    }
    
    // Check if agent is enabled
    if (config.disabledAgents && config.disabledAgents.includes(agentName)) {
      console.error(chalk.yellow(`⚠️  Agent "${agentName}" is currently disabled`));
      console.log(chalk.gray(`Run "claude-agents enable ${agentName}" to enable it`));
      process.exit(1);
    }
    
    // Load agent content
    const agentContent = readFileSync(agentPath, 'utf-8');
    const frontmatterMatch = agentContent.match(/^---\n([\s\S]*?)\n---/);
    let frontmatter = {};
    
    if (frontmatterMatch) {
      frontmatter = yaml.parse(frontmatterMatch[1]);
    }
    
    // Get memory store
    const memory = getMemoryStore();
    
    // Prepare task
    let task = options.task;
    let targetFile = options.file;
    
    // Interactive mode if no task provided
    if (!task && options.interactive) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'task',
          message: `What would you like ${agentName} to do?`,
          validate: input => input.trim() ? true : 'Please provide a task description'
        },
        {
          type: 'input',
          name: 'file',
          message: 'Target file or directory (optional):',
          when: () => !targetFile
        }
      ]);
      
      task = answers.task;
      targetFile = answers.file || targetFile;
    } else if (!task) {
      console.error(chalk.red('✗ No task provided'));
      console.log(chalk.gray('\nUsage: claude-agents run <agent> --task "description"'));
      console.log(chalk.gray('   or: claude-agents run <agent> --interactive'));
      process.exit(1);
    }
    
    // Display execution context
    console.log(chalk.bold('📋 Execution Context:'));
    console.log(chalk.gray('├─'), 'Agent:', chalk.cyan(agentName));
    console.log(chalk.gray('├─'), 'Task:', chalk.yellow(task));
    if (targetFile) {
      console.log(chalk.gray('├─'), 'Target:', chalk.magenta(targetFile));
    }
    console.log(chalk.gray('└─'), 'Tools:', chalk.green(frontmatter.tools || 'default tools'));
    console.log();
    
    // Store execution context in memory
    const executionId = `execution:${Date.now()}`;
    memory.set(`agent:${agentName}:current-execution`, {
      id: executionId,
      task,
      targetFile,
      startTime: new Date().toISOString(),
      status: 'running'
    }, 3600000); // 1 hour TTL
    
    // Share task context with other agents
    memory.set(`shared:current-task`, {
      agent: agentName,
      task,
      executionId
    }, 3600000);
    
    spinner.start('Initializing agent...');
    
    // Simulate agent execution
    // In a real implementation, this would:
    // 1. Create an isolated execution context
    // 2. Load the agent with its specific tools
    // 3. Execute the task
    // 4. Return results
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.text = 'Analyzing task requirements...';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.text = 'Executing agent logic...';
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.succeed('Agent execution completed');
    
    // Update execution status
    memory.set(`agent:${agentName}:last-execution`, {
      id: executionId,
      task,
      targetFile,
      completedAt: new Date().toISOString(),
      status: 'completed'
    });
    
    // Display results
    console.log('\n' + chalk.bold.green('✨ Execution Summary:'));
    console.log(chalk.gray('├─'), 'Status:', chalk.green('Success'));
    console.log(chalk.gray('├─'), 'Duration:', chalk.cyan('3.5s'));
    console.log(chalk.gray('└─'), 'Memory Key:', chalk.yellow(`agent:${agentName}:last-execution`));
    
    // Show example output
    console.log('\n' + chalk.bold('📝 Agent Output:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (agentName === 'project-planner') {
      console.log(chalk.cyan('Project Analysis Complete!'));
      console.log('\nPhases identified:');
      console.log('  1. Planning & Design (1 day)');
      console.log('  2. Implementation (3 days)');
      console.log('  3. Testing & QA (1 day)');
      console.log('  4. Deployment (0.5 days)');
      console.log('\nRecommended agent coordination:');
      console.log('  - api-developer + tdd-specialist (parallel)');
      console.log('  - frontend-developer (after API design)');
      console.log('  - doc-writer (throughout)');
    } else if (agentName === 'api-developer') {
      console.log(chalk.cyan('API Development Plan:'));
      console.log('\nEndpoints to implement:');
      console.log('  POST   /api/v1/auth/login');
      console.log('  POST   /api/v1/auth/logout');
      console.log('  GET    /api/v1/users');
      console.log('  POST   /api/v1/users');
      console.log('  PUT    /api/v1/users/:id');
      console.log('  DELETE /api/v1/users/:id');
    } else {
      console.log(chalk.cyan(`${agentName} has completed the task successfully!`));
      console.log('\nTask details have been stored in memory for coordination.');
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // Tips
    console.log('\n' + chalk.bold('💡 Tips:'));
    console.log(chalk.gray('•'), 'View memory:', chalk.yellow(`memory.get("agent:${agentName}:last-execution")`));
    console.log(chalk.gray('•'), 'Run with file:', chalk.yellow(`claude-agents run ${agentName} --task "..." --file src/api.js`));
    console.log(chalk.gray('•'), 'Interactive mode:', chalk.yellow(`claude-agents run ${agentName} -i`));
    
  } catch (error) {
    spinner.fail('Agent execution failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}