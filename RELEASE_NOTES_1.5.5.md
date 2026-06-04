# Release Notes — v1.5.5

First published release since **v1.4.0**. This rolls up the voice-integration and
hooks work (previously drafted as 1.5.1) plus packaging fixes required to ship it
safely, and triages the open community PRs.

## 🔊 Voice Announcements
- **Multi-provider TTS** with automatic fallback: ElevenLabs MCP → OpenAI → local (`pyttsx3`).
- **`claude-agents voice`** — configure, enable/disable, set provider, check `--status`, and `--test` playback.
- **`claude-agents setup`** — interactive wizard for agents, voice, and API keys (`--voice-only` available).
- Per-agent completion announcements wired through Claude Code hooks.
- New `work-completion-summary` agent for concise spoken task summaries.

## 🪝 Hooks System
- Python hook templates installed during `init` (`stop.py`, `subagent_stop.py`, `post_tool_use*.py`, `notification.py`).
- `settings.json` is now **merged** on `init` rather than overwritten — existing config is preserved.
- **`claude-agents diagnose`** — checks installation and hook health.

## 🔗 Orchestration
- **`claude-agents chain <agents...>`** — run agents in sequence or parallel, with `--save` to persist reusable chains and `--voice` announcements.
- New **`meta-agent`** for generating agents.

## 🛠️ Fixes
- **Removed hardcoded absolute path.** Agent voice examples and the voice hook no longer hardcode a developer-specific `output_directory`; they now use the current project directory (`"."` / `process.cwd()`), so installs write audio to the user's own project.
- **Context-forge command naming.** When installing into a context-forge project, command files are renamed to `agent-<command>.md` to avoid conflicts. Installs now rewrite the frontmatter `name` to match, so an explicit `name:` field can no longer defeat the conflict-avoidance prefix.
- **`allowed-tools: Task`** added to the 14 agent-dispatch slash commands that were missing it (community PR #10).
- `templates/**` is now included in the published package (`files`).
- Repo hygiene: TTS scratch artifacts (`*.mp3`, `tmp/`) and dev-local `.claude/` are now gitignored.

## 📦 Updating
```bash
npm install -g @webdevtoday/claude-agents@latest
# then, in each project:
claude-agents init
```

## Voice setup
```bash
claude-agents voice --setup
```
Optional for higher-quality voice: FFmpeg (playback) and an ElevenLabs or OpenAI API key.

## 🙏 Community
Thanks to **@xiaolai** for the automated NLPM audit PRs (#4–#11). #10 merged here;
the command `name:` additions (#9) land on top of the context-forge fix above, and
the shadcn-ui-builder tool fix (#5) is folded in.
