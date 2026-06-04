# Release Notes - v1.5.1

## 🎉 Enhanced Voice Integration & Hook Improvements

### 🔊 Voice Enhancements
- **ElevenLabs Integration**: High-quality voice synthesis with Sarah voice for natural-sounding announcements
- **Voice Setup Wizard**: New `claude-agents voice --setup` command provides interactive configuration
- **FFmpeg Detection**: Automatic detection of FFmpeg with platform-specific installation guidance
- **Auto-Announcements**: Voice notifications automatically play when sub-agents complete tasks in Claude Code

### 🪝 Hook System Improvements
- **Settings.json Merging**: Fixed issue where `claude-agents init` didn't properly update existing settings.json files
- **Hook Installation**: All Python hooks (stop.py, subagent_stop.py, etc.) now properly install during init
- **Preserved Configurations**: Init command now merges new hooks without overwriting existing configurations

### 🔧 Bug Fixes
- Fixed missing stop.py hook error during Claude Code execution
- Fixed settings.json not updating with new hooks when running init on existing projects
- Added templates directory to npm package files for proper distribution

### 📦 Package Updates
- Added templates/**/* to package.json files list
- Improved init command to handle hook merging for existing projects
- Enhanced voice command with comprehensive setup wizard

### 📚 Documentation
- Added voice setup requirements and installation instructions
- Added update instructions for existing installations
- Documented how to update projects after package updates
- Added examples of installing with @latest tag

## Updating from v1.5.0

1. Update the package:
```bash
npm update -g @webdevtoday/claude-agents@latest
```

2. Update your projects:
```bash
# In each project directory
claude-agents init
```

This will update your Claude Code hooks and merge new configurations while preserving your existing settings.

## Voice Setup

To enable voice announcements:
```bash
# Run the setup wizard
claude-agents voice --setup
```

Requirements for high-quality voice:
- FFmpeg (for audio playback)
- API keys for ElevenLabs or OpenAI (optional, for better quality)

---

For more information, see the [README](README.md) or run `claude-agents --help`.