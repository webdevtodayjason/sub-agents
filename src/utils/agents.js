import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { createContextAwareConfig, detectContextForge } from './contextForgeDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getAvailableAgents() {
  const agents = [];
  const checkedPaths = new Set();
  
  // Define all possible agent directories
  const agentsDirs = [
    join(__dirname, '..', '..', 'agents'), // Standard npm package location
    join(__dirname, '..', '..', '..', 'agents'), // Global npm installation
    join(__dirname, '..', '..', '..', '..', 'claude-agents', 'agents'), // Alternative global location
    join(process.cwd(), 'agents'), // Local development
  ];
  
  for (const agentsDir of agentsDirs) {
    // Skip if already checked or doesn't exist
    if (checkedPaths.has(agentsDir) || !existsSync(agentsDir)) {
      continue;
    }
    checkedPaths.add(agentsDir);
    
    const agentDirs = readdirSync(agentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const agentName of agentDirs) {
      const metadataPath = join(agentsDir, agentName, 'metadata.json');
      const agentPath = join(agentsDir, agentName, 'agent.md');
      
      if (existsSync(metadataPath) && existsSync(agentPath)) {
        try {
          const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
          const agentContent = readFileSync(agentPath, 'utf-8');
          
          // Parse YAML frontmatter
          const frontmatterMatch = agentContent.match(/^---\n([\s\S]*?)\n---/);
          let frontmatter = {};
          
          if (frontmatterMatch) {
            frontmatter = yaml.parse(frontmatterMatch[1]);
          }
          
          agents.push({
            name: agentName,
            ...metadata,
            frontmatter,
            content: agentContent
          });
        } catch (error) {
          console.error(`Error loading agent ${agentName}:`, error);
        }
      }
    }
  }
  
  return agents;
}

export function getAgentDetails(agentName) {
  // Define all possible agent directories
  const agentsDirs = [
    join(__dirname, '..', '..', 'agents'), // Standard npm package location
    join(__dirname, '..', '..', '..', 'agents'), // Global npm installation
    join(__dirname, '..', '..', '..', '..', 'claude-agents', 'agents'), // Alternative global location
    join(process.cwd(), 'agents'), // Local development
  ];
  
  for (const agentsDir of agentsDirs) {
    const agentDir = join(agentsDir, agentName);
    const metadataPath = join(agentDir, 'metadata.json');
    const agentPath = join(agentDir, 'agent.md');
    const hooksPath = join(agentDir, 'hooks.json');
    
    if (existsSync(metadataPath) && existsSync(agentPath)) {
      try {
        const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
        const agentContent = readFileSync(agentPath, 'utf-8');
        const hooks = existsSync(hooksPath) 
          ? JSON.parse(readFileSync(hooksPath, 'utf-8'))
          : null;
        
        // Parse YAML frontmatter
        const frontmatterMatch = agentContent.match(/^---\n([\s\S]*?)\n---/);
        let frontmatter = {};
        let content = agentContent;
        
        if (frontmatterMatch) {
          frontmatter = yaml.parse(frontmatterMatch[1]);
          content = agentContent.replace(frontmatterMatch[0], '').trim();
        }
        
        return {
          name: agentName,
          ...metadata,
          frontmatter,
          content,
          fullContent: agentContent,
          hooks
        };
      } catch (error) {
        console.error(`Error loading agent ${agentName}:`, error);
      }
    }
  }
  
  return null;
}

export function formatAgentForInstall(agent) {
  const { frontmatter, fullContent } = agent;
  
  // Ensure proper frontmatter format
  const formattedFrontmatter = {
    name: agent.name,
    description: frontmatter.description || agent.description,
    tools: frontmatter.tools || agent.requirements?.tools?.join(', ') || ''
  };
  
  // Create the properly formatted agent file
  const yamlFrontmatter = yaml.stringify(formattedFrontmatter).trim();
  const content = fullContent.replace(/^---\n[\s\S]*?\n---/, '').trim();
  
  return `---\n${yamlFrontmatter}\n---\n\n${content}`;
}

/**
 * Creates a context-aware agent configuration
 * This enhances agents with knowledge of context-forge project structure
 */
export function createContextAwareAgent(agentName, projectPath = process.cwd()) {
  const agent = getAgentDetails(agentName);
  if (!agent) {
    return null;
  }

  // Get context-forge configuration
  const contextConfig = createContextAwareConfig(projectPath);
  
  // Enhance agent with context awareness
  const enhancedAgent = {
    ...agent,
    contextForge: contextConfig,
    isContextAware: contextConfig.isContextForgeProject
  };

  // If this is a context-forge project, add specific instructions
  if (contextConfig.isContextForgeProject) {
    const contextInstructions = generateContextInstructions(contextConfig);
    enhancedAgent.contextInstructions = contextInstructions;
    
    // Prepend context instructions to agent content
    enhancedAgent.enhancedContent = `${contextInstructions}\n\n${agent.content}`;
  } else {
    enhancedAgent.enhancedContent = agent.content;
  }

  return enhancedAgent;
}

/**
 * Generates context-specific instructions for agents in context-forge projects
 */
function generateContextInstructions(contextConfig) {
  let instructions = `## Context-Forge Project Detected

This is a context-forge project with established conventions and structures. You must respect and work within the existing framework.

### Project Configuration
`;

  if (contextConfig.projectRules) {
    instructions += `
**Project**: ${contextConfig.projectRules.projectName || 'Unknown'}
**Tech Stack**: ${contextConfig.projectRules.techStack.join(', ') || 'Not specified'}
`;
  }

  instructions += `
### Available Resources
`;

  if (contextConfig.detection.structure.hasClaudeMd) {
    instructions += `- **CLAUDE.md**: Project rules and conventions (MUST READ AND FOLLOW)\n`;
  }

  if (contextConfig.detection.structure.hasPRPs) {
    instructions += `- **PRPs Directory**: ${contextConfig.availablePRPs?.length || 0} existing PRPs available\n`;
    if (contextConfig.availablePRPs?.length > 0) {
      instructions += `  Available PRPs:\n`;
      contextConfig.availablePRPs.forEach(prp => {
        instructions += `  - ${prp.name}: ${prp.goal || 'No goal specified'}\n`;
      });
    }
  }

  if (contextConfig.detection.structure.hasImplementationDocs) {
    instructions += `- **Implementation Plan**: ${contextConfig.implementationPlan?.currentStage ? `Currently on Stage ${contextConfig.implementationPlan.currentStage}` : 'Available'}\n`;
  }

  if (contextConfig.detection.structure.hasSlashCommands) {
    instructions += `- **Slash Commands**: ${contextConfig.availableCommands?.length || 0} commands available\n`;
  }

  if (contextConfig.detection.structure.hasHooks) {
    instructions += `- **Claude Hooks**: Active hooks that may be triggered by your actions\n`;
  }

  instructions += `
### Critical Rules for Context-Forge Projects

1. **ALWAYS** read CLAUDE.md before making any changes
2. **CHECK** for existing PRPs before creating new ones
3. **FOLLOW** the implementation plan in Docs/Implementation.md
4. **USE** existing validation commands from PRPs
5. **RESPECT** existing project structure and conventions
6. **APPEND** to existing documentation rather than overwriting
7. **TRIGGER** appropriate hooks when available

### Working with PRPs

When a relevant PRP exists:
- Read the PRP thoroughly
- Follow its validation gates
- Use its specified commands
- Respect its success criteria

When no PRP exists but PRPs directory is present:
- Consider if a PRP should be created
- Follow the existing PRP format
- Include validation gates

### Implementation Plan Awareness

`;

  if (contextConfig.implementationPlan) {
    const plan = contextConfig.implementationPlan;
    instructions += `Current Progress:\n`;
    plan.stages.forEach(stage => {
      instructions += `- Stage ${stage.number}: ${stage.name} (${stage.completedTasks}/${stage.totalTasks} tasks completed)\n`;
    });
  }

  return instructions;
}

/**
 * Gets agent runtime configuration based on project context
 */
export function getAgentRuntimeConfig(agentName, projectPath = process.cwd()) {
  const contextAwareAgent = createContextAwareAgent(agentName, projectPath);
  if (!contextAwareAgent) {
    return null;
  }

  const config = {
    agent: contextAwareAgent,
    adaptations: contextAwareAgent.contextForge?.adaptations || {},
    projectContext: contextAwareAgent.contextForge || null
  };

  // Add specific runtime behaviors based on context
  if (contextAwareAgent.isContextAware) {
    config.behaviors = {
      // Prefer reading existing files before creating
      readBeforeWrite: true,
      
      // Check for PRPs before creating new ones
      checkExistingPRPs: contextAwareAgent.contextForge.detection.structure.hasPRPs,
      
      // Follow validation from existing PRPs
      useExistingValidation: contextAwareAgent.contextForge.detection.structure.hasPRPs,
      
      // Respect implementation stages
      followImplementationPlan: contextAwareAgent.contextForge.detection.structure.hasImplementationDocs,
      
      // Use context-forge slash commands when available
      preferContextCommands: contextAwareAgent.contextForge.detection.structure.hasSlashCommands
    };
  }

  return config;
}