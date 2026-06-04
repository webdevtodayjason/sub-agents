import chalk from 'chalk';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { CLAUDE_PROJECT_DIR } from '../utils/paths.js';

export async function diagnoseCommand() {
  console.log(chalk.bold.cyan('\n🔍 Claude Agents Diagnostic Tool\n'));
  
  let issues = 0;
  let warnings = 0;
  
  // Check if .claude directory exists
  if (!existsSync(CLAUDE_PROJECT_DIR)) {
    console.log(chalk.red('✗ .claude directory not found'));
    console.log(chalk.gray('  Fix: Run ') + chalk.cyan('claude-agents init'));
    issues++;
    return;
  }
  
  console.log(chalk.green('✓ .claude directory found'));
  
  // Check hooks directory
  const hooksDir = join(CLAUDE_PROJECT_DIR, 'hooks');
  if (!existsSync(hooksDir)) {
    console.log(chalk.red('✗ .claude/hooks directory not found'));
    console.log(chalk.gray('  Fix: Run ') + chalk.cyan('claude-agents init'));
    issues++;
  } else {
    console.log(chalk.green('✓ .claude/hooks directory found'));
    
    // Check essential hooks
    const essentialHooks = [
      'stop.py',
      'subagent_stop.py',
      'post_tool_use_elevenlabs.py',
      'notification.py'
    ];
    
    console.log(chalk.bold('\nChecking essential hooks:'));
    for (const hook of essentialHooks) {
      const hookPath = join(hooksDir, hook);
      if (!existsSync(hookPath)) {
        console.log(chalk.red(`✗ ${hook} not found`));
        issues++;
      } else {
        const stats = statSync(hookPath);
        const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
        if (!isExecutable) {
          console.log(chalk.yellow(`⚠ ${hook} not executable`));
          console.log(chalk.gray(`  Fix: chmod +x ${hookPath}`));
          warnings++;
        } else {
          console.log(chalk.green(`✓ ${hook} found and executable`));
        }
      }
    }
  }
  
  // Check settings.json
  const settingsPath = join(CLAUDE_PROJECT_DIR, 'settings.json');
  if (!existsSync(settingsPath)) {
    console.log(chalk.red('\n✗ .claude/settings.json not found'));
    console.log(chalk.gray('  Fix: Run ') + chalk.cyan('claude-agents init'));
    issues++;
  } else {
    console.log(chalk.green('\n✓ .claude/settings.json found'));
    
    // Check hook configurations
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      if (!settings.hooks) {
        console.log(chalk.yellow('⚠ No hooks configured in settings.json'));
        warnings++;
      } else {
        const expectedHooks = ['Stop', 'SubagentStop', 'PostToolUse', 'Notification'];
        for (const hookName of expectedHooks) {
          if (!settings.hooks[hookName]) {
            console.log(chalk.yellow(`⚠ ${hookName} hook not configured`));
            warnings++;
          }
        }
      }
    } catch (error) {
      console.log(chalk.red('✗ Failed to parse settings.json'));
      issues++;
    }
  }
  
  // Check uv installation
  console.log(chalk.bold('\nChecking dependencies:'));
  try {
    execSync('which uv', { stdio: 'ignore' });
    console.log(chalk.green('✓ uv is installed'));
  } catch {
    console.log(chalk.red('✗ uv not found'));
    console.log(chalk.gray('  Fix: Install uv from https://github.com/astral-sh/uv'));
    issues++;
  }
  
  // Check Python
  try {
    const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
    console.log(chalk.green(`✓ Python installed: ${pythonVersion}`));
  } catch {
    console.log(chalk.yellow('⚠ Python 3 not found (required for hooks)'));
    warnings++;
  }
  
  // Summary
  console.log(chalk.bold('\n📊 Diagnostic Summary:'));
  if (issues === 0 && warnings === 0) {
    console.log(chalk.green('✅ All checks passed! Your installation is healthy.'));
  } else {
    if (issues > 0) {
      console.log(chalk.red(`❌ ${issues} critical issue${issues > 1 ? 's' : ''} found`));
    }
    if (warnings > 0) {
      console.log(chalk.yellow(`⚠️  ${warnings} warning${warnings > 1 ? 's' : ''} found`));
    }
    
    console.log(chalk.bold('\n🔧 Quick fix for all issues:'));
    console.log(chalk.cyan('  1. claude-agents init'));
    console.log(chalk.cyan('  2. chmod +x .claude/hooks/*.py'));
    console.log(chalk.cyan('  3. chmod +x .claude/hooks/utils/llm/*.py'));
    console.log(chalk.cyan('  4. chmod +x .claude/hooks/utils/tts/*.py'));
  }
  
  // Check if we're in debug mode
  if (process.env.DEBUG) {
    console.log(chalk.gray('\n🐛 Debug mode enabled'));
    console.log(chalk.gray('Working directory: ' + process.cwd()));
    console.log(chalk.gray('Claude directory: ' + CLAUDE_PROJECT_DIR));
  }
}