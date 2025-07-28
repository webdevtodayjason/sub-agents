---
name: continue-implementation
description: Continue with the next task in a context-forge implementation plan
category: implementation
---

# Continue Implementation: $ARGUMENTS

## Objective
Continue working on the current stage of a context-forge project's implementation plan, automatically selecting the next appropriate task.

## Process

### 1. Check Current Progress
```javascript
// Get implementation status from memory
const progress = memory.getImplementationProgress();
const currentStage = progress?.currentStage || 1;

// Read Docs/Implementation.md
const implementationPlan = readFile('Docs/Implementation.md');
```

### 2. Identify Next Task
Scan current stage for uncompleted tasks:
- Look for unchecked boxes: `- [ ]`
- Consider task dependencies
- Check if PRPs exist for the task

### 3. Task Execution Strategy

**If PRP exists for task**:
```bash
# Use the PRP for guided implementation
/prp-execute [relevant-prp-name]
```

**If no PRP exists**:
```bash
# Use appropriate agent based on task type
claude-agents run [agent-name] --task "[task description]"
```

### 4. Agent Selection Logic

Based on task keywords:
- **API/endpoint/backend** → api-developer
- **test/testing/TDD** → tdd-specialist  
- **UI/frontend/component** → frontend-developer
- **database/migration/schema** → api-developer
- **documentation** → doc-writer
- **security/auth** → security-scanner
- **bug/fix/error** → debugger

### 5. Progress Update

After task completion:
```javascript
// Update stage progress
memory.updateStageProgress(stageNumber, completedTasks + 1);

// Track action
memory.trackAgentAction('continue-implementation', 'task-completed', {
  stage: stageNumber,
  task: taskDescription,
  agent: agentUsed
});
```

## Output Format

```
📋 Implementation Progress

Current Stage: Stage [X] - [Stage Name]
Progress: [X/Y] tasks completed ([percentage]%)

🎯 Next Task:
"[Task description from Implementation.md]"

🤖 Assigned Agent: [agent-name]
📁 Related PRP: [prp-name] (if exists)

Executing...
[Show task execution output]

✅ Task Complete!

📊 Updated Progress:
Stage [X]: [X+1/Y] tasks ([new percentage]%)

💡 Next Steps:
- Continue with: /continue-implementation
- View progress: /implementation-status
- Run tests: /test
```

## Smart Features

### Dependency Detection
- Check if task has prerequisites
- Warn if dependencies not met
- Suggest completing dependencies first

### Validation Integration
- After task completion, run relevant tests
- Use validation commands from PRPs if available
- Only mark complete if tests pass

### Context Preservation
- Maintain project conventions from CLAUDE.md
- Use existing patterns and structures
- Follow tech stack specific approaches

## Error Recovery

If task fails:
1. Capture error details
2. Suggest debugger agent
3. Provide rollback options
4. Save progress before failure

## Memory Coordination

```javascript
// Share task status
memory.set('implementation:current-task', {
  stage: stageNumber,
  task: taskDescription,
  status: 'in-progress',
  startedAt: Date.now()
});

// Update on completion
memory.set('implementation:last-completed', {
  stage: stageNumber,
  task: taskDescription,
  completedAt: Date.now(),
  agent: agentUsed
});
```