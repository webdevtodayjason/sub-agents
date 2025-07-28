---
name: implementation-status
description: Show current implementation progress and next steps for context-forge projects
category: context
---

# Implementation Status: $ARGUMENTS

## Objective
Display comprehensive status of a context-forge project's implementation, including stage progress, completed tasks, and recommended next actions.

## Information Gathering

1. **Read Implementation Plan**
   ```javascript
   const plan = readFile('Docs/Implementation.md');
   const stages = parseStages(plan);
   ```

2. **Check Memory State**
   ```javascript
   const progress = memory.getImplementationProgress();
   const recentActions = memory.getRecentAgentActions(5);
   const prpStates = memory.getAvailablePRPs().map(prp => ({
     name: prp.name,
     state: memory.getPRPState(prp.filename)
   }));
   ```

3. **Analyze Task Completion**
   - Count checked vs unchecked boxes per stage
   - Calculate overall progress percentage
   - Identify blocking tasks
   - Find available PRPs for remaining tasks

## Output Format

```
📊 Context-Forge Implementation Status

🏗️ Project: [Project Name from CLAUDE.md]
📅 Started: [Date if available]
⏱️ Estimated Completion: [Based on progress rate]

📈 Overall Progress: ██████████░░░░░░ 67%

📋 Stage Breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stage 1: Foundation & Setup ✅ Complete (7/7 tasks)
  ✅ Initialize project structure
  ✅ Set up development environment
  ✅ Configure build tools
  ✅ Set up testing framework
  ✅ Initialize version control
  ✅ Create CI/CD pipeline
  ✅ Set up documentation structure

Stage 2: Core Features 🔄 In Progress (4/8 tasks - 50%)
  ✅ Design database schema
  ✅ Implement user model
  ✅ Create authentication system
  ✅ Build API endpoints
  ⏳ Add input validation ← Current
  ⏸️ Implement rate limiting
  ⏸️ Create admin panel
  ⏸️ Add logging system

Stage 3: Advanced Features ⏸️ Pending (0/6 tasks)
  ⏸️ Real-time notifications
  ⏸️ File upload system
  ⏸️ Search functionality
  ⏸️ Analytics dashboard
  ⏸️ Export features
  ⏸️ Third-party integrations

Stage 4: Polish & Optimization ⏸️ Pending (0/5 tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Available PRPs:
- ✅ user-authentication-prp.md (executed)
- ✅ api-endpoints-prp.md (executed)  
- 📄 input-validation-prp.md (ready)
- 📄 rate-limiting-prp.md (ready)

🕐 Recent Activity:
- 2 hours ago: api-developer completed "Build API endpoints"
- 4 hours ago: tdd-specialist added tests for authentication
- Yesterday: security-scanner validated auth implementation

⚡ Recommended Actions:
1. Continue current task: /continue-implementation
2. Execute validation PRP: /prp-execute input-validation-prp
3. Run test suite: /test
4. Check for blockers: /check-dependencies

🚀 Quick Commands:
- Resume work: claude-agents run api-developer --task "Add input validation"
- View specific stage: /stage-details 2
- Update progress: /mark-complete "Add input validation"

⏱️ Time Estimates:
- Current stage completion: ~2 days
- Total project completion: ~1 week
- At current pace: 2.5 tasks/day
```

## Advanced Features

### Velocity Tracking
```javascript
// Calculate development velocity
const completedToday = recentActions.filter(a => 
  isToday(a.timestamp) && a.action === 'task-completed'
).length;

const avgVelocity = calculateAverageVelocity(recentActions);
```

### Blocker Detection
- Identify tasks with failed validation
- Find missing dependencies
- Highlight tasks without clear ownership

### PRP Matching
- Suggest PRPs for upcoming tasks
- Show PRP execution status
- Recommend validation commands

## Integration Options

### Export Status
```bash
# Generate status report
/implementation-status --export markdown > status.md

# Share with team
/implementation-status --format slack
```

### Dashboard Integration
```javascript
// Send to dashboard
memory.set('dashboard:implementation-status', {
  overall: overallProgress,
  stages: stageProgress,
  velocity: avgVelocity,
  blockers: identifiedBlockers
});
```