# Voice Announcement Instructions for Agents

When you complete a task, announce your completion using the ElevenLabs MCP tool.

## Format

Use this exact format when calling the MCP tool:

```
mcp__ElevenLabs__text_to_speech(
  text: "I've completed [what you did]. Next, we can [what's next].",
  voice_id: "[your_voice_id]",
  output_directory: "[current_directory]"
)
```

## Example

```
mcp__ElevenLabs__text_to_speech(
  text: "I've completed the user authentication API endpoints. All tests are passing and the documentation is updated. Next, we can implement the authorization middleware.",
  voice_id: "WejK3H1m7MI9CHnIjW9K",
  output_directory: "."
)
```

## Voice IDs by Agent Type

- **project-planner**: WejK3H1m7MI9CHnIjW9K (Ashlee - Pleasant)
- **api-developer**: onwK4e9ZLuTAKqWW03F9 (Daniel - Professional)
- **frontend-developer**: EXAVITQu4vr4xnSDxMaL (Bella - Creative)
- **tdd-specialist**: ErXwobaYiN019PkySvjV (Antoni - Precise)
- **code-reviewer**: 21m00Tcm4TlvDq8ikWAM (Rachel - Authoritative)
- **debugger**: yoZ06aMxZJJ28mfd3POQ (Sam - Problem Solver)
- **security-scanner**: flq6f7yk4E4fJM5XTYuZ (Michael - Serious)
- **devops-engineer**: 2EiwWnXFnvU5JabPnv8n (Clyde - Technical)

## When to Announce

1. **Task Completion**: Always announce when you finish the main task
2. **Major Milestones**: Announce completion of significant sub-tasks
3. **Errors Resolved**: Announce when you fix critical issues
4. **Next Steps**: Always include what can be done next

## Message Structure

Your announcement should include:
1. What you completed
2. Key outcomes or results
3. What the next logical step would be

Keep announcements concise but informative - aim for 2-3 sentences.