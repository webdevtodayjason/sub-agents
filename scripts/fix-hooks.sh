#!/bin/bash

# Claude Agents Hook Fix Script
# This script fixes common hook permission issues

echo "🔧 Claude Agents Hook Fix Script"
echo "================================"

# Check if .claude directory exists
if [ ! -d ".claude" ]; then
    echo "❌ Error: .claude directory not found"
    echo "📦 Please run 'claude-agents init' first"
    exit 1
fi

# Fix hook permissions
echo "🔨 Fixing hook permissions..."

# Main hooks
if [ -d ".claude/hooks" ]; then
    chmod +x .claude/hooks/*.py 2>/dev/null
    echo "✅ Fixed main hook permissions"
else
    echo "❌ .claude/hooks directory not found"
fi

# LLM utilities
if [ -d ".claude/hooks/utils/llm" ]; then
    chmod +x .claude/hooks/utils/llm/*.py 2>/dev/null
    echo "✅ Fixed LLM utility permissions"
fi

# TTS utilities
if [ -d ".claude/hooks/utils/tts" ]; then
    chmod +x .claude/hooks/utils/tts/*.py 2>/dev/null
    echo "✅ Fixed TTS utility permissions"
fi

# Check if hooks exist
echo ""
echo "📋 Checking essential hooks..."

HOOKS=("stop.py" "subagent_stop.py" "post_tool_use_elevenlabs.py" "notification.py")
MISSING=0

for hook in "${HOOKS[@]}"; do
    if [ -f ".claude/hooks/$hook" ]; then
        echo "✅ $hook found"
    else
        echo "❌ $hook missing"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    echo "⚠️  Warning: $MISSING hooks are missing"
    echo "🔧 Run 'claude-agents init' to restore missing hooks"
else
    echo ""
    echo "✨ All hooks are properly configured!"
fi

echo ""
echo "💡 If you still have issues, run:"
echo "   claude-agents diagnose"