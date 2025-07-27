# Agent Creation Guide

This guide walks you through creating custom Claude Sub-Agents for your specific needs.

## 🎯 Understanding Agents

### What is an Agent?
An agent is a specialized AI assistant with:
- **Focused expertise** in a specific domain
- **Defined capabilities** and tool access
- **Consistent behavior** through structured prompts
- **Memory coordination** for multi-agent workflows

### Agent Components
```
agents/
└── your-agent/
    ├── agent.md       # Core agent definition and prompt
    ├── metadata.json  # Agent configuration and metadata
    └── hooks.json     # Optional automation hooks
```

## 🚀 Quick Start: Interactive Creation

```bash
claude-agents create
```

This interactive wizard will:
1. Ask for agent name and description
2. Help define capabilities
3. Select appropriate tools
4. Create the agent structure

## 🛠️ Manual Agent Creation

### Step 1: Create Agent Directory

```bash
mkdir -p agents/data-analyst
```

### Step 2: Define Agent Prompt (agent.md)

```markdown
---
name: data-analyst
description: Data analysis and visualization specialist for insights and reporting
tools: Read, Edit, Bash, Grep, Glob
triggers:
  - "analyze data"
  - "create visualization"
  - "generate report"
  - "data insights"
---

# Data Analyst Agent

You are an expert data analyst specializing in extracting insights from data and creating meaningful visualizations.

## Core Capabilities
1. Data exploration and analysis
2. Statistical analysis and modeling
3. Visualization creation (charts, graphs, dashboards)
4. Report generation and insights communication
5. Data cleaning and preprocessing

## Concurrent Execution
ALWAYS maximize performance by executing operations concurrently:
- Load multiple data files simultaneously
- Run analysis operations in parallel
- Generate visualizations concurrently
- Process data transformations in batch

## When Activated
1. Understand the data analysis requirements
2. Identify relevant data sources
3. Plan analysis approach
4. Execute analysis with appropriate tools
5. Create visualizations and reports
6. Store insights in memory for other agents

## Key Principles
- **Data Integrity**: Never modify raw data without explicit permission
- **Statistical Rigor**: Use appropriate statistical methods
- **Clear Communication**: Present findings in accessible language
- **Reproducibility**: Document analysis steps clearly
- **Performance**: Use vectorized operations and concurrent processing

## Memory Coordination
Store discoveries for other agents:
```javascript
memory.set('analysis:key-findings', findings);
memory.set('analysis:data-summary', summary);
memory.set('analysis:visualizations', charts);
```

## Example Patterns

### Concurrent Data Loading
```python
# Load multiple files simultaneously
import pandas as pd
import asyncio

async def load_data_files():
    tasks = [
        pd.read_csv('sales.csv'),
        pd.read_csv('customers.csv'),
        pd.read_csv('products.csv')
    ]
    return await asyncio.gather(*tasks)
```

### Parallel Analysis
```python
# Run multiple analyses concurrently
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor() as executor:
    correlation = executor.submit(df.corr)
    summary = executor.submit(df.describe)
    grouping = executor.submit(df.groupby('category').agg)
```
```

### Step 3: Create Metadata (metadata.json)

```json
{
  "name": "data-analyst",
  "version": "1.0.0",
  "description": "Data analysis and visualization specialist for insights and reporting",
  "author": "Your Name",
  "tags": [
    "data",
    "analysis",
    "visualization",
    "reporting",
    "statistics"
  ],
  "capabilities": [
    "Data exploration and profiling",
    "Statistical analysis",
    "Data visualization",
    "Report generation",
    "Predictive modeling"
  ],
  "tools": [
    "Read",
    "Edit",
    "Bash",
    "Grep",
    "Glob"
  ],
  "triggers": [
    "analyze data",
    "create visualization",
    "generate report",
    "statistical analysis",
    "data insights"
  ],
  "examples": [
    "Analyze sales data and identify trends",
    "Create dashboard for monthly metrics",
    "Generate executive summary report",
    "Find correlations in customer behavior"
  ],
  "configuration": {
    "defaultOutputFormat": "markdown",
    "preferredVisualizationTool": "matplotlib",
    "maxConcurrentOperations": 5
  }
}
```

### Step 4: Add Hooks (hooks.json) - Optional

```json
{
  "PostToolUse:Edit": {
    "condition": "file.endsWith('.py') && file.includes('analysis')",
    "commands": ["python -m py_compile {{file}}"]
  },
  "TaskComplete": {
    "store": "agent:data-analyst:last-analysis",
    "notify": "Analysis complete: {{task_name}}"
  },
  "MemoryUpdate": {
    "pattern": "analysis:*",
    "notify": "New analysis results available in memory"
  }
}
```

### Step 5: Create Slash Command

```bash
mkdir -p commands
cat > commands/analyze.md << 'EOF'
Request: claude-agents run data-analyst --task "{{args}}"
Description: Run data analysis on specified data
Example: /analyze sales trends for Q4
EOF
```

## 📋 Agent Best Practices

### 1. Focused Expertise
```markdown
# ❌ Too Broad
You are an AI assistant that helps with various tasks.

# ✅ Focused
You are a database optimization specialist focusing on SQL query performance and index optimization.
```

### 2. Clear Activation Triggers
```json
"triggers": [
  "optimize database",
  "improve query performance",
  "analyze slow queries",
  "create indexes"
]
```

### 3. Structured Workflow
```markdown
## When Activated
1. **Analyze** the current situation
2. **Plan** the approach
3. **Execute** with concurrent operations
4. **Verify** the results
5. **Document** the changes
6. **Store** findings in memory
```

### 4. Memory Coordination
```markdown
## Memory Patterns
- Store discoveries: `memory.set('agent:findings', data)`
- Share with others: `memory.set('shared:resource', info)`
- Read from others: `memory.get('other-agent:data')`
```

### 5. Performance Focus
```markdown
## Concurrent Execution
- Always batch file operations
- Run independent tasks in parallel
- Use async/await patterns
- Minimize sequential operations
```

## 🎨 Advanced Agent Patterns

### Pattern 1: Multi-Tool Specialist
```json
{
  "tools": [
    "Read", "Edit", "MultiEdit",
    "Bash", "Grep", "Glob",
    "WebSearch", "WebFetch"
  ],
  "capabilities": [
    "Code analysis",
    "Web research",
    "System automation"
  ]
}
```

### Pattern 2: Workflow Orchestrator
```markdown
## Orchestration Role
Coordinate multiple agents for complex tasks:

1. Break down requirements
2. Assign to specialist agents
3. Monitor progress via memory
4. Aggregate results
5. Present unified output
```

### Pattern 3: Quality Gate Agent
```json
{
  "hooks": {
    "PreMerge": {
      "validate": [
        "All tests pass",
        "Code coverage > 80%",
        "No security vulnerabilities"
      ]
    }
  }
}
```

## 🔧 Testing Your Agent

### 1. Installation Test
```bash
# Install locally
claude-agents install your-agent --project

# Verify installation
claude-agents list --installed
```

### 2. Functionality Test
```bash
# Test via slash command
> /your-command test input

# Test independently
claude-agents run your-agent --task "test task"
```

### 3. Memory Coordination Test
```javascript
// Test memory storage
memory.set('test:key', { data: 'value' });

// Verify from another agent
const data = memory.get('test:key');
```

## 🌟 Example: Custom Security Agent

### Complete Implementation

```markdown
# agents/dependency-scanner/agent.md
---
name: dependency-scanner
description: Scans and audits project dependencies for vulnerabilities
tools: Read, Bash, Grep, WebSearch
---

# Dependency Security Scanner

You are a security specialist focused on dependency vulnerability scanning.

## When Activated
1. Identify package manager files (package.json, requirements.txt, etc.)
2. Run security audits concurrently
3. Research CVEs for critical vulnerabilities
4. Generate security report
5. Store findings in memory

## Concurrent Operations
- Scan multiple package files simultaneously
- Run different audit tools in parallel
- Batch CVE lookups
```

```json
# agents/dependency-scanner/metadata.json
{
  "name": "dependency-scanner",
  "version": "1.0.0",
  "description": "Security scanner for project dependencies",
  "tools": ["Read", "Bash", "Grep", "WebSearch"],
  "capabilities": [
    "npm audit",
    "pip check",
    "CVE research",
    "Security reporting"
  ]
}
```

## 📦 Packaging and Sharing

### 1. Package Your Agent
```bash
# Create tarball
tar -czf my-agent.tar.gz agents/my-agent/

# Or create git repository
cd agents/my-agent
git init
git add .
git commit -m "Initial agent implementation"
```

### 2. Share with Team
```bash
# Install from tarball
claude-agents install ./my-agent.tar.gz

# Install from git
claude-agents install https://github.com/user/my-agent.git
```

## 🚨 Common Pitfalls

### 1. Overly Complex Prompts
- Keep prompts focused and clear
- Avoid contradictory instructions
- Test with edge cases

### 2. Missing Concurrent Patterns
- Always include parallel execution guidance
- Provide specific examples
- Test performance improvements

### 3. Poor Memory Coordination
- Use consistent key patterns
- Document what's stored
- Clean up old entries

### 4. Inadequate Error Handling
- Anticipate common failures
- Provide fallback strategies
- Log errors appropriately

## 📚 Resources

- Example agents in `agents/` directory
- Test your agents with `npm test`
- Monitor performance in dashboard
- Join community discussions

Remember: The best agents are focused, fast, and collaborative!