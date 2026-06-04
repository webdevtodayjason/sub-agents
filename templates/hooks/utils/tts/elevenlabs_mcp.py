#!/usr/bin/env -S uv run --script
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