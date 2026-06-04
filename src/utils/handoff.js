/**
 * Agent Handoff Utilities
 * 
 * Manages lightweight data transfer between agents
 * to preserve context windows
 */

import { getMemoryStore } from '../memory/index.js';

/**
 * Store handoff data between agents
 * @param {string} fromAgent - Source agent name
 * @param {string} toAgent - Target agent name (use '*' for any)
 * @param {string} dataType - Type of data being passed
 * @param {any} data - The actual data (keep minimal!)
 * @param {string} summary - Brief summary for orchestrator
 * @param {number} ttl - Time to live in ms (default: 1 hour)
 */
export function createHandoff(fromAgent, toAgent, dataType, data, summary, ttl = 3600000) {
  const memory = getMemoryStore();
  const handoffKey = `handoff:${fromAgent}:${toAgent}:${dataType}`;
  
  const handoff = {
    task_id: `task-${Date.now()}`,
    from: fromAgent,
    to: toAgent,
    type: dataType,
    data: data,
    summary: summary,
    timestamp: new Date().toISOString()
  };
  
  memory.set(handoffKey, handoff, ttl);
  
  // Also store a reference for the target agent to find
  if (toAgent !== '*') {
    memory.set(`pending:${toAgent}:${dataType}`, handoffKey, ttl);
  }
  
  return handoff;
}

/**
 * Retrieve handoff data for an agent
 * @param {string} agentName - Agent looking for inputs
 * @param {string} dataType - Type of data needed
 * @returns {Object|null} Handoff data or null
 */
export function getHandoff(agentName, dataType) {
  const memory = getMemoryStore();
  
  // Check if there's a pending handoff for this agent
  const pendingKey = memory.get(`pending:${agentName}:${dataType}`);
  if (pendingKey) {
    const handoff = memory.get(pendingKey);
    // Clean up the pending reference
    memory.delete(`pending:${agentName}:${dataType}`);
    return handoff;
  }
  
  // Look for any handoff to this agent or wildcard
  const patterns = [
    `handoff:*:${agentName}:${dataType}`,
    `handoff:*:*:${dataType}`
  ];
  
  for (const pattern of patterns) {
    const keys = memory.keys(pattern);
    if (keys.length > 0) {
      // Get the most recent handoff
      const handoffs = keys.map(key => memory.get(key))
        .filter(h => h !== null)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (handoffs.length > 0) {
        return handoffs[0];
      }
    }
  }
  
  return null;
}

/**
 * Get all available handoffs for an agent
 * @param {string} agentName - Agent name
 * @returns {Array} Array of available handoffs
 */
export function getAvailableHandoffs(agentName) {
  const memory = getMemoryStore();
  const handoffs = [];
  
  // Get all pending handoffs
  const pendingPattern = `pending:${agentName}:*`;
  const pendingKeys = memory.keys(pendingPattern);
  
  for (const pendingKey of pendingKeys) {
    const handoffKey = memory.get(pendingKey);
    const handoff = memory.get(handoffKey);
    if (handoff) {
      handoffs.push(handoff);
    }
  }
  
  return handoffs;
}

/**
 * Create a handoff summary for the orchestrator
 * @param {string} agent - Agent name
 * @param {string} task - Task description
 * @param {Object} result - Task result
 * @returns {string} Brief summary
 */
export function createSummary(agent, task, result) {
  // Keep summaries under 100 characters for context efficiency
  const status = result.success ? '✓' : '✗';
  const key = result.output_type || 'result';
  
  return `${status} ${agent}: ${task.substring(0, 50)}... → ${key}`;
}

/**
 * Parse agent metadata to get consumes/produces
 * @param {Object} metadata - Agent metadata
 * @returns {Object} Input/output configuration
 */
export function getAgentIO(metadata) {
  return {
    consumes: metadata.consumes || [],
    produces: metadata.produces || [],
    optional_inputs: metadata.optional_inputs || []
  };
}

/**
 * Check if an agent can consume certain data types
 * @param {Object} metadata - Agent metadata
 * @param {Array} availableTypes - Available data types
 * @returns {boolean} Whether agent can proceed
 */
export function canAgentProceed(metadata, availableTypes) {
  const io = getAgentIO(metadata);
  
  // Check if all required inputs are available
  return io.consumes.every(required => 
    availableTypes.includes(required)
  );
}

/**
 * Format handoff data for agent consumption
 * @param {Array} handoffs - Array of handoff objects
 * @returns {Object} Formatted input data
 */
export function formatHandoffInputs(handoffs) {
  const inputs = {};
  
  for (const handoff of handoffs) {
    inputs[handoff.type] = handoff.data;
  }
  
  return inputs;
}