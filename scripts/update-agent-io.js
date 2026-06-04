#!/usr/bin/env node

/**
 * Update all agents with consumes/produces metadata
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const AGENTS_DIR = join(process.cwd(), 'agents');

// Define input/output mappings for each agent
const AGENT_IO_MAP = {
  'project-planner': {
    consumes: ['requirements', 'user-stories', 'project-brief'],
    produces: ['technical-plan', 'task-breakdown', 'milestones', 'dependencies']
  },
  'product-manager': {
    consumes: ['project-brief', 'market-research', 'user-feedback'],
    produces: ['user-stories', 'requirements', 'acceptance-criteria', 'product-specs']
  },
  'api-developer': {
    consumes: ['technical-plan', 'api-specs', 'test-specs', 'bug-report'],
    produces: ['api-implementation', 'endpoints', 'api-code']
  },
  'frontend-developer': {
    consumes: ['api-endpoints', 'ui-mockups', 'user-stories', 'components'],
    produces: ['ui-implementation', 'ui-components', 'frontend-code']
  },
  'tdd-specialist': {
    consumes: ['technical-plan', 'api-specs', 'user-stories', 'code-to-test'],
    produces: ['test-specs', 'test-suite', 'coverage-report']
  },
  'code-reviewer': {
    consumes: ['code-changes', 'pull-request', 'implementation'],
    produces: ['review-report', 'improvement-list', 'security-issues']
  },
  'security-scanner': {
    consumes: ['codebase', 'api-implementation', 'deployment-config'],
    produces: ['vulnerability-report', 'security-issues', 'compliance-report']
  },
  'test-runner': {
    consumes: ['test-suite', 'codebase', 'test-specs'],
    produces: ['test-results', 'coverage-report', 'failing-tests']
  },
  'debugger': {
    consumes: ['error-report', 'failing-tests', 'bug-report'],
    produces: ['root-cause', 'fix-strategy', 'debug-analysis']
  },
  'refactor': {
    consumes: ['code-issues', 'improvement-list', 'codebase'],
    produces: ['refactored-code', 'improvement-report', 'code-changes']
  },
  'devops-engineer': {
    consumes: ['deployment-specs', 'infrastructure-requirements', 'security-report'],
    produces: ['deployment-config', 'ci-cd-pipeline', 'infrastructure-code']
  },
  'doc-writer': {
    consumes: ['technical-specs', 'api-documentation', 'codebase'],
    produces: ['user-guides', 'technical-docs', 'readme-files']
  },
  'api-documenter': {
    consumes: ['api-implementation', 'endpoints', 'api-code'],
    produces: ['api-documentation', 'openapi-spec', 'api-examples']
  },
  'marketing-writer': {
    consumes: ['product-specs', 'user-guides', 'feature-list'],
    produces: ['marketing-content', 'landing-page', 'blog-posts']
  },
  'shadcn-ui-builder': {
    consumes: ['ui-requirements', 'design-system', 'component-list'],
    produces: ['ui-components', 'component-library', 'shadcn-config']
  },
  'meta-agent': {
    consumes: ['agent-requirements', 'capability-gap'],
    produces: ['new-agent', 'agent-config']
  }
};

// Update each agent's metadata
Object.entries(AGENT_IO_MAP).forEach(([agentName, io]) => {
  try {
    const metadataPath = join(AGENTS_DIR, agentName, 'metadata.json');
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
    
    // Check if already has consumes/produces
    if (metadata.consumes && metadata.produces) {
      console.log(`✓ ${agentName} already has I/O metadata`);
      return;
    }
    
    // Add consumes/produces
    metadata.consumes = io.consumes;
    metadata.produces = io.produces;
    
    // Write back
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
    console.log(`✓ Updated ${agentName} with I/O metadata`);
  } catch (error) {
    console.error(`✗ Error updating ${agentName}: ${error.message}`);
  }
});

console.log('\nAgent I/O metadata update complete!');