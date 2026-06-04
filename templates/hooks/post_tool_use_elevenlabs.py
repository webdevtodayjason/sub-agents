#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
#     "openai",
# ]
# ///

import json
import sys
import subprocess
import os
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def get_simple_summary(tool_name, tool_input, tool_response):
    """
    Create a simple summary without LLM first
    """
    if tool_name == "Task":
        # Extract task description
        task_desc = ""
        if "prompt" in tool_input:
            task_desc = tool_input['prompt']
        elif "description" in tool_input:
            task_desc = tool_input['description']
        
        # Extract agent name if present
        if ':' in task_desc:
            parts = task_desc.split(':', 1)
            agent_name = parts[0].strip()
            task_detail = parts[1].strip() if len(parts) > 1 else ""
            # Shorten task detail
            if len(task_detail) > 30:
                task_detail = task_detail[:30] + "..."
            return f"{agent_name} completed {task_detail}"
        return "Agent task completed"
    
    elif tool_name == "Write":
        file_path = tool_input.get("file_path", "")
        if file_path:
            file_name = Path(file_path).name
            return f"Created {file_name}"
        return "File created"
    
    elif tool_name in ["Edit", "MultiEdit"]:
        file_path = tool_input.get("file_path", "")
        if file_path:
            file_name = Path(file_path).name
            return f"Updated {file_name}"
        return "File updated"
    
    return f"{tool_name} completed"

def get_ai_summary(tool_name, tool_input, tool_response):
    """
    Use OpenAI to create a better summary
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Build context
        context = f"Tool: {tool_name}\n"
        
        if tool_name == "Task":
            task_desc = tool_input.get("prompt", tool_input.get("description", ""))
            context += f"Task: {task_desc}\n"
            if tool_response and "output" in tool_response:
                # Truncate output if too long
                output = str(tool_response["output"])[:200]
                context += f"Result: {output}\n"
        
        elif tool_name == "Write":
            file_path = tool_input.get("file_path", "")
            context += f"File: {file_path}\n"
            context += "Action: Created new file\n"
        
        elif tool_name in ["Edit", "MultiEdit"]:
            file_path = tool_input.get("file_path", "")
            context += f"File: {file_path}\n"
            context += "Action: Modified existing file\n"
        
        prompt = f"""Create a 3-7 word summary of this tool completion for voice announcement.
Be specific about what was accomplished.

{context}

Examples of good summaries:
- "Created user authentication module"
- "Updated API endpoints"
- "Documentation generator built"
- "Fixed validation errors"
- "Database schema created"

Summary:"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=20,
            temperature=0.7,
        )
        
        summary = response.choices[0].message.content.strip()
        # Remove quotes if present
        summary = summary.strip('"').strip("'")
        return summary
        
    except Exception as e:
        print(f"AI summary error: {e}", file=sys.stderr)
        return None

def announce_with_tts(summary):
    """
    Try ElevenLabs first, then fall back to local TTS
    """
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"
    
    # Try ElevenLabs first
    if os.getenv('ELEVENLABS_API_KEY'):
        elevenlabs_script = tts_dir / "elevenlabs_tts.py"
        if elevenlabs_script.exists():
            result = subprocess.run(
                ["uv", "run", str(elevenlabs_script), summary],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return "elevenlabs"
            else:
                print(f"ElevenLabs error: {result.stderr}", file=sys.stderr)
    
    # Fall back to local TTS
    try:
        subprocess.run(["say", summary], capture_output=True)
        return "local"
    except:
        return "none"

def main():
    try:
        # Read input
        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})
        
        # Skip certain tools
        if tool_name in ["TodoWrite", "Grep", "LS", "Bash", "Read", "Glob"]:
            sys.exit(0)
        
        # Try AI summary first, fall back to simple summary
        summary = get_ai_summary(tool_name, tool_input, tool_response)
        if not summary:
            summary = get_simple_summary(tool_name, tool_input, tool_response)
        
        # Announce with TTS (ElevenLabs or local)
        tts_method = announce_with_tts(summary)
        
        # Log what we announced
        log_dir = os.path.join(os.getcwd(), "logs")
        if os.path.exists(log_dir):
            log_path = os.path.join(log_dir, "voice_announcements.json")
            logs = []
            if os.path.exists(log_path):
                try:
                    with open(log_path, 'r') as f:
                        logs = json.load(f)
                except:
                    logs = []
            
            logs.append({
                "timestamp": datetime.now().isoformat(),
                "tool": tool_name,
                "summary": summary,
                "ai_generated": bool(get_ai_summary(tool_name, tool_input, tool_response)),
                "tts_method": tts_method
            })
            
            # Keep last 50
            logs = logs[-50:]
            
            with open(log_path, 'w') as f:
                json.dump(logs, f, indent=2)
        
        print(f"Announced via {tts_method}: {summary}")
        sys.exit(0)
        
    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(0)

if __name__ == "__main__":
    main()