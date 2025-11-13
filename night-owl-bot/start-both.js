// Combined startup script that runs both API server and Discord bot
// This ensures both processes start when Railway deploys

import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting both API server and Discord bot...');
console.log(`📅 Started at: ${new Date().toISOString()}`);

// Start API server
console.log('🌐 Starting API server...');
const apiProcess = fork('api/server.js', [], {
  cwd: __dirname,
  stdio: 'inherit',
  silent: false
});

apiProcess.on('error', (error) => {
  console.error('❌ Failed to start API server:', error);
});

apiProcess.on('exit', (code, signal) => {
  console.error(`❌ API server process exited with code ${code} and signal ${signal}`);
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});

// Start Discord bot
console.log('🤖 Starting Discord bot...');
const botProcess = fork('index.js', [], {
  cwd: __dirname,
  stdio: 'inherit',
  silent: false
});

botProcess.on('error', (error) => {
  console.error('❌ Failed to start Discord bot:', error);
});

botProcess.on('exit', (code, signal) => {
  console.error(`❌ Discord bot process exited with code ${code} and signal ${signal}`);
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});

// Handle shutdown signals
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down both processes...`);
  apiProcess.kill(signal);
  botProcess.kill(signal);
  
  // Force exit after 10 seconds if processes don't exit gracefully
  setTimeout(() => {
    console.error('⚠️ Forcing exit after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Keep the main process alive
process.on('exit', () => {
  console.log('👋 Main process exiting...');
});

