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
    Priority order: ElevenLabs > OpenAI > pyttsx3
    """
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"
    
    # Check for ElevenLabs (highest priority for quality)
    if os.getenv('ELEVENLABS_API_KEY'):
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


def get_notification_message(message):
    """
    Convert notification message to a more natural spoken version.
    """
    # Common notification transformations
    if "permission" in message.lower():
        # Extract tool name if present
        if "to use" in message.lower():
            parts = message.split("to use")
            if len(parts) > 1:
                tool_name = parts[1].strip().rstrip('.')
                return f"Permission needed for {tool_name}"
        return "Claude needs your permission"
    
    elif "waiting for your input" in message.lower():
        return "Claude is waiting for you"
    
    elif "idle" in message.lower():
        return "Claude is ready for your input"
    
    # Default: use the message as-is but make it more concise
    # Remove "Claude" from beginning if present
    if message.startswith("Claude "):
        message = message[7:]
    
    # Truncate very long messages
    if len(message) > 50:
        message = message[:47] + "..."
    
    return message


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract notification message
        message = input_data.get("message", "")
        
        if not message:
            sys.exit(0)
        
        # Get TTS script
        tts_script = get_tts_script_path()
        if not tts_script:
            sys.exit(0)  # No TTS available
        
        # Convert to natural speech
        spoken_message = get_notification_message(message)
        
        # Announce via TTS
        subprocess.run([
            "uv", "run", tts_script, spoken_message
        ], 
        capture_output=True,  # Suppress output
        timeout=10
        )
        
        # Optional: Also use system notification if available
        try:
            # Try notify-send on Linux
            subprocess.run([
                "notify-send", "-a", "Claude Code", "Claude Code", message
            ], capture_output=True, timeout=2)
        except:
            try:
                # Try osascript on macOS
                subprocess.run([
                    "osascript", "-e", 
                    f'display notification "{message}" with title "Claude Code"'
                ], capture_output=True, timeout=2)
            except:
                pass  # No system notification available
        
        # Log for debugging (optional)
        log_dir = os.path.join(os.getcwd(), "logs")
        if os.path.exists(log_dir):
            log_path = os.path.join(log_dir, "notifications.json")
            try:
                logs = []
                if os.path.exists(log_path):
                    with open(log_path, 'r') as f:
                        logs = json.load(f)
                
                logs.append({
                    "timestamp": datetime.now().isoformat(),
                    "message": message,
                    "spoken": spoken_message
                })
                
                # Keep last 50 entries
                logs = logs[-50:]
                
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