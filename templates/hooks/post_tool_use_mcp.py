#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import json
import os
import sys
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def get_tool_summary(tool_name, tool_input, tool_response):
    """
    Create a concise summary of what the tool did.
    """
    # Build context about what happened
    if tool_name == "Task":
        # For Task tool, extract agent and task info
        task_desc = ""
        if "prompt" in tool_input:
            task_desc = tool_input['prompt']
        elif "description" in tool_input:
            task_desc = tool_input['description']
        elif "task" in tool_input:
            task_desc = tool_input['task']
        
        # Extract agent name if present
        if ':' in task_desc:
            agent_name = task_desc.split(':')[0].strip()
            return f"{agent_name} completed task"
        elif '(' in task_desc:
            agent_name = task_desc.split('(')[0].strip()
            return f"{agent_name} finished"
        else:
            return "Agent task complete"
    
    elif tool_name == "Write":
        file_path = tool_input.get("file_path", "file")
        file_name = Path(file_path).name
        return f"{file_name} written"
    
    elif tool_name in ["Edit", "MultiEdit"]:
        file_path = tool_input.get("file_path", "file")
        file_name = Path(file_path).name
        return f"{file_name} updated"
    
    elif tool_name == "TodoWrite":
        return "Todos updated"
    
    else:
        return f"{tool_name} complete"


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract tool information
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})
        
        # Skip certain tools that shouldn't trigger announcements
        skip_tools = ["TodoWrite", "Grep", "LS", "Bash", "Read", "Glob", "WebSearch", "WebFetch"]
        if tool_name in skip_tools:
            sys.exit(0)
        
        # Get summary of what was done
        summary = get_tool_summary(tool_name, tool_input, tool_response)
        
        # Since we're in Claude Code with MCP, we can suggest using the work-completion-summary agent
        # But hooks can't directly call MCP tools, so we'll just log for now
        
        # Log for debugging
        log_dir = os.path.join(os.getcwd(), "logs")
        if os.path.exists(log_dir):
            log_path = os.path.join(log_dir, "post_tool_use.json")
            try:
                logs = []
                if os.path.exists(log_path):
                    with open(log_path, 'r') as f:
                        logs = json.load(f)
                
                logs.append({
                    "timestamp": datetime.now().isoformat(),
                    "tool": tool_name,
                    "summary": summary,
                    "note": "Voice announcement via work-completion-summary agent"
                })
                
                # Keep last 100 entries
                logs = logs[-100:]
                
                with open(log_path, 'w') as f:
                    json.dump(logs, f, indent=2)
            except:
                pass
        
        # Output message to transcript suggesting agent use
        print(f"✓ {summary}")
        
        sys.exit(0)
        
    except Exception:
        # Fail silently
        sys.exit(0)


if __name__ == "__main__":
    main()