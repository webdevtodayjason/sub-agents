import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getAvailableAgents() {
  const agentsDir = join(__dirname, '..', '..', 'agents');
  const agents = [];
  
  if (!existsSync(agentsDir)) {
    return agents;
  }
  
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
  
  return agents;
}

export function getAgentDetails(agentName) {
  const agentsDir = join(__dirname, '..', '..', 'agents');
  const agentDir = join(agentsDir, agentName);
  
  const metadataPath = join(agentDir, 'metadata.json');
  const agentPath = join(agentDir, 'agent.md');
  const hooksPath = join(agentDir, 'hooks.json');
  
  if (!existsSync(metadataPath) || !existsSync(agentPath)) {
    return null;
  }
  
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
    return null;
  }
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