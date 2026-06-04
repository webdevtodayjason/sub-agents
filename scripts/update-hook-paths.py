#!/usr/bin/env python3
"""
Update hook paths in settings.json to use absolute paths
This fixes issues where Claude Code can't find hooks when working directory changes
"""

import json
import os
import sys
from pathlib import Path

def update_settings_paths(settings_path):
    """Update hook paths to absolute paths"""
    
    if not os.path.exists(settings_path):
        print(f"❌ Error: {settings_path} not found")
        return False
    
    project_dir = Path(settings_path).parent.parent
    
    try:
        with open(settings_path, 'r') as f:
            settings = json.load(f)
        
        # Update hook commands to use absolute paths
        if 'hooks' in settings:
            for hook_type, hook_configs in settings['hooks'].items():
                for config in hook_configs:
                    if 'hooks' in config:
                        for hook in config['hooks']:
                            if 'command' in hook and '.claude/hooks/' in hook['command']:
                                # Extract the hook filename
                                parts = hook['command'].split('.claude/hooks/')
                                if len(parts) == 2:
                                    hook_file = parts[1]
                                    # Create absolute path
                                    abs_path = project_dir / '.claude' / 'hooks' / hook_file
                                    hook['command'] = f"uv run {abs_path}"
                                    print(f"✅ Updated {hook_type} hook to use absolute path")
        
        # Write back
        with open(settings_path, 'w') as f:
            json.dump(settings, f, indent=2)
        
        print(f"✨ Successfully updated {settings_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating settings: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        settings_file = sys.argv[1]
    else:
        # Default to current directory
        settings_file = ".claude/settings.json"
    
    update_settings_paths(settings_file)