import { writeFileSync } from 'fs';
import { join } from 'path';

export async function createHookFiles(hooksDir, hooksLlmDir, hooksTtsDir) {
  const files = {};
  
  // Create subagent_stop.py
  files.subagentStop = join(hooksDir, 'subagent_stop.py');
  writeFileSync(files.subagentStop, getSubagentStopScript());
  
  // Create stop.py
  files.stop = join(hooksDir, 'stop.py');
  writeFileSync(files.stop, getStopScript());
  
  // Create LLM utilities
  files.oai = join(hooksLlmDir, 'oai.py');
  writeFileSync(files.oai, getOaiScript());
  
  files.anth = join(hooksLlmDir, 'anth.py');
  writeFileSync(files.anth, getAnthScript());
  
  // Create TTS utilities
  files.elevenlabsMcp = join(hooksTtsDir, 'elevenlabs_mcp.py');
  writeFileSync(files.elevenlabsMcp, getElevenlabsMcpScript());
  
  files.openaiTts = join(hooksTtsDir, 'openai_tts.py');
  writeFileSync(files.openaiTts, getOpenaiTtsScript());
  
  files.localTts = join(hooksTtsDir, 'local_tts.py');
  writeFileSync(files.localTts, getLocalTtsScript());
  
  return files;
}

export function createSettingsTemplate(projectPath = null) {
  // If projectPath is provided, use absolute paths, otherwise use relative
  const hookPath = projectPath ? `${projectPath}/.claude/hooks` : '.claude/hooks';
  
  return JSON.stringify({
    "permissions": {
      "allow": [
        "Bash(mkdir:*)",
        "Bash(uv:*)",
        "Bash(find:*)",
        "Bash(mv:*)",
        "Bash(grep:*)",
        "Bash(npm:*)",
        "Bash(ls:*)",
        "Bash(cp:*)",
        "Write",
        "Edit",
        "Bash(chmod:*)",
        "Bash(touch:*)"
      ],
      "deny": []
    },
    "hooks": {
      "Stop": [
        {
          "matcher": "",
          "hooks": [
            {
              "type": "command",
              "command": `python3 ${hookPath}/stop.py --chat`
            }
          ]
        }
      ],
      "SubagentStop": [
        {
          "matcher": "",
          "hooks": [
            {
              "type": "command",
              "command": `python3 ${hookPath}/subagent_stop.py`
            }
          ]
        }
      ]
    }
  }, null, 2);
}

function getSubagentStopScript() {
  return `#!/usr/bin/env -S uv run --script
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
    Determine which TTS script to use based on available API keys and MCP.
    Priority order: ElevenLabs MCP > OpenAI > local
    """
    # Get current script directory and construct utils/tts path
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"
    
    # Check for ElevenLabs MCP first (highest priority)
    elevenlabs_mcp_script = tts_dir / "elevenlabs_mcp.py"
    if elevenlabs_mcp_script.exists():
        return str(elevenlabs_mcp_script)
    
    # Check for OpenAI API key (second priority)
    if os.getenv('OPENAI_API_KEY'):
        openai_script = tts_dir / "openai_tts.py"
        if openai_script.exists():
            return str(openai_script)
    
    # Fall back to local TTS (no API key required)
    local_script = tts_dir / "local_tts.py"
    if local_script.exists():
        return str(local_script)
    
    return None


def announce_subagent_completion():
    """Announce subagent completion using the best available TTS service."""
    try:
        tts_script = get_tts_script_path()
        if not tts_script:
            return  # No TTS scripts available
        
        # Use fixed message for subagent completion
        completion_message = "Subagent Complete"
        
        # Call the TTS script with the completion message
        subprocess.run([
            "uv", "run", tts_script, completion_message
        ], 
        capture_output=True,  # Suppress output
        timeout=10  # 10-second timeout
        )
        
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        # Fail silently if TTS encounters issues
        pass
    except Exception:
        # Fail silently for any other errors
        pass


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true', help='Copy transcript to chat.json')
        args = parser.parse_args()
        
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract required fields
        session_id = input_data.get("session_id", "")
        stop_hook_active = input_data.get("stop_hook_active", False)

        # Ensure log directory exists
        log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "subagent_stop.json")

        # Read existing log data or initialize empty list
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []
        
        # Append new data
        log_data.append(input_data)
        
        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        # Handle --chat switch (same as stop.py)
        if args.chat and 'transcript_path' in input_data:
            transcript_path = input_data['transcript_path']
            if os.path.exists(transcript_path):
                # Read .jsonl file and convert to JSON array
                chat_data = []
                try:
                    with open(transcript_path, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    chat_data.append(json.loads(line))
                                except json.JSONDecodeError:
                                    pass  # Skip invalid lines
                    
                    # Write to logs/chat.json
                    chat_file = os.path.join(log_dir, 'chat.json')
                    with open(chat_file, 'w') as f:
                        json.dump(chat_data, f, indent=2)
                except Exception:
                    pass  # Fail silently

        # Announce subagent completion via TTS
        announce_subagent_completion()

        sys.exit(0)

    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)


if __name__ == "__main__":
    main()
`;
}

function getStopScript() {
  return `#!/usr/bin/env -S uv run --script
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
import random
import subprocess
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def get_completion_messages():
    """Return list of friendly completion messages."""
    return [
        "Work complete!",
        "All done!",
        "Task finished!",
        "Job complete!",
        "Ready for next task!"
    ]


def get_tts_script_path():
    """
    Determine which TTS script to use based on available API keys and MCP.
    Priority order: ElevenLabs MCP > OpenAI > local
    """
    # Get current script directory and construct utils/tts path
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"
    
    # Check for ElevenLabs MCP first (highest priority)
    elevenlabs_mcp_script = tts_dir / "elevenlabs_mcp.py"
    if elevenlabs_mcp_script.exists():
        return str(elevenlabs_mcp_script)
    
    # Check for OpenAI API key (second priority)
    if os.getenv('OPENAI_API_KEY'):
        openai_script = tts_dir / "openai_tts.py"
        if openai_script.exists():
            return str(openai_script)
    
    # Fall back to local TTS (no API key required)
    local_script = tts_dir / "local_tts.py"
    if local_script.exists():
        return str(local_script)
    
    return None


def get_llm_completion_message():
    """
    Generate completion message using available LLM services.
    Priority order: OpenAI > Anthropic > fallback to random message
    
    Returns:
        str: Generated or fallback completion message
    """
    # Get current script directory and construct utils/llm path
    script_dir = Path(__file__).parent
    llm_dir = script_dir / "utils" / "llm"
    
    # Try OpenAI first (highest priority)
    if os.getenv('OPENAI_API_KEY'):
        oai_script = llm_dir / "oai.py"
        if oai_script.exists():
            try:
                result = subprocess.run([
                    "uv", "run", str(oai_script), "--completion"
                ], 
                capture_output=True,
                text=True,
                timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip()
            except (subprocess.TimeoutExpired, subprocess.SubprocessError):
                pass
    
    # Try Anthropic second
    if os.getenv('ANTHROPIC_API_KEY'):
        anth_script = llm_dir / "anth.py"
        if anth_script.exists():
            try:
                result = subprocess.run([
                    "uv", "run", str(anth_script), "--completion"
                ], 
                capture_output=True,
                text=True,
                timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip()
            except (subprocess.TimeoutExpired, subprocess.SubprocessError):
                pass
    
    # Fallback to random predefined message
    messages = get_completion_messages()
    return random.choice(messages)

def announce_completion():
    """Announce completion using the best available TTS service."""
    try:
        tts_script = get_tts_script_path()
        if not tts_script:
            return  # No TTS scripts available
        
        # Get completion message (LLM-generated or fallback)
        completion_message = get_llm_completion_message()
        
        # Call the TTS script with the completion message
        subprocess.run([
            "uv", "run", tts_script, completion_message
        ], 
        capture_output=True,  # Suppress output
        timeout=10  # 10-second timeout
        )
        
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        # Fail silently if TTS encounters issues
        pass
    except Exception:
        # Fail silently for any other errors
        pass


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true', help='Copy transcript to chat.json')
        args = parser.parse_args()
        
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract required fields
        session_id = input_data.get("session_id", "")
        stop_hook_active = input_data.get("stop_hook_active", False)

        # Ensure log directory exists
        log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "stop.json")

        # Read existing log data or initialize empty list
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []
        
        # Append new data
        log_data.append(input_data)
        
        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        # Handle --chat switch
        if args.chat and 'transcript_path' in input_data:
            transcript_path = input_data['transcript_path']
            if os.path.exists(transcript_path):
                # Read .jsonl file and convert to JSON array
                chat_data = []
                try:
                    with open(transcript_path, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    chat_data.append(json.loads(line))
                                except json.JSONDecodeError:
                                    pass  # Skip invalid lines
                    
                    # Write to logs/chat.json
                    chat_file = os.path.join(log_dir, 'chat.json')
                    with open(chat_file, 'w') as f:
                        json.dump(chat_data, f, indent=2)
                except Exception:
                    pass  # Fail silently

        # Announce completion via TTS
        announce_completion()

        sys.exit(0)

    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)


if __name__ == "__main__":
    main()
`;
}

function getOaiScript() {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "openai",
#     "python-dotenv",
# ]
# ///

import os
import sys
from dotenv import load_dotenv


def prompt_llm(prompt_text):
    """
    Base OpenAI LLM prompting method using fastest model.

    Args:
        prompt_text (str): The prompt to send to the model

    Returns:
        str: The model's response text, or None if error
    """
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast OpenAI model
            messages=[{"role": "user", "content": prompt_text}],
            max_tokens=100,
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    except Exception:
        return None


def generate_completion_message():
    """
    Generate a completion message using OpenAI LLM.

    Returns:
        str: A natural language completion message, or None if error
    """
    engineer_name = os.getenv("ENGINEER_NAME", "").strip()

    if engineer_name:
        name_instruction = f"Sometimes (about 30% of the time) include the engineer's name '{engineer_name}' in a natural way."
        examples = f"""Examples of the style: 
- Standard: "Work complete!", "All done!", "Task finished!", "Ready for your next move!"
- Personalized: "{engineer_name}, all set!", "Ready for you, {engineer_name}!", "Complete, {engineer_name}!", "{engineer_name}, we're done!" """
    else:
        name_instruction = ""
        examples = """Examples of the style: "Work complete!", "All done!", "Task finished!", "Ready for your next move!" """

    prompt = f"""Generate a short, friendly completion message for when an AI coding assistant finishes a task. 

Requirements:
- Keep it under 10 words
- Make it positive and future focused
- Use natural, conversational language
- Focus on completion/readiness
- Do NOT include quotes, formatting, or explanations
- Return ONLY the completion message text
{name_instruction}

{examples}

Generate ONE completion message:"""

    response = prompt_llm(prompt)

    # Clean up response - remove quotes and extra formatting
    if response:
        response = response.strip().strip('"').strip("'").strip()
        # Take first line if multiple lines
        response = response.split("\\n")[0].strip()

    return response


def main():
    """Command line interface for testing."""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--completion":
            message = generate_completion_message()
            if message:
                print(message)
            else:
                print("Error generating completion message")
        else:
            prompt_text = " ".join(sys.argv[1:])
            response = prompt_llm(prompt_text)
            if response:
                print(response)
            else:
                print("Error calling OpenAI API")
    else:
        print("Usage: ./oai.py 'your prompt here' or ./oai.py --completion")


if __name__ == "__main__":
    main()
`;
}

function getAnthScript() {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "anthropic",
#     "python-dotenv",
# ]
# ///

import os
import sys
from dotenv import load_dotenv


def prompt_llm(prompt_text):
    """
    Base Anthropic LLM prompting method using fastest model.

    Args:
        prompt_text (str): The prompt to send to the model

    Returns:
        str: The model's response text, or None if error
    """
    load_dotenv()

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-3-5-haiku-20241022",  # Fastest Anthropic model
            max_tokens=100,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt_text}],
        )

        return message.content[0].text.strip()

    except Exception:
        return None


def generate_completion_message():
    """
    Generate a completion message using Anthropic LLM.

    Returns:
        str: A natural language completion message, or None if error
    """
    engineer_name = os.getenv("ENGINEER_NAME", "").strip()

    if engineer_name:
        name_instruction = f"Sometimes (about 30% of the time) include the engineer's name '{engineer_name}' in a natural way."
        examples = f"""Examples of the style: 
- Standard: "Work complete!", "All done!", "Task finished!", "Ready for your next move!"
- Personalized: "{engineer_name}, all set!", "Ready for you, {engineer_name}!", "Complete, {engineer_name}!", "{engineer_name}, we're done!" """
    else:
        name_instruction = ""
        examples = """Examples of the style: "Work complete!", "All done!", "Task finished!", "Ready for your next move!" """

    prompt = f"""Generate a short, friendly completion message for when an AI coding assistant finishes a task. 

Requirements:
- Keep it under 10 words
- Make it positive and future focused
- Use natural, conversational language
- Focus on completion/readiness
- Do NOT include quotes, formatting, or explanations
- Return ONLY the completion message text
{name_instruction}

{examples}

Generate ONE completion message:"""

    response = prompt_llm(prompt)

    # Clean up response - remove quotes and extra formatting
    if response:
        response = response.strip().strip('"').strip("'").strip()
        # Take first line if multiple lines
        response = response.split("\\n")[0].strip()

    return response


def main():
    """Command line interface for testing."""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--completion":
            message = generate_completion_message()
            if message:
                print(message)
            else:
                print("Error generating completion message")
        else:
            prompt_text = " ".join(sys.argv[1:])
            response = prompt_llm(prompt_text)
            if response:
                print(response)
            else:
                print("Error calling Anthropic API")
    else:
        print("Usage: ./anth.py 'your prompt here' or ./anth.py --completion")


if __name__ == "__main__":
    main()
`;
}

function getElevenlabsMcpScript() {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import os
import sys
import json
import subprocess
from pathlib import Path
from dotenv import load_dotenv


def main():
    """
    ElevenLabs MCP TTS Script
    
    Uses ElevenLabs MCP server for high-quality text-to-speech via Claude Code.
    Accepts optional text prompt as command-line argument.
    
    Usage:
    - ./elevenlabs_mcp.py                    # Uses default text
    - ./elevenlabs_mcp.py "Your custom text" # Uses provided text
    
    Features:
    - Integration with Claude Code MCP
    - Automatic voice selection
    - High-quality voice synthesis via ElevenLabs API
    - Optimized for hook usage (quick, reliable)
    """
    
    # Load environment variables
    load_dotenv()
    
    try:
        print("🎙️  ElevenLabs MCP TTS")
        print("=" * 25)
        
        # Get text from command line argument or use default
        if len(sys.argv) > 1:
            text = " ".join(sys.argv[1:])  # Join all arguments as text
        else:
            text = "Task completed successfully!"
        
        print(f"🎯 Text: {text}")
        print("🔊 Generating and playing via MCP...")
        
        try:
            # Use Claude Code CLI to invoke ElevenLabs MCP
            # This assumes the ElevenLabs MCP server is configured in Claude Code
            claude_cmd = [
                "claude", "mcp", "call", "ElevenLabs", "text_to_speech",
                "--text", text,
                "--voice_name", "Adam",  # Default voice
                "--model_id", "eleven_turbo_v2_5",  # Fast model
                "--output_directory", str(Path.home() / "Desktop"),
                "--speed", "1.0",
                "--stability", "0.5",
                "--similarity_boost", "0.75"
            ]
            
            # Try to run the Claude MCP command
            result = subprocess.run(
                claude_cmd,
                capture_output=True,
                text=True,
                timeout=15  # 15-second timeout for TTS generation
            )
            
            if result.returncode == 0:
                print("✅ TTS generated and played via MCP!")
                
                # Try to play the generated audio file
                # Look for recently created audio files on Desktop
                desktop = Path.home() / "Desktop"
                audio_files = list(desktop.glob("*.mp3"))
                
                if audio_files:
                    # Find the most recent audio file
                    latest_audio = max(audio_files, key=lambda f: f.stat().st_mtime)
                    
                    # Try to play with system default audio player
                    if sys.platform == "darwin":  # macOS
                        subprocess.run(["afplay", str(latest_audio)], capture_output=True)
                    elif sys.platform == "linux":  # Linux
                        subprocess.run(["aplay", str(latest_audio)], capture_output=True)
                    elif sys.platform == "win32":  # Windows
                        subprocess.run(["start", str(latest_audio)], shell=True, capture_output=True)
                    
                    print("🎵 Audio playback attempted")
                else:
                    print("⚠️  Audio file not found on Desktop")
            else:
                print(f"❌ MCP Error: {result.stderr}")
                # Fall back to simple notification
                print("🔔 TTS via MCP failed - task completion noted")
                
        except subprocess.TimeoutExpired:
            print("⏰ MCP TTS timed out - continuing...")
        except FileNotFoundError:
            print("❌ Claude CLI not found - MCP TTS unavailable")
        except Exception as e:
            print(f"❌ MCP Error: {e}")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
`;
}

function getOpenaiTtsScript() {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "openai",
#     "python-dotenv",
# ]
# ///

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv


async def main():
    """
    OpenAI TTS Script

    Uses OpenAI's TTS model for high-quality text-to-speech.
    Accepts optional text prompt as command-line argument.

    Usage:
    - ./openai_tts.py                    # Uses default text
    - ./openai_tts.py "Your custom text" # Uses provided text

    Features:
    - OpenAI TTS-1 model (fast and reliable)
    - Nova voice (engaging and warm)
    - Direct audio streaming and playback
    - Optimized for hook usage
    """

    # Load environment variables
    load_dotenv()

    # Get API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        sys.exit(1)

    try:
        from openai import AsyncOpenAI

        # Initialize OpenAI client
        openai = AsyncOpenAI(api_key=api_key)

        print("🎙️  OpenAI TTS")
        print("=" * 15)

        # Get text from command line argument or use default
        if len(sys.argv) > 1:
            text = " ".join(sys.argv[1:])  # Join all arguments as text
        else:
            text = "Task completed successfully!"

        print(f"🎯 Text: {text}")
        print("🔊 Generating audio...")

        try:
            # Generate audio using OpenAI TTS
            response = await openai.audio.speech.create(
                model="tts-1",
                voice="nova",
                input=text,
                response_format="mp3",
            )
            
            # Save to temporary file
            audio_file = Path.home() / "Desktop" / "tts_completion.mp3"
            with open(audio_file, "wb") as f:
                async for chunk in response.iter_bytes():
                    f.write(chunk)
            
            print("🎵 Playing audio...")
            
            # Play the audio file
            import subprocess
            if sys.platform == "darwin":  # macOS
                subprocess.run(["afplay", str(audio_file)], capture_output=True)
            elif sys.platform == "linux":  # Linux
                subprocess.run(["aplay", str(audio_file)], capture_output=True)
            elif sys.platform == "win32":  # Windows
                subprocess.run(["start", str(audio_file)], shell=True, capture_output=True)

            print("✅ Playback complete!")
            
            # Clean up the temporary file
            try:
                audio_file.unlink()
            except:
                pass

        except Exception as e:
            print(f"❌ Error: {e}")

    except ImportError as e:
        print("❌ Error: Required package not installed")
        print("This script uses UV to auto-install dependencies.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
`;
}

function getLocalTtsScript() {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pyttsx3",
# ]
# ///

import sys
import random
import os


def main():
    """
    Local TTS Script (pyttsx3)
    
    Uses pyttsx3 for offline text-to-speech synthesis.
    Accepts optional text prompt as command-line argument.
    
    Usage:
    - ./local_tts.py                    # Uses default text
    - ./local_tts.py "Your custom text" # Uses provided text
    
    Features:
    - Offline TTS (no API key required)
    - Cross-platform compatibility
    - Configurable voice settings
    - Immediate audio playback
    - Engineer name personalization support
    """
    
    try:
        import pyttsx3
        
        # Initialize TTS engine
        engine = pyttsx3.init()
        
        # Configure engine settings
        engine.setProperty('rate', 180)    # Speech rate (words per minute)
        engine.setProperty('volume', 0.9)  # Volume (0.0 to 1.0)
        
        print("🎙️  Local TTS")
        print("=" * 12)
        
        # Get text from command line argument or use default
        if len(sys.argv) > 1:
            text = " ".join(sys.argv[1:])  # Join all arguments as text
        else:
            # Default completion messages with engineer name support
            engineer_name = os.getenv("ENGINEER_NAME", "").strip()
            
            if engineer_name and random.random() < 0.3:  # 30% chance to use name
                personalized_messages = [
                    f"{engineer_name}, all set!",
                    f"Ready for you, {engineer_name}!",
                    f"Complete, {engineer_name}!",
                    f"{engineer_name}, we're done!",
                    f"Task finished, {engineer_name}!"
                ]
                text = random.choice(personalized_messages)
            else:
                completion_messages = [
                    "Work complete!",
                    "All done!",
                    "Task finished!",
                    "Job complete!",
                    "Ready for next task!",
                    "Ready for your next move!",
                    "All set!"
                ]
                text = random.choice(completion_messages)
        
        print(f"🎯 Text: {text}")
        print("🔊 Speaking...")
        
        # Speak the text
        engine.say(text)
        engine.runAndWait()
        
        print("✅ Playback complete!")
        
    except ImportError:
        print("❌ Error: pyttsx3 package not installed")
        print("This script uses UV to auto-install dependencies.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
`;
}