#!/bin/bash

# Fix UV path issues by updating settings.json to use direct Python execution

echo "🔧 Fixing hook execution paths..."

if [ ! -f ".claude/settings.json" ]; then
    echo "❌ Error: .claude/settings.json not found"
    exit 1
fi

# Create a backup
cp .claude/settings.json .claude/settings.json.backup

# Update the settings.json to use python3 directly instead of uv run
sed -i.tmp 's/"uv run \.claude/"python3 .claude/g' .claude/settings.json

# Remove temp file
rm -f .claude/settings.json.tmp

echo "✅ Updated hook commands to use python3 directly"
echo "📋 Backup saved to .claude/settings.json.backup"
echo ""
echo "💡 If you still have issues, try:"
echo "   1. which python3"
echo "   2. which uv"
echo "   3. claude-agents diagnose"