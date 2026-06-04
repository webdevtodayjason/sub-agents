#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import json
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def get_tts_script_path():
    """
    Determine which TTS script to use based on available API keys.
    Priority order: ElevenLabs MCP > ElevenLabs > OpenAI > pyttsx3
    """
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"
    
    # Check for ElevenLabs (highest priority for quality)
    if os.getenv('ELEVENLABS_API_KEY'):
        # First try MCP if in Claude Code
        elevenlabs_mcp_script = tts_dir / "elevenlabs_mcp.py"
        if elevenlabs_mcp_script.exists():
            return str(elevenlabs_mcp_script)
            
        # Fallback to direct ElevenLabs
        elevenlabs_script = tts_dir / "elevenlabs_tts.py"
        if elevenlabs_script.exists():
            return str(elevenlabs_script)
    
    # Check for OpenAI API key (second priority)
    if os.getenv('OPENAI_API_KEY'):
        openai_script = tts_dir / "openai_tts.py"
        if openai_script.exists():
            return str(openai_script)
    
    # Fall back to pyttsx3 (no API key required)
    pyttsx3_script = tts_dir / "local_tts.py"
    if pyttsx3_script.exists():
        return str(pyttsx3_script)
    
    return None


def summarize_tool_result(tool_name, tool_input, tool_response):
    """
    Use LLM to create a short summary of what the tool did.
    """
    script_dir = Path(__file__).parent
    llm_dir = script_dir / "utils" / "llm"
    
    # Build context about what happened
    context = f"Tool: {tool_name}\n"
    
    # Add relevant arguments from tool_input
    if tool_name == "Task":
        # For Task tool, check various possible fields
        if "prompt" in tool_input:
            context += f"Task: {tool_input['prompt']}\n"
        elif "description" in tool_input:
            context += f"Task: {tool_input['description']}\n"
        elif "task" in tool_input:
            context += f"Task: {tool_input['task']}\n"
    elif tool_name in ["Write", "Edit", "MultiEdit"]:
        if "file_path" in tool_input:
            context += f"File: {tool_input['file_path']}\n"
    elif tool_name == "Read":
        if "file_path" in tool_input:
            context += f"Read: {tool_input['file_path']}\n"
    
    # Add result info from tool_response if available
    if tool_response:
        if isinstance(tool_response, dict):
            if "success" in tool_response and tool_response["success"]:
                context += f"Result: Completed successfully\n"
            elif "output" in tool_response:
                # For Task tool, output contains the agent's response
                context += f"Result: Agent completed task\n"
            elif "error" in tool_response:
                context += f"Result: Error occurred\n"
    
    # Create prompt for summarization
    prompt = f"""Summarize this tool completion in 5-10 words for a voice announcement.
Focus on WHAT was done, not technical details.
Be conversational and natural.

{context}

Examples of good summaries:
- "Documentation created successfully"
- "API developer finished the endpoints"
- "Tests are now passing"
- "File updated with new changes"
- "Code review completed"

Summary:"""
    
    # Try OpenAI first
    if os.getenv('OPENAI_API_KEY'):
        oai_script = llm_dir / "oai.py"
        if oai_script.exists():
            try:
                result = subprocess.run([
                    "uv", "run", str(oai_script), prompt
                ], 
                capture_output=True,
                text=True,
                timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip()
            except:
                pass
    
    # Try Anthropic as fallback
    if os.getenv('ANTHROPIC_API_KEY'):
        anth_script = llm_dir / "anth.py"
        if anth_script.exists():
            try:
                result = subprocess.run([
                    "uv", "run", str(anth_script), prompt
                ], 
                capture_output=True,
                text=True,
                timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip()
            except:
                pass
    
    # Fallback messages based on tool
    if tool_name == "Task":
        return "Sub-agent completed its task"
    elif tool_name == "Write":
        return "File written successfully"
    elif tool_name == "Edit" or tool_name == "MultiEdit":
        return "File edited successfully"
    else:
        return f"{tool_name} completed"


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract tool information based on documentation
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})
        
        # Skip certain tools that shouldn't trigger announcements
        skip_tools = ["TodoWrite", "Grep", "LS", "Bash", "Read", "Glob"]
        if tool_name in skip_tools:
            sys.exit(0)
        
        # Get TTS script
        tts_script = get_tts_script_path()
        if not tts_script:
            sys.exit(0)  # No TTS available
        
        # Get summary of what was done
        summary = summarize_tool_result(tool_name, tool_input, tool_response)
        
        # Announce via TTS
        subprocess.run([
            "uv", "run", tts_script, summary
        ], 
        capture_output=True,  # Suppress output
        timeout=10
        )
        
        # Log for debugging (optional)
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
                    "summary": summary
                })
                
                # Keep last 100 entries
                logs = logs[-100:]
                
                with open(log_path, 'w') as f:
                    json.dump(logs, f, indent=2)
            except:
                pass
        
        sys.exit(0)
        
    except Exception:
        # Fail silently
        sys.exit(0)


if __name__ == "__main__":
    main()