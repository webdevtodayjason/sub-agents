---
name: prp-execute  
description: Execute a PRP with context-forge awareness and validation gates
category: PRPs
---

# Execute PRP: $ARGUMENTS

## Objective
Execute a Product Requirement Prompt (PRP) from a context-forge project, following its implementation blueprint and validation gates.

## Pre-Execution Checks

1. **Verify Context-Forge Project**
   ```javascript
   if (!memory.isContextForgeProject()) {
     // This is not a context-forge project
     // Suggest using standard implementation approach
   }
   ```

2. **Locate PRP**
   - Check `PRPs/` directory for the specified PRP
   - If no specific PRP named, list available PRPs
   - Read the complete PRP file

3. **Analyze PRP Structure**
   - Extract goal and success criteria
   - Identify implementation blueprint steps
   - Note validation gates (Level 1-4)
   - Check for required documentation links

## Execution Process

### 1. Pre-Implementation
- Read all referenced documentation from PRP
- Check current implementation progress
- Identify dependencies and prerequisites
- Determine which agents to use

### 2. Implementation
Follow the PRP blueprint exactly:

```yaml
For each step in blueprint:
  1. Read step requirements
  2. Check if already completed
  3. Implement using appropriate agent
  4. Run validation for that step
  5. Only proceed if validation passes
```

### 3. Validation Gates

**Level 1: Syntax & Style**
```bash
# Run linting/formatting checks
[Execute commands from PRP Level 1]
# Fix any issues before proceeding
```

**Level 2: Unit Tests**
```bash
# Run unit tests
[Execute commands from PRP Level 2]
# All tests must pass
```

**Level 3: Integration Tests**
```bash
# Run integration tests
[Execute commands from PRP Level 3]
# Verify end-to-end functionality
```

**Level 4: Deployment/Advanced**
```bash
# Run final validation
[Execute commands from PRP Level 4]
```

### 4. Progress Tracking

Update memory after each step:
```javascript
memory.updatePRPState(prpFilename, {
  executed: true,
  currentStep: stepNumber,
  validationPassed: level,
  lastUpdated: Date.now()
});
```

## Success Criteria Verification

Before marking complete:
- [ ] All blueprint steps executed
- [ ] All validation gates passed
- [ ] Success criteria checkboxes can be checked
- [ ] No failing tests
- [ ] Code follows project conventions

## Output Format

```
🎯 PRP Execution: [PRP Name]

📋 Progress:
✅ Step 1: [Description] - Complete
✅ Step 2: [Description] - Complete  
🔄 Step 3: [Description] - In Progress
⏸️ Step 4: [Description] - Pending

✅ Validation Status:
- Level 1 (Syntax): ✅ Passed
- Level 2 (Tests): ✅ Passed
- Level 3 (Integration): 🔄 Running
- Level 4 (Advanced): ⏸️ Pending

📊 Success Criteria:
- [x] Criteria 1
- [x] Criteria 2
- [ ] Criteria 3 (in progress)

💡 Next Actions:
1. Complete Step 3 implementation
2. Run integration tests
3. Update documentation
```

## Error Handling

If validation fails:
1. Read the error carefully
2. Use appropriate agent to fix (debugger, test-runner)
3. Re-run validation
4. Only proceed when passing

## Integration with Agents

Coordinate with specialized agents:
- `api-developer` for API implementation
- `tdd-specialist` for test creation
- `debugger` for fixing validation failures
- `doc-writer` for documentation updates