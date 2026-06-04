/**
 * Task Tool Integration
 * 
 * Detects Task tool usage and integrates with hooks system for Claude Code environment.
 */

import { emitSubagentStop } from './runner.js';
import chalk from 'chalk';

/**
 * Task completion tracker for Claude Code integration
 */
class TaskTracker {
  constructor() {
    this.activeTasks = new Map();
    this.completedTasks = [];
  }

  /**
   * Register a new task execution
   */
  registerTask(taskId, agentName, taskDescription, options = {}) {
    const taskData = {
      id: taskId,
      agent: agentName,
      task: taskDescription,
      startTime: Date.now(),
      status: 'running',
      targetFile: options.targetFile,
      executionId: options.executionId
    };

    this.activeTasks.set(taskId, taskData);
    
    if (options.verbose) {
      console.log(chalk.gray(`📋 Task registered: ${agentName} - ${taskDescription}`));
    }

    return taskData;
  }

  /**
   * Mark task as completed and emit hooks
   */
  async completeTask(taskId, result = {}, options = {}) {
    const taskData = this.activeTasks.get(taskId);
    if (!taskData) {
      console.warn(chalk.yellow(`Warning: Task ${taskId} not found in tracker`));
      return;
    }

    // Update task data
    taskData.status = 'completed';
    taskData.endTime = Date.now();
    taskData.duration = taskData.endTime - taskData.startTime;
    taskData.result = result;

    // Move to completed tasks
    this.activeTasks.delete(taskId);
    this.completedTasks.push(taskData);

    if (options.verbose) {
      console.log(chalk.green(`✅ Task completed: ${taskData.agent} (${taskData.duration}ms)`));
    }

    // Emit SubagentStop hook for Claude Code
    try {
      await emitSubagentStop({
        name: taskData.agent,
        task: taskData.task,
        status: taskData.status,
        duration: taskData.duration,
        result: taskData.result,
        executionId: taskData.executionId,
        targetFile: taskData.targetFile,
        handoffs: result.handoffs || []
      }, options);
    } catch (error) {
      console.error(chalk.red('Failed to emit SubagentStop hook:'), error.message);
    }

    return taskData;
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId, error, options = {}) {
    const taskData = this.activeTasks.get(taskId);
    if (!taskData) {
      console.warn(chalk.yellow(`Warning: Task ${taskId} not found in tracker`));
      return;
    }

    // Update task data
    taskData.status = 'failed';
    taskData.endTime = Date.now();
    taskData.duration = taskData.endTime - taskData.startTime;
    taskData.error = error;

    // Move to completed tasks
    this.activeTasks.delete(taskId);
    this.completedTasks.push(taskData);

    if (options.verbose) {
      console.log(chalk.red(`❌ Task failed: ${taskData.agent} - ${error.message}`));
    }

    // Emit SubagentStop hook with failure status
    try {
      await emitSubagentStop({
        name: taskData.agent,
        task: taskData.task,
        status: taskData.status,
        duration: taskData.duration,
        error: error.message,
        executionId: taskData.executionId,
        targetFile: taskData.targetFile
      }, options);
    } catch (hookError) {
      console.error(chalk.red('Failed to emit SubagentStop hook:'), hookError.message);
    }

    return taskData;
  }

  /**
   * Get all active tasks
   */
  getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks() {
    return this.completedTasks;
  }

  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.activeTasks.get(taskId) || 
           this.completedTasks.find(task => task.id === taskId);
  }

  /**
   * Clear completed tasks (cleanup)
   */
  clearCompleted() {
    this.completedTasks = [];
  }
}

// Global task tracker instance
const globalTaskTracker = new TaskTracker();

/**
 * Create a new task execution context
 */
export function createTaskExecution(agentName, taskDescription, options = {}) {
  const taskId = `task_${agentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return globalTaskTracker.registerTask(taskId, agentName, taskDescription, {
    ...options,
    executionId: options.executionId || `exec_${Date.now()}`
  });
}

/**
 * Complete a task execution
 */
export async function completeTaskExecution(taskId, result = {}, options = {}) {
  return await globalTaskTracker.completeTask(taskId, result, options);
}

/**
 * Fail a task execution
 */
export async function failTaskExecution(taskId, error, options = {}) {
  return await globalTaskTracker.failTask(taskId, error, options);
}

/**
 * Get the global task tracker instance
 */
export function getTaskTracker() {
  return globalTaskTracker;
}

/**
 * Middleware to wrap agent execution with task tracking
 */
export function withTaskTracking(agentName, taskDescription, executionFn, options = {}) {
  return async (...args) => {
    const taskData = createTaskExecution(agentName, taskDescription, options);
    
    try {
      const result = await executionFn(...args, taskData);
      await completeTaskExecution(taskData.id, result, options);
      return result;
    } catch (error) {
      await failTaskExecution(taskData.id, error, options);
      throw error;
    }
  };
}

/**
 * Claude Code Task tool detection patterns
 * These patterns help identify when agents are being executed via Task tool
 */
export const TASK_TOOL_PATTERNS = {
  // Common Task tool invocation patterns
  TASK_INVOCATION: /Task\s*\(\s*["']([^"']+)["']\s*\)/g,
  AGENT_MENTION: /(?:agent|Agent):\s*([a-zA-Z-]+)/g,
  SLASH_COMMAND: /\/([a-zA-Z-]+)(?:\s|$)/g,
  
  // Extract agent name from task string
  extractAgentName(taskString) {
    // Look for patterns like "api-developer: implement endpoints"
    const agentMatch = taskString.match(/^([a-zA-Z-]+):\s*/);
    if (agentMatch) {
      return agentMatch[1];
    }
    
    // Look for slash commands like "/debug" or "/review"
    const slashMatch = taskString.match(/^\/([a-zA-Z-]+)/);
    if (slashMatch) {
      const command = slashMatch[1];
      // Map common slash commands to agent names
      const commandMap = {
        'review': 'code-reviewer',
        'test': 'test-runner',
        'debug': 'debugger',
        'refactor': 'refactor',
        'document': 'doc-writer',
        'security-scan': 'security-scanner',
        'ui': 'shadcn-ui-builder',
        'shadcn': 'shadcn-ui-builder'
      };
      return commandMap[command] || command;
    }
    
    return null;
  },
  
  // Extract task description
  extractTaskDescription(taskString) {
    // Remove agent prefix if present
    let description = taskString.replace(/^([a-zA-Z-]+):\s*/, '');
    // Remove slash command if present
    description = description.replace(/^\/[a-zA-Z-]+\s*/, '');
    return description.trim();
  }
};