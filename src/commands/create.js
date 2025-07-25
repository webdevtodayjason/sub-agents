import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import { inputAgentDetails, confirmAction, selectInstallScope } from '../utils/prompts.js';
import { getAgentsDir, ensureDirectories, ensureProjectDirectories } from '../utils/paths.js';
import { addInstalledAgent } from '../utils/config.js';

const BASIC_TEMPLATE = `You are a specialized assistant focused on [TASK].

Your primary responsibilities:
1. [RESPONSIBILITY 1]
2. [RESPONSIBILITY 2]
3. [RESPONSIBILITY 3]

Guidelines:
- [GUIDELINE 1]
- [GUIDELINE 2]
- [GUIDELINE 3]

Always ensure [KEY PRINCIPLE].`;

const ADVANCED_TEMPLATE = `You are an expert [ROLE] specializing in [DOMAIN].

## Core Responsibilities

When invoked, you will:
1. Analyze the [INPUT/CONTEXT]
2. Apply [METHODOLOGY/APPROACH]
3. Deliver [OUTPUT/RESULT]

## Workflow

### Step 1: Initial Assessment
- [ASSESSMENT POINT 1]
- [ASSESSMENT POINT 2]
- [ASSESSMENT POINT 3]

### Step 2: Execution
- [EXECUTION STEP 1]
- [EXECUTION STEP 2]
- [EXECUTION STEP 3]

### Step 3: Validation
- [VALIDATION CRITERIA 1]
- [VALIDATION CRITERIA 2]
- [VALIDATION CRITERIA 3]

## Best Practices
- Always [BEST PRACTICE 1]
- Never [ANTI-PATTERN 1]
- Ensure [QUALITY STANDARD]

## Output Format
Provide results in the following structure:
1. Summary of findings
2. Detailed analysis
3. Recommendations
4. Next steps

Remember: [KEY PRINCIPLE OR MOTTO]`;

export async function createCommand(options) {
  try {
    console.log(chalk.bold.blue('Create Custom Agent'));
    console.log(chalk.gray('This wizard will help you create a new custom agent.\n'));
    
    // Get agent details
    let agentDetails;
    if (options.name) {
      // Non-interactive mode with provided options
      agentDetails = {
        name: options.name,
        description: 'Custom agent',
        tools: [],
        systemPrompt: BASIC_TEMPLATE
      };
    } else {
      // Interactive mode
      agentDetails = await inputAgentDetails();
    }
    
    // Select template if not provided
    const template = options.template || 'basic';
    if (!agentDetails.systemPrompt || agentDetails.systemPrompt.trim() === '') {
      agentDetails.systemPrompt = template === 'advanced' ? ADVANCED_TEMPLATE : BASIC_TEMPLATE;
    }
    
    // Select installation scope
    const scope = await selectInstallScope();
    const isProject = scope === 'project';
    
    if (isProject) {
      ensureProjectDirectories();
    } else {
      ensureDirectories();
    }
    
    const agentsDir = getAgentsDir(isProject);
    
    // Create agent content
    const frontmatter = {
      name: agentDetails.name,
      description: agentDetails.description,
      tools: agentDetails.tools.join(', ')
    };
    
    const yamlFrontmatter = yaml.stringify(frontmatter).trim();
    const agentContent = `---\n${yamlFrontmatter}\n---\n\n${agentDetails.systemPrompt}`;
    
    // Preview
    console.log('\n' + chalk.bold('Agent Preview:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(agentContent);
    console.log(chalk.gray('─'.repeat(50)));
    
    // Confirm creation
    if (!await confirmAction('\nCreate this agent?')) {
      console.log(chalk.yellow('Agent creation cancelled.'));
      return;
    }
    
    // Write agent file
    const agentPath = join(agentsDir, `${agentDetails.name}.md`);
    writeFileSync(agentPath, agentContent);
    
    // Add to config
    const metadata = {
      name: agentDetails.name,
      version: '1.0.0',
      description: agentDetails.description,
      author: 'Custom',
      custom: true,
      requirements: {
        tools: agentDetails.tools
      }
    };
    
    addInstalledAgent(agentDetails.name, metadata, isProject);
    
    console.log(chalk.green(`\n✓ Agent "${agentDetails.name}" created successfully!`));
    console.log(chalk.gray(`Location: ${agentPath}`));
    console.log(chalk.gray(`The agent is now enabled and ready to use.`));
    
    // Provide next steps
    console.log('\n' + chalk.bold('Next steps:'));
    console.log('1. Edit the agent file to customize the system prompt');
    console.log('2. Create slash commands in the commands directory');
    console.log('3. Configure hooks in your settings.json if needed');
    console.log(`4. Test your agent by mentioning it: "Use the ${agentDetails.name} agent to..."`);
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}