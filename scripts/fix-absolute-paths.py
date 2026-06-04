#!/usr/bin/env python3
"""
Fix hook paths in settings.json to use absolute paths
This resolves working directory issues in Claude Code
"""

import json
import os
import sys

def fix_settings_paths(project_dir):
    """Update all hook paths to absolute paths"""
    
    settings_path = os.path.join(project_dir, '.claude', 'settings.json')
    
    if not os.path.exists(settings_path):
        print(f"❌ Error: {settings_path} not found")
        print("💡 Run 'claude-agents init' first")
        return False
    
    try:
        with open(settings_path, 'r') as f:
            settings = json.load(f)
        
        # Get absolute path to hooks directory
        hooks_dir = os.path.join(project_dir, '.claude', 'hooks')
        
        # Update all hook commands to use absolute paths
        if 'hooks' in settings:
            for hook_type, hook_configs in settings['hooks'].items():
                for config in hook_configs:
                    if 'hooks' in config:
                        for hook in config['hooks']:
                            if 'command' in hook:
                                # Extract hook filename from command
                                cmd = hook['command']
                                if '.claude/hooks/' in cmd:
                                    # Extract filename after .claude/hooks/
                                    parts = cmd.split('.claude/hooks/')
                                    if len(parts) == 2:
                                        hook_file = parts[1]
                                        # Create absolute path command
                                        hook['command'] = f"python3 {hooks_dir}/{hook_file}"
                                        print(f"✅ Updated {hook_type}: {hook['command']}")
                                elif '/backend/.claude/hooks/' in cmd:
                                    # Fix incorrect backend paths
                                    parts = cmd.split('/backend/.claude/hooks/')
                                    if len(parts) == 2:
                                        hook_file = parts[1]
                                        hook['command'] = f"python3 {hooks_dir}/{hook_file}"
                                        print(f"✅ Fixed {hook_type}: {hook['command']}")
        
        # Write back with proper formatting
        with open(settings_path, 'w') as f:
            json.dump(settings, f, indent=2)
        
        print(f"\n✨ Successfully updated {settings_path}")
        print(f"📁 All hooks now use absolute paths from: {hooks_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating settings: {e}")
        return False

if __name__ == "__main__":
    # Get project directory (current directory or first argument)
    if len(sys.argv) > 1:
        project_dir = sys.argv[1]
    else:
        project_dir = os.getcwd()
    
    print(f"🔧 Fixing hook paths in: {project_dir}")
    fix_settings_paths(project_dir)