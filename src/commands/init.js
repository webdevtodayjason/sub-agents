import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, appendFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import { 
  getAgentsDir, 
  getCommandsDir, 
  ensureProjectDirectories,
  CLAUDE_PROJECT_DIR
} from '../utils/paths.js';
import { 
  getAvailableAgents, 
  getAgentDetails,
  formatAgentForInstall
} from '../utils/agents.js';
import { 
  createHookFiles,
  createSettingsTemplate
} from '../utils/hooks.js';
import { detectContextForge } from '../utils/contextForgeDetector.js';
import { addInstalledAgent, saveConfig, DEFAULT_CONFIG } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initCommand(options) {
  const spinner = ora();
  
  try {
    console.log(chalk.bold.blue('🚀 Initializing Claude Sub-Agents\n'));
    
    // Detect context-forge project
    const contextForgeInfo = detectContextForge();
    const isContextForge = contextForgeInfo.hasContextForge;
    
    if (isContextForge) {
      console.log(chalk.cyan('🛠️  Context-Forge project detected!'));
      console.log(chalk.gray('  Sub-agents will be integrated with your existing setup.'));
      console.log(chalk.gray('  • Preserving existing CLAUDE.md'));
      console.log(chalk.gray('  • Preserving existing commands and hooks'));
      console.log(chalk.gray('  • Adding agents to .claude/agents/\n'));
    }
    
    // Confirm initialization
    const confirmMessage = isContextForge
      ? 'Initialize sub-agents in this context-forge project?'
      : 'Initialize sub-agents in this project?';
      
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: confirmMessage,
      default: true
    }]);
    
    if (!confirmed) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
    
    // Create project directories
    spinner.start('Creating project structure...');
    ensureProjectDirectories();
    
    // Create agents directory
    const agentsDir = join(CLAUDE_PROJECT_DIR, 'agents');
    if (!existsSync(agentsDir)) {
      mkdirSync(agentsDir, { recursive: true });
    }
    spinner.succeed('Project structure created');
    
    // Get available agents
    spinner.start('Loading available agents...');
    const availableAgents = getAvailableAgents();
    spinner.stop();
    
    // Copy all agents
    spinner.start('Installing agents...');
    let installedCount = 0;
    
    for (const agent of availableAgents) {
      try {
        const agentDetails = getAgentDetails(agent.name);
        if (!agentDetails) continue;
        
        // Write agent file
        const agentPath = join(agentsDir, `${agent.name}.md`);
        const formattedContent = formatAgentForInstall(agentDetails);
        writeFileSync(agentPath, formattedContent);
        
        // Add to config
        addInstalledAgent(agent.name, agentDetails, true);
        installedCount++;
      } catch (error) {
        console.error(chalk.red(`Failed to install ${agent.name}: ${error.message}`));
      }
    }
    spinner.succeed(`Installed ${installedCount} agents`);
    
    // Handle commands - always install but in different locations for context-forge
    spinner.start('Installing agent commands...');
    const commandsDir = getCommandsDir(true);
    const commandsSourceDir = join(__dirname, '..', '..', 'commands');
    
    // Create commands directory structure
    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true });
    }
    
    // Copy all command files
    const commandFiles = readdirSync(commandsSourceDir).filter(f => f.endsWith('.md'));
    
    // For context-forge projects, put commands in agents subdirectory
    const targetDir = isContextForge ? join(commandsDir, 'agents') : commandsDir;
    
    if (isContextForge && !existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    
    for (const file of commandFiles) {
      const srcPath = join(commandsSourceDir, file);
      const destName = isContextForge ? `agent-${file}` : file;
      const destPath = join(targetDir, destName);
      copyFileSync(srcPath, destPath);
    }
    
    spinner.succeed('Agent commands installed');
    
    if (isContextForge) {
      console.log(chalk.gray('  Commands placed in .claude/commands/agents/ to avoid conflicts'));
    }
    
    // Handle CLAUDE.md
    if (isContextForge && options.merge !== false) {
      spinner.start('Updating CLAUDE.md...');
      const claudeMdPath = join(process.cwd(), 'CLAUDE.md');
      
      if (existsSync(claudeMdPath)) {
        const existingContent = readFileSync(claudeMdPath, 'utf-8');
        
        // Check if sections already exist
        const hasConcurrentSection = existingContent.includes('Claude Code Sub Agent Configuration');
        const hasAgentsSection = existingContent.includes('Claude Sub-Agents Integration');
        
        let updatedContent = existingContent;
        
        // Add concurrent execution section at the top if not present
        if (!hasConcurrentSection) {
          const concurrentSection = generateConcurrentExecutionSection();
          // Insert after the first line (usually the main title)
          const lines = existingContent.split('\n');
          lines.splice(1, 0, '\n' + concurrentSection);
          updatedContent = lines.join('\n');
        }
        
        // Add sub-agents section after concurrent section if not present
        if (!hasAgentsSection) {
          const subAgentsSection = generateSubAgentsSection(installedCount);
          // Find where to insert (after concurrent section or at end)
          if (hasConcurrentSection || !hasConcurrentSection) {
            // Insert after the concurrent execution section
            const insertPoint = updatedContent.indexOf('### 🎯 CONCURRENT EXECUTION CHECKLIST:');
            if (insertPoint !== -1) {
              // Find the end of the checklist section
              const checklistEnd = updatedContent.indexOf('\n\n', insertPoint + 200);
              if (checklistEnd !== -1) {
                updatedContent = updatedContent.slice(0, checklistEnd + 2) + 
                                subAgentsSection + '\n' + 
                                updatedContent.slice(checklistEnd + 2);
              } else {
                updatedContent += '\n\n' + subAgentsSection;
              }
            } else {
              updatedContent += '\n\n' + subAgentsSection;
            }
          }
        }
        
        // Write updated content
        writeFileSync(claudeMdPath, updatedContent);
        spinner.succeed('Updated CLAUDE.md with sub-agents configuration');
        
        if (!hasConcurrentSection) {
          console.log(chalk.gray('  • Added concurrent execution rules'));
        }
        if (!hasAgentsSection) {
          console.log(chalk.gray('  • Added sub-agents integration section'));
        }
        if (hasConcurrentSection && hasAgentsSection) {
          console.log(chalk.gray('  • Sections already present, skipped duplicate'));
        }
      }
    }
    
    // Create memory directory
    const memoryDir = join(process.cwd(), '.swarm');
    if (!existsSync(memoryDir)) {
      mkdirSync(memoryDir, { recursive: true });
    }
    
    // Create hooks directory structure (default behavior, skip with --no-hooks)
    if (options.hooks !== false) {
      spinner.start('Setting up Claude Code hooks...');
      const hooksDir = join(CLAUDE_PROJECT_DIR, 'hooks');
      const hooksUtilsDir = join(hooksDir, 'utils');
      const hooksLlmDir = join(hooksUtilsDir, 'llm');
      const hooksTtsDir = join(hooksUtilsDir, 'tts');
      
      // Check if hooks already exist
      const hooksExisted = existsSync(hooksDir);
      if (hooksExisted) {
        console.log(chalk.gray('\n  • Found existing hooks directory, updating...'));
      }
      
      // Ensure hooks directories exist
      [hooksDir, hooksUtilsDir, hooksLlmDir, hooksTtsDir].forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      });
      
      // Copy hook files from templates
      const templatesHooksDir = join(__dirname, '..', '..', 'templates', 'hooks');
      if (existsSync(templatesHooksDir)) {
        // Copy hook scripts
        const hookFiles = ['subagent_stop.py', 'stop.py', 'post_tool_use.py', 'post_tool_use_elevenlabs.py', 'notification.py'];
        for (const file of hookFiles) {
          const srcPath = join(templatesHooksDir, file);
          const destPath = join(hooksDir, file);
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
            // Make the hook executable
            chmodSync(destPath, '755');
            console.log(chalk.gray(`  • Copied hook: ${file}`));
          } else {
            console.log(chalk.yellow(`  • Warning: Hook template not found: ${file}`));
          }
        }
        
        // Copy utils directories
        const utilsTemplateDir = join(templatesHooksDir, 'utils');
        if (existsSync(utilsTemplateDir)) {
          // Copy LLM utilities
          const llmTemplateDir = join(utilsTemplateDir, 'llm');
          if (existsSync(llmTemplateDir)) {
            const llmFiles = readdirSync(llmTemplateDir).filter(f => f.endsWith('.py'));
            for (const file of llmFiles) {
              const destPath = join(hooksLlmDir, file);
              copyFileSync(join(llmTemplateDir, file), destPath);
              chmodSync(destPath, '755');
            }
          }
          
          // Copy TTS utilities
          const ttsTemplateDir = join(utilsTemplateDir, 'tts');
          if (existsSync(ttsTemplateDir)) {
            const ttsFiles = readdirSync(ttsTemplateDir).filter(f => f.endsWith('.py'));
            for (const file of ttsFiles) {
              const destPath = join(hooksTtsDir, file);
              copyFileSync(join(ttsTemplateDir, file), destPath);
              chmodSync(destPath, '755');
            }
          }
        }
      } else {
        // Fallback to inline hook creation if templates don't exist
        const hookFiles = await createHookFiles(hooksDir, hooksLlmDir, hooksTtsDir);
      }
      
      // Create or merge settings.json template for hooks
      const settingsPath = join(CLAUDE_PROJECT_DIR, 'settings.json');
      const projectPath = process.cwd();
      
      if (!existsSync(settingsPath)) {
        // No existing settings.json - create with absolute paths
        const settingsContent = {
          "permissions": {
            "allow": [
              "Bash(mkdir:*)",
              "Bash(uv:*)",
              "Bash(find:*)",
              "Bash(mv:*)",
              "Bash(grep:*)",
              "Bash(npm:*)",
              "Bash(ls:*)",
              "Bash(cp:*)",
              "Write",
              "Edit",
              "Bash(chmod:*)",
              "Bash(touch:*)"
            ],
            "deny": []
          },
          "hooks": {
            "Stop": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/stop.py --chat`
              }]
            }],
            "SubagentStop": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/subagent_stop.py`
              }]
            }],
            "PostToolUse": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/post_tool_use_elevenlabs.py`
              }]
            }],
            "Notification": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/notification.py`
              }]
            }]
          }
        };
        writeFileSync(settingsPath, JSON.stringify(settingsContent, null, 2));
      } else {
        // Existing settings.json - merge with template
        try {
          const existingSettings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
          
          // Define hooks with absolute paths
          const newHooks = {
            "Stop": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/stop.py --chat`
              }]
            }],
            "SubagentStop": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/subagent_stop.py`
              }]
            }],
            "PostToolUse": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/post_tool_use_elevenlabs.py`
              }]
            }],
            "Notification": [{
              "matcher": "",
              "hooks": [{
                "type": "command",
                "command": `python3 ${projectPath}/.claude/hooks/notification.py`
              }]
            }]
          };
          
          // Merge hooks, preserving existing ones
          if (!existingSettings.hooks) {
            existingSettings.hooks = {};
          }
          
          // Add new hooks from template without overwriting existing ones
          for (const [hookName, hookConfig] of Object.entries(newHooks)) {
            if (!existingSettings.hooks[hookName]) {
              existingSettings.hooks[hookName] = hookConfig;
            }
          }
          
          // Merge permissions
          if (!existingSettings.permissions) {
            existingSettings.permissions = {
              "allow": [
                "Bash(mkdir:*)",
                "Bash(uv:*)",
                "Bash(find:*)",
                "Bash(mv:*)",
                "Bash(grep:*)",
                "Bash(npm:*)",
                "Bash(ls:*)",
                "Bash(cp:*)",
                "Write",
                "Edit",
                "Bash(chmod:*)",
                "Bash(touch:*)"
              ],
              "deny": []
            };
          }
          
          writeFileSync(settingsPath, JSON.stringify(existingSettings, null, 2));
          console.log(chalk.gray('  • Merged hooks configuration into existing settings.json'));
        } catch (error) {
          console.error(chalk.yellow('  • Warning: Could not merge settings.json, keeping existing file'));
        }
      }
      
      spinner.succeed('Claude Code hooks created');
    }
    
    // Final message
    console.log('');
    console.log(chalk.green('✨ Initialization complete!'));
    console.log('');
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray('1. Run'), chalk.cyan('claude-agents list'), chalk.gray('to see installed agents'));
    console.log(chalk.gray('2. Use'), chalk.cyan('claude-agents run <agent> --task "..."'), chalk.gray('to run agents'));
    
    if (isContextForge) {
      console.log(chalk.gray('3. Agents can work with your PRPs via Task() tool'));
      console.log(chalk.gray('4. Check .claude/commands/agents/ for agent-specific commands'));
    } else {
      console.log(chalk.gray('3. Use slash commands in Claude Code (e.g., /review)'));
    }
    
    console.log('');
    console.log(chalk.bold.cyan('🔊 NEW: Voice Features & Hooks'));
    console.log(chalk.gray('Configure voice announcements:'), chalk.cyan('claude-agents voice'));
    console.log(chalk.gray('Run agents with voice:'), chalk.cyan('claude-agents run <agent> --task "..." --voice'));
    
    if (options.hooks !== false) {
      console.log('');
      console.log(chalk.bold.cyan('🪝 Claude Code Hooks Installed'));
      console.log(chalk.gray('• Stop hook:'), chalk.cyan('.claude/hooks/stop.py'), chalk.gray('- LLM-generated completion messages'));
      console.log(chalk.gray('• SubagentStop hook:'), chalk.cyan('.claude/hooks/subagent_stop.py'), chalk.gray('- Agent completion notifications'));
      console.log(chalk.gray('• Voice hook:'), chalk.cyan('.claude/hooks/post_tool_use_elevenlabs.py'), chalk.gray('- AI summaries + ElevenLabs TTS'));
      console.log(chalk.gray('• TTS providers:'), chalk.cyan('ElevenLabs (Sarah voice) > Local'));
      console.log(chalk.gray('• Engineer name support:'), chalk.cyan('ENGINEER_NAME=YourName'), chalk.gray('env variable'));
      console.log(chalk.gray('• Configure:'), chalk.cyan('.claude/settings.json'), chalk.gray('- Hook permissions & settings'));
    } else {
      console.log('');
      console.log(chalk.gray('🪝 Claude Code hooks skipped (use --no-hooks flag)'));
    }
    
  } catch (error) {
    spinner.fail('Initialization failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function generateConcurrentExecutionSection() {
  return `# Claude Code Sub Agent Configuration
## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**Examples of CORRECT concurrent execution:**
\`\`\`javascript
// ✅ CORRECT: Everything in ONE message
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Task("Agent 3 with full instructions and hooks")
  - Read("file1.js")
  - Read("file2.js")
  - Write("output1.js", content)
  - Write("output2.js", content)
  - Bash("npm install")
  - Bash("npm test")
  - Bash("npm run build")
\`\`\`

**Examples of WRONG sequential execution:**
\`\`\`javascript
// ❌ WRONG: Multiple messages (NEVER DO THIS)
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Task("Agent 2")
Message 4: Read("file1.js")
Message 5: Write("output1.js")
Message 6: Bash("npm install")
// This is 6x slower and breaks coordination!
\`\`\`

### 🎯 CONCURRENT EXECUTION CHECKLIST:

Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?
- ✅ Are ALL memory operations concurrent?

If ANY answer is "No", you MUST combine operations into a single message!`;
}

function generateSubAgentsSection(agentCount) {
  return `## 🤖 Claude Sub-Agents Integration

This project includes ${agentCount} specialized AI sub-agents for enhanced development.

### Available Agents

The following agents are installed in \`.claude/agents/\`:

- **project-planner**: Strategic planning and task decomposition specialist
- **api-developer**: Backend API development specialist with PRP awareness
- **frontend-developer**: Modern web interface implementation specialist
- **tdd-specialist**: Test-driven development and comprehensive testing expert
- **code-reviewer**: Code quality, security, and best practices analyst
- **debugger**: Error analysis and debugging specialist
- **refactor**: Code refactoring and improvement specialist
- **doc-writer**: Technical documentation specialist
- **security-scanner**: Security vulnerability detection specialist
- **devops-engineer**: CI/CD and deployment automation specialist
- **product-manager**: Product requirements and user story specialist
- **marketing-writer**: Technical marketing content specialist
- **api-documenter**: OpenAPI/Swagger documentation specialist
- **test-runner**: Automated test execution specialist
- **shadcn-ui-builder**: UI/UX implementation with ShadCN components
- **meta-agent**: Agent generator that creates new sub-agents from descriptions

### Using Sub-Agents

Agents work alongside your existing PRPs and can be invoked in several ways:

1. **Direct execution**: \`claude-agents run <agent> --task "description"\`
2. **Task tool in Claude Code**: \`Task("agent-name: task description")\`
3. **Agent slash commands**: Located in \`.claude/commands/agents/\`
4. **With voice announcements**: \`claude-agents run <agent> --task "..." --voice\`

### Memory System

Agents share context and coordinate through:
- **Memory Store**: \`.swarm/memory.json\` for persistent agent memory
- **Context Sharing**: Agents can access shared project context
- **PRP Integration**: Agents are aware of and can work with your PRPs

### Best Practices

- Use agents for specialized tasks that match their expertise
- Agents can read and understand your PRPs for context
- Multiple agents can work on different aspects of the same feature
- Memory system allows agents to build on each other's work

### Voice Features (NEW in v1.5.0)

Enable voice announcements for agent completions:

1. **Configure voice**: \`claude-agents voice\`
2. **Set up MCP for ElevenLabs** (recommended):
   \`\`\`bash
   claude mcp add ElevenLabs -e ELEVENLABS_API_KEY=your-key -- uvx elevenlabs-mcp
   \`\`\`
3. **Or use OpenAI/Local TTS**: Configure API keys with \`claude-agents voice --api-key\``;
}