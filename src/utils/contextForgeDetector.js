import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import yaml from 'yaml';

/**
 * Detects if a project uses context-forge and returns its configuration
 */
export function detectContextForge(projectPath = process.cwd()) {
  const result = {
    hasContextForge: false,
    version: null,
    structure: {
      hasClaudeMd: false,
      hasPRPs: false,
      hasSlashCommands: false,
      hasHooks: false,
      hasImplementationDocs: false
    },
    paths: {
      claudeMd: null,
      prpsDir: null,
      docsDir: null,
      commandsDir: null,
      hooksDir: null
    },
    config: null,
    techStack: null,
    features: []
  };

  try {
    // Check for CLAUDE.md - primary indicator
    const claudeMdPath = join(projectPath, 'CLAUDE.md');
    if (existsSync(claudeMdPath)) {
      result.hasContextForge = true;
      result.structure.hasClaudeMd = true;
      result.paths.claudeMd = claudeMdPath;
    }

    // Check for Docs directory structure
    const docsPath = join(projectPath, 'Docs');
    if (existsSync(docsPath)) {
      result.paths.docsDir = docsPath;
      
      const implementationPath = join(docsPath, 'Implementation.md');
      if (existsSync(implementationPath)) {
        result.structure.hasImplementationDocs = true;
      }
    }

    // Check for PRPs directory
    const prpsPath = join(projectPath, 'PRPs');
    if (existsSync(prpsPath)) {
      result.structure.hasPRPs = true;
      result.paths.prpsDir = prpsPath;
    }

    // Check for .claude directory (slash commands and hooks)
    const claudeDir = join(projectPath, '.claude');
    if (existsSync(claudeDir)) {
      const commandsPath = join(claudeDir, 'commands');
      const hooksPath = join(claudeDir, 'hooks');
      
      if (existsSync(commandsPath)) {
        result.structure.hasSlashCommands = true;
        result.paths.commandsDir = commandsPath;
      }
      
      if (existsSync(hooksPath)) {
        result.structure.hasHooks = true;
        result.paths.hooksDir = hooksPath;
      }
    }

    // Check for context-forge config
    const configPath = join(projectPath, '.context-forge', 'config.json');
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        result.config = config;
        result.techStack = config.techStack;
        result.features = config.features || [];
        result.version = config.version || 'unknown';
      } catch (e) {
        // Config exists but couldn't be parsed
      }
    }

    return result;
  } catch (error) {
    console.error('Error detecting context-forge:', error);
    return result;
  }
}

/**
 * Reads and parses CLAUDE.md content to extract project rules and conventions
 */
export function parseClaudeMd(claudeMdPath) {
  try {
    if (!existsSync(claudeMdPath)) {
      return null;
    }

    const content = readFileSync(claudeMdPath, 'utf-8');
    const parsed = {
      projectName: null,
      description: null,
      techStack: [],
      rules: [],
      conventions: [],
      structure: null
    };

    // Extract project name from first heading
    const projectMatch = content.match(/^#\s+(.+?)(?:\s+-\s+(.+))?$/m);
    if (projectMatch) {
      parsed.projectName = projectMatch[1];
      parsed.description = projectMatch[2] || null;
    }

    // Extract tech stack mentions
    const techStackSection = content.match(/##\s*Tech Stack[\s\S]*?(?=##|$)/i);
    if (techStackSection) {
      const techs = techStackSection[0].match(/[-*]\s*(.+)/g);
      if (techs) {
        parsed.techStack = techs.map(t => t.replace(/^[-*]\s*/, '').trim());
      }
    }

    // Extract rules and conventions
    const rulesSection = content.match(/##\s*(?:Rules|Guidelines|Conventions)[\s\S]*?(?=##|$)/gi);
    if (rulesSection) {
      rulesSection.forEach(section => {
        const rules = section.match(/[-*]\s*(.+)/g);
        if (rules) {
          parsed.rules.push(...rules.map(r => r.replace(/^[-*]\s*/, '').trim()));
        }
      });
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing CLAUDE.md:', error);
    return null;
  }
}

/**
 * Lists available PRPs in a context-forge project
 */
export function listPRPs(prpsDir) {
  try {
    if (!existsSync(prpsDir)) {
      return [];
    }

    const prps = readdirSync(prpsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const content = readFileSync(join(prpsDir, file), 'utf-8');
        const nameMatch = content.match(/^#\s*PRP:\s*(.+)$/m);
        const goalMatch = content.match(/##\s*Goal\s*\n\s*(.+)/);
        
        return {
          filename: file,
          name: nameMatch ? nameMatch[1] : file.replace('.md', ''),
          goal: goalMatch ? goalMatch[1] : null,
          path: join(prpsDir, file)
        };
      });

    return prps;
  } catch (error) {
    console.error('Error listing PRPs:', error);
    return [];
  }
}

/**
 * Lists available slash commands in a context-forge project
 */
export function listSlashCommands(commandsDir) {
  try {
    if (!existsSync(commandsDir)) {
      return [];
    }

    const commands = [];

    function scanDir(dir, prefix = '') {
      const items = readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = join(dir, item.name);
        
        if (item.isDirectory()) {
          scanDir(fullPath, prefix ? `${prefix}:${item.name}` : item.name);
        } else if (item.name.endsWith('.md')) {
          const content = readFileSync(fullPath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (frontmatterMatch) {
            try {
              const frontmatter = yaml.parse(frontmatterMatch[1]);
              const commandName = prefix 
                ? `${prefix}:${frontmatter.name || item.name.replace('.md', '')}`
                : frontmatter.name || item.name.replace('.md', '');
              
              commands.push({
                name: commandName,
                description: frontmatter.description || '',
                category: frontmatter.category || 'custom',
                path: fullPath
              });
            } catch (e) {
              // Skip if frontmatter can't be parsed
            }
          }
        }
      }
    }

    scanDir(commandsDir);
    return commands;
  } catch (error) {
    console.error('Error listing slash commands:', error);
    return [];
  }
}

/**
 * Gets the implementation plan from a context-forge project
 */
export function getImplementationPlan(docsDir) {
  try {
    const implementationPath = join(docsDir, 'Implementation.md');
    if (!existsSync(implementationPath)) {
      return null;
    }

    const content = readFileSync(implementationPath, 'utf-8');
    const stages = [];
    
    // Extract stages
    const stageMatches = content.matchAll(/##\s*Stage\s*(\d+):\s*(.+?)(?=##\s*Stage|\n##\s*|$)/gs);
    for (const match of stageMatches) {
      const stageNum = match[1];
      const stageName = match[2].trim();
      const stageContent = match[0];
      
      // Extract tasks from stage
      const tasks = [];
      const taskMatches = stageContent.matchAll(/[-*]\s*\[([x\s])\]\s*(.+)/g);
      for (const taskMatch of taskMatches) {
        tasks.push({
          completed: taskMatch[1].toLowerCase() === 'x',
          description: taskMatch[2].trim()
        });
      }
      
      stages.push({
        number: parseInt(stageNum),
        name: stageName,
        tasks: tasks,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length
      });
    }

    return {
      stages,
      totalStages: stages.length,
      currentStage: stages.find(s => s.completedTasks < s.totalTasks)?.number || null
    };
  } catch (error) {
    console.error('Error reading implementation plan:', error);
    return null;
  }
}

/**
 * Checks if a specific context-forge feature is enabled
 */
export function hasContextForgeFeature(projectPath, feature) {
  const context = detectContextForge(projectPath);
  
  switch (feature) {
    case 'prps':
      return context.structure.hasPRPs;
    case 'hooks':
      return context.structure.hasHooks;
    case 'commands':
      return context.structure.hasSlashCommands;
    case 'validation':
      return context.config?.extras?.validation || false;
    case 'checkpoints':
      return context.config?.extras?.checkpoints || false;
    default:
      return false;
  }
}

/**
 * Creates a context-forge aware configuration for agents
 */
export function createContextAwareConfig(projectPath = process.cwd()) {
  const detection = detectContextForge(projectPath);
  
  if (!detection.hasContextForge) {
    return {
      isContextForgeProject: false,
      adaptations: {}
    };
  }

  const config = {
    isContextForgeProject: true,
    projectPath,
    detection,
    adaptations: {
      // Respect existing project structure
      respectExistingFiles: true,
      
      // Use existing PRPs instead of creating new ones
      useExistingPRPs: detection.structure.hasPRPs,
      
      // Follow CLAUDE.md rules if present
      followProjectRules: detection.structure.hasClaudeMd,
      
      // Use existing validation commands
      useExistingValidation: detection.config?.validation || {},
      
      // Respect slash commands
      respectSlashCommands: detection.structure.hasSlashCommands,
      
      // Trigger hooks appropriately
      triggerHooks: detection.structure.hasHooks
    }
  };

  // Parse CLAUDE.md for additional context
  if (detection.paths.claudeMd) {
    config.projectRules = parseClaudeMd(detection.paths.claudeMd);
  }

  // Get available PRPs
  if (detection.paths.prpsDir) {
    config.availablePRPs = listPRPs(detection.paths.prpsDir);
  }

  // Get implementation status
  if (detection.paths.docsDir) {
    config.implementationPlan = getImplementationPlan(detection.paths.docsDir);
  }

  // Get available commands
  if (detection.paths.commandsDir) {
    config.availableCommands = listSlashCommands(detection.paths.commandsDir);
  }

  return config;
}