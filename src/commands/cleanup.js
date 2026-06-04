#!/usr/bin/env node

/**
 * Cleanup old TTS audio files
 */

import { program } from 'commander';
import { cleanupOldVoiceFiles } from '../utils/voice/cleanup.js';
import chalk from 'chalk';

program
  .description('Clean up old TTS audio files')
  .option('-d, --directory <path>', 'Directory to clean', process.cwd())
  .option('-a, --age <hours>', 'Maximum age in hours', '1')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .action(async (options) => {
    const maxAgeMs = parseFloat(options.age) * 3600000; // Convert hours to milliseconds
    
    console.log(chalk.cyan(`🧹 Cleaning up TTS files older than ${options.age} hours...`));
    console.log(chalk.gray(`Directory: ${options.directory}`));
    
    if (options.dryRun) {
      console.log(chalk.yellow('(Dry run - no files will be deleted)'));
    }
    
    const result = await cleanupOldVoiceFiles(options.directory, maxAgeMs, options.dryRun);
    
    if (result.error) {
      console.error(chalk.red(`Error: ${result.error}`));
      process.exit(1);
    }
    
    if (result.cleaned === 0) {
      console.log(chalk.green('✓ No old TTS files to clean'));
    } else {
      console.log(chalk.green(`✓ ${options.dryRun ? 'Would clean' : 'Cleaned'} ${result.cleaned} files:`));
      result.files.forEach(file => {
        console.log(chalk.gray(`  - ${file}`));
      });
    }
  });

program.parse(process.argv);