#!/usr/bin/env node

// Simple Node.js script to run the cleanup utility
const { spawn } = require('child_process');
const path = require('path');

const utilPath = path.join(__dirname, '../utils/cleanup-orphaned-images.ts');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
const skipDbCheck = args.includes('--skip-db-check') || args.includes('-s');
const hoursArg = args.find(arg => arg.startsWith('--hours='));
const hours = hoursArg ? hoursArg.split('=')[1] : '24';

if (isDryRun) {
}

// Build command arguments
const cmdArgs = ['--loader', 'ts-node/esm', utilPath];
if (isDryRun) cmdArgs.push('--dry-run');
if (skipDbCheck) cmdArgs.push('--skip-db-check');
cmdArgs.push(`--hours=${hours}`);

// Run the TypeScript file with ts-node
const child = spawn('node', cmdArgs, {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
});

child.on('close', (code) => {
  if (code === 0) {
  } else {
    process.exit(code);
  }
});

child.on('error', (error) => {
  process.exit(1);
});
