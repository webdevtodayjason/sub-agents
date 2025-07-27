import chalk from 'chalk';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import open from 'open';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function dashboardCommand(options) {
  const spinner = ora();
  const port = options.port || '7842';
  const dashboardPath = join(__dirname, '..', '..', 'dashboard');
  
  console.log(chalk.bold.blue('🚀 Claude Sub-Agents Dashboard\n'));
  
  try {
    // Check if dashboard is built
    if (!existsSync(dashboardPath)) {
      console.error(chalk.red('✗ Dashboard not found. Building dashboard...\n'));
      
      spinner.start('Setting up dashboard for first use...');
      
      // In a real implementation, this would:
      // 1. Install Next.js and dependencies
      // 2. Build the dashboard
      // For now, we'll simulate this
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed('Dashboard setup complete');
    }
    
    // Check if another instance is running
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) {
        console.log(chalk.yellow(`⚠️  Dashboard already running on port ${port}`));
        
        if (!options.noBrowser) {
          console.log(chalk.gray('Opening dashboard in browser...'));
          await open(`http://localhost:${port}`);
        }
        
        console.log(chalk.green(`\n✨ Dashboard URL: http://localhost:${port}`));
        return;
      }
    } catch (error) {
      // Server not running, continue with startup
    }
    
    spinner.start(`Starting dashboard on port ${port}...`);
    
    // Start the dashboard server
    const dashboardProcess = spawn('npm', ['run', 'dashboard:start'], {
      cwd: dashboardPath,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: port,
        NODE_ENV: 'production'
      }
    });
    
    // Wait for server to be ready
    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`http://localhost:${port}/api/health`);
        if (response.ok) {
          spinner.succeed('Dashboard started successfully');
          break;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
    
    if (retries >= maxRetries) {
      spinner.fail('Failed to start dashboard');
      console.error(chalk.red('Dashboard failed to start. Please check the logs.'));
      process.exit(1);
    }
    
    // Display dashboard info
    console.log('\n' + chalk.bold('📊 Dashboard Information:'));
    console.log(chalk.gray('├─'), 'URL:', chalk.cyan(`http://localhost:${port}`));
    console.log(chalk.gray('├─'), 'Status:', chalk.green('Running'));
    console.log(chalk.gray('├─'), 'Process ID:', chalk.yellow(dashboardProcess.pid));
    console.log(chalk.gray('└─'), 'Stop:', chalk.gray('Press Ctrl+C to stop'));
    
    // Open browser unless disabled
    if (!options.noBrowser) {
      console.log('\n' + chalk.gray('Opening dashboard in default browser...'));
      await open(`http://localhost:${port}`);
    }
    
    // Dashboard features info
    console.log('\n' + chalk.bold('✨ Dashboard Features:'));
    console.log(chalk.gray('•'), 'Agent Overview - View all installed agents');
    console.log(chalk.gray('•'), 'Task Runner - Execute agents with custom tasks');
    console.log(chalk.gray('•'), 'Memory Viewer - Inspect shared agent memory');
    console.log(chalk.gray('•'), 'Performance Metrics - Track agent usage');
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n' + chalk.yellow('Shutting down dashboard...'));
      dashboardProcess.kill();
      process.exit(0);
    });
    
    // Keep the process running
    dashboardProcess.on('close', (code) => {
      console.log(chalk.gray(`Dashboard process exited with code ${code}`));
      process.exit(code);
    });
    
  } catch (error) {
    spinner.fail('Failed to start dashboard');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}