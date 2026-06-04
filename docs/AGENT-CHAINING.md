# Agent Chaining System

The claude-agents chaining system enables powerful workflows by allowing agents to pass data to each other while preserving context windows.

## Overview

Agent chaining allows you to:
- Run multiple agents in sequence
- Pass outputs from one agent as inputs to another
- Execute agents concurrently when appropriate
- Keep orchestrator context clean

## How It Works

1. **Memory-Based Handoffs**: Agents communicate through the memory system
2. **Lightweight Data**: Only essential data is passed between agents
3. **Type Matching**: Agent outputs are matched to inputs by type
4. **Context Preservation**: Each agent runs in isolation

## Using Agent Chains

### Ad-Hoc Chaining

Run agents sequentially with custom tasks:

```bash
# Simple sequential chain
claude-agents chain api-developer frontend-developer --task "Build user auth"

# With individual tasks
claude-agents chain debugger api-developer test-runner \
  --tasks "Find login bug" "Fix the issue" "Verify fix"

# With voice announcements
claude-agents chain code-reviewer refactor --voice
```

### Predefined Chains

Use pre-built chain templates:

```bash
# Run a predefined chain
claude-agents chain feature-development

# Available chains:
- feature-development  # Full development pipeline
- bug-fix             # Debug and fix issues
- api-optimization    # Performance improvements
- security-audit      # Security scanning and fixes
```

### Creating Custom Chains

Save chains in `.claude/chains/my-chain.json`:

```json
{
  "name": "my-custom-chain",
  "description": "Description of what this chain does",
  "steps": [
    {
      "agent": "project-planner",
      "task": "Plan the implementation",
      "outputs": ["technical-plan"]
    },
    {
      "agent": "api-developer",
      "task": "Build according to plan",
      "inputs": ["technical-plan"],
      "outputs": ["api-implementation"]
    }
  ]
}
```

## Agent Input/Output Types

Each agent declares what it consumes and produces:

| Agent | Consumes | Produces |
|-------|----------|----------|
| project-planner | requirements, user-stories | technical-plan, task-breakdown |
| api-developer | technical-plan, bug-report | api-implementation, endpoints |
| frontend-developer | endpoints, user-stories | ui-implementation, ui-components |
| test-runner | test-suite, codebase | test-results, failing-tests |
| code-reviewer | code-changes, implementation | review-report, improvement-list |
| debugger | error-report, failing-tests | root-cause, fix-strategy |

## Concurrent Execution

Run agents in parallel when they don't depend on each other:

```json
{
  "steps": [
    {
      "agent": "code-reviewer",
      "task": "Review code",
      "concurrent": true
    },
    {
      "agent": "security-scanner",
      "task": "Scan for vulnerabilities",
      "concurrent": true
    },
    {
      "agent": "test-runner",
      "task": "Run tests",
      "concurrent": true
    }
  ]
}
```

## Best Practices

1. **Keep Handoffs Small**: Pass only essential data
2. **Use Type Matching**: Ensure outputs match expected inputs
3. **Clear Task Descriptions**: Be specific about what each agent should do
4. **Test Chains**: Verify chains work before saving them
5. **Monitor Memory**: Check handoffs with `memory.keys("handoff:*:*:*")`

## Example: Feature Development

```bash
# 1. Create user stories
claude-agents run product-manager --task "Define checkout feature"

# 2. Plan implementation
claude-agents run project-planner --task "Plan checkout implementation"

# 3. Or use the chain
claude-agents chain feature-development --task "checkout feature"
```

The chain will:
1. Product manager creates user stories
2. Project planner creates technical plan
3. TDD specialist writes tests
4. API developer implements backend
5. Frontend developer builds UI
6. Test runner verifies everything
7. Code reviewer ensures quality

## Meta-Agent Integration

When you need a specialized agent that doesn't exist:

```bash
# The meta-agent can create new agents on demand
claude-agents chain meta-agent api-developer \
  --tasks "Create a GraphQL specialist agent" "Use it to build GraphQL API"
```

## Viewing Handoffs

Check what data is being passed:

```bash
# In your project
node -e "
const memory = require('./node_modules/@webdevtoday/claude-agents/src/memory').getMemoryStore();
console.log(memory.keys('handoff:*:*:*'));
"
```

## Troubleshooting

- **Missing inputs**: Check agent metadata for required inputs
- **Large context**: Reduce data in handoffs
- **Chain fails**: Run agents individually to debug
- **No handoff**: Verify agent produces expected output type

## Advanced Usage

### Dynamic Chains

Create chains based on conditions:

```javascript
// In your code
import { chainCommand } from '@webdevtoday/claude-agents';

const agents = condition ? ['debugger', 'api-developer'] : ['code-reviewer', 'refactor'];
await chainCommand(agents, { task: 'Handle based on condition' });
```

### Custom Handoff Logic

Agents can implement custom handoff logic:

```javascript
// In agent implementation
if (produces.includes('api-endpoints')) {
  createHandoff(agentName, 'frontend-developer', 'endpoints', {
    paths: ['/api/users', '/api/products'],
    methods: ['GET', 'POST']
  }, 'Created 2 REST endpoints');
}
```

The chaining system enables powerful multi-agent workflows while keeping each agent focused and the orchestrator's context clean!