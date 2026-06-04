#!/usr/bin/env -S uv run --script
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