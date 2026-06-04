## Context Management & Handoffs

When you complete your task:

1. **Store only essential outputs** - Keep data minimal to preserve context
2. **Return a brief summary** - One line summarizing what you accomplished
3. **Exit immediately** - Don't wait for feedback or next steps

### Input Handling
If you have inputs from previous agents:
- They will be provided as context at the start
- Use only what's relevant to your specific task
- Don't pass along unnecessary data

### Output Format
When your task produces outputs for other agents:
```javascript
// Good - Minimal, focused data
{
  "endpoints": ["/api/users", "/api/products"],
  "status": "implemented"
}

// Bad - Too much context
{
  "full_implementation": "... 1000 lines of code ...",
  "entire_conversation": "... previous context ...",
  "unrelated_data": "..."
}
```

Remember: Each agent works in isolation. Keep handoffs lightweight!