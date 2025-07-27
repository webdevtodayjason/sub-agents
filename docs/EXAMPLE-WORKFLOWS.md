# Claude Sub-Agents Example Workflows

This guide demonstrates common development workflows using Claude Sub-Agents to maximize productivity.

## 🚀 Quick Start Workflow

### 1. Initial Setup
```bash
# Install all agents
claude-agents install --all

# Verify installation
claude-agents list --installed
```

### 2. Basic Usage in Claude Code
```bash
# Review code changes
> /review

# Run tests
> /test

# Debug an error
> /debug TypeError: Cannot read property 'map' of undefined
```

## 🏗️ Full Stack Application Development

### Workflow: Building an E-Commerce Platform

#### Step 1: Project Planning
```bash
# In Claude Code
> /plan e-commerce platform with user accounts, product catalog, shopping cart, and payment processing

# Or run independently
claude-agents run project-planner --task "Design e-commerce platform architecture"
```

#### Step 2: Concurrent Development (Maximum Performance)
```bash
# In Claude Code - Execute all agents simultaneously
> Please help me implement the e-commerce platform. Use the following agents concurrently:
> - /api user authentication endpoints
> - /api product CRUD operations  
> - /frontend product listing page
> - /frontend shopping cart component
> - /tdd authentication service tests
```

#### Step 3: Quality Assurance
```bash
# Run all quality checks in parallel
> Run these quality checks:
> - /review
> - /test
> - /security-scan
```

#### Step 4: Documentation
```bash
# Generate comprehensive documentation
> /apidoc REST endpoints
> /document architecture
```

#### Step 5: Deployment
```bash
# Set up deployment pipeline
> /devops GitHub Actions CI/CD pipeline
```

## 🐛 Debugging Workflow

### Scenario: Production Error Investigation

```bash
# 1. Analyze the error
> /debug Error: Connection timeout in payment service

# 2. Review related code
> /review src/services/payment.js

# 3. Fix and test
> [Make fixes based on agent suggestions]
> /test src/services/payment.test.js

# 4. Ensure no regressions
> /test
```

## 🔄 Refactoring Workflow

### Scenario: Modernizing Legacy Code

```bash
# 1. Plan the refactoring
> /plan refactor legacy authentication system to use JWT

# 2. Analyze current implementation
> /review src/auth/
> /security-scan src/auth/

# 3. Implement refactoring with tests
> Refactor the authentication system:
> - /refactor apply modern patterns to src/auth/
> - /tdd JWT authentication tests
> - /api-developer implement JWT endpoints

# 4. Update documentation
> /apidoc authentication endpoints
```

## 🎨 UI Development Workflow

### Scenario: Building a Dashboard

```bash
# 1. Design the UI
> /ui create admin dashboard with:
> - Navigation sidebar
> - Statistics cards
> - User management table
> - Charts for analytics

# 2. Implement responsive design
> /shadcn make dashboard mobile-responsive

# 3. Add interactivity
> /frontend add real-time updates to dashboard

# 4. Test the implementation
> /test dashboard components
```

## 🚦 Test-Driven Development Workflow

### Scenario: New Feature Implementation

```bash
# 1. Write tests first
> /tdd create tests for user subscription feature

# 2. Implement the feature
> /api subscription management endpoints
> /frontend subscription UI components

# 3. Ensure tests pass
> /test

# 4. Refactor if needed
> /refactor optimize subscription service
```

## 📊 Performance Optimization Workflow

### Scenario: Improving Application Performance

```bash
# 1. Identify bottlenecks
> /debug analyze performance issues in product search

# 2. Review current implementation
> /review src/search/

# 3. Implement optimizations concurrently
> Optimize the search feature:
> - /refactor implement caching strategy
> - /api add pagination to search endpoint
> - /frontend implement virtual scrolling

# 4. Verify improvements
> /test performance
```

## 🔒 Security Audit Workflow

### Scenario: Pre-Release Security Check

```bash
# 1. Comprehensive security scan
> /security-scan

# 2. Review critical areas
> /review src/auth/
> /review src/api/payment/

# 3. Fix vulnerabilities
> [Apply security fixes]

# 4. Re-scan to verify
> /security-scan src/

# 5. Document security measures
> /document security practices
```

## 🚀 Release Preparation Workflow

### Scenario: Preparing Version 2.0 Release

```bash
# 1. Final quality checks (parallel execution)
> Prepare for release:
> - /review
> - /test
> - /security-scan
> - /document changelog

# 2. Generate release documentation
> /marketing write release announcement for v2.0
> /document API migration guide

# 3. Set up deployment
> /devops create production deployment workflow
```

## 💡 Advanced Patterns

### Pattern 1: Memory-Coordinated Workflow

Agents share discoveries through the memory system:

```bash
# API developer discovers endpoints
> /api analyze existing REST API

# Frontend developer uses discovered endpoints
> /frontend create UI for discovered endpoints

# Documenter uses both discoveries
> /apidoc document all discovered endpoints
```

### Pattern 2: Automated Hook Workflows

Set up hooks for automatic quality checks:

```json
// In agent's hooks.json
{
  "PostToolUse:Edit": {
    "condition": "file.endsWith('.js')",
    "commands": ["npm run lint", "npm test"]
  }
}
```

### Pattern 3: Independent Agent Automation

```bash
# Schedule regular security scans
claude-agents run security-scanner --task "Weekly security audit"

# Generate weekly reports
claude-agents run marketing-writer --task "Write weekly development progress report"

# Automated documentation updates
claude-agents run doc-writer --task "Update API documentation from code changes"
```

## 🎯 Best Practices

1. **Always Use Concurrent Execution**
   - Run multiple agents simultaneously for 2-4x performance improvement
   - Batch related operations in single requests

2. **Leverage Agent Specialization**
   - Use the right agent for each task
   - Combine multiple specialists for complex tasks

3. **Utilize Memory Coordination**
   - Agents automatically share discoveries
   - Build on previous agent outputs

4. **Automate with Hooks**
   - Set up automatic quality checks
   - Create self-maintaining codebases

5. **Monitor with Dashboard**
   ```bash
   # Start the dashboard
   claude-agents dashboard
   ```
   - Track agent performance
   - View task history
   - Monitor memory usage

## 📈 Performance Tips

### Concurrent Execution Examples

#### ❌ Slow (Sequential)
```bash
> /review
> /test
> /document
```

#### ✅ Fast (Concurrent)
```bash
> Please run these concurrently:
> - /review
> - /test
> - /document
```

### Memory Usage

```javascript
// Agents store discoveries
memory.set('api:endpoints:discovered', {
  users: '/api/users',
  products: '/api/products'
});

// Other agents retrieve and use
const endpoints = memory.get('api:endpoints:discovered');
```

## 🔗 Integration Examples

### CI/CD Integration

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: |
          claude-agents run code-reviewer --task "Review PR changes"
          claude-agents run security-scanner --task "Scan PR for vulnerabilities"
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

claude-agents run code-reviewer --task "Review staged changes"
claude-agents run test-runner --task "Run affected tests"
```

## 🎓 Learning Resources

- Run `claude-agents info <agent>` for detailed agent capabilities
- Check `~/.claude/agents/` for agent configurations
- Visit the dashboard at `http://localhost:7842` for real-time monitoring
- Read individual agent documentation in `agents/*/agent.md`

Remember: **Concurrent execution is the key to maximum productivity!**