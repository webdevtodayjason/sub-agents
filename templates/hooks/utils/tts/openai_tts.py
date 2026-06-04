#!/usr/bin/env -S uv run --script
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