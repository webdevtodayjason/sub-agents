#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "elevenlabs",
#     "python-dotenv",
# ]
# ///

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def main():
    """
    ElevenLabs Turbo v2.5 TTS Script
    
    Uses ElevenLabs' Turbo v2.5 model for fast, high-quality text-to-speech.
    Accepts optional text prompt as command-line argument.
    
    Usage:
    - ./elevenlabs_tts.py                    # Uses default text
    - ./elevenlabs_tts.py "Your custom text" # Uses provided text
    
    Features:
    - Fast generation (optimized for real-time use)
    - High-quality voice synthesis
    - Stable production model
    - Cost-effective for high-volume usage
    """
    
    # Load environment variables
    load_dotenv()
    
    # Get API key from environment
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        print("❌ Error: ELEVENLABS_API_KEY not found in environment variables", file=sys.stderr)
        print("Please add your ElevenLabs API key to .env file:", file=sys.stderr)
        print("ELEVENLABS_API_KEY=your_api_key_here", file=sys.stderr)
        sys.exit(1)
    
    try:
        from elevenlabs.client import ElevenLabs
        from elevenlabs import play
        
        # Initialize client
        elevenlabs = ElevenLabs(api_key=api_key)
        
        # Get text from command line argument or use default
        if len(sys.argv) > 1:
            text = " ".join(sys.argv[1:])  # Join all arguments as text
        else:
            text = "Task completed successfully."
        
        try:
            # Generate and play audio directly
            audio = elevenlabs.text_to_speech.convert(
                text=text,
                voice_id="EXAVITQu4vr4xnSDxMaL",  # Sarah voice
                model_id="eleven_turbo_v2_5",
                output_format="mp3_44100_128",
            )
            
            play(audio)
            
        except Exception as e:
            print(f"❌ Error: {e}", file=sys.stderr)
            sys.exit(1)
        
        
    except ImportError:
        print("❌ Error: elevenlabs package not installed", file=sys.stderr)
        print("This script uses UV to auto-install dependencies.", file=sys.stderr)
        print("Make sure UV is installed: https://docs.astral.sh/uv/", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()