import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { loadConfig } from './utils/config.js';

dotenv.config();

// Load configuration from database (falls back to env vars)
let config = {};

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively find all command files in a directory
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
function getAllCommandFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory does not exist: ${dir}`);
    return files;
  }

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...getAllCommandFiles(fullPath));
      } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }

  return files;
}

/**
 * Load all commands from the commands directory
 * @returns {Promise<Array>} Array of command JSON objects
 */
async function loadCommands() {
  const commands = [];
  const errors = [];
  
  // Use __dirname to get the correct path relative to this file
  const commandsPath = path.join(__dirname, 'commands');
  
  console.log(`📂 Looking for commands in: ${commandsPath}`);
  
  if (!fs.existsSync(commandsPath)) {
    console.error(`❌ Commands directory does not exist: ${commandsPath}`);
    console.log(`Current working directory: ${process.cwd()}`);
    return { commands: [], errors: ['Commands directory does not exist'] };
  }

  const commandFiles = getAllCommandFiles(commandsPath);
  
  console.log(`📋 Found ${commandFiles.length} command file(s).`);

  for (const file of commandFiles) {
    try {
      const relativePath = path.relative(__dirname, file);
      const fileUrl = pathToFileURL(file).href;
      
      // Dynamic import
      const commandModule = await import(fileUrl);
      
      // Validate command structure
      if (!commandModule.data) {
        errors.push(`${relativePath}: Missing 'data' export`);
        console.warn(`⚠️  ${relativePath}: Missing 'data' export`);
        continue;
      }

      if (typeof commandModule.data.toJSON !== 'function') {
        errors.push(`${relativePath}: 'data' is not a SlashCommandBuilder`);
        console.warn(`⚠️  ${relativePath}: 'data' is not a SlashCommandBuilder`);
        continue;
      }

      if (!commandModule.execute || typeof commandModule.execute !== 'function') {
        errors.push(`${relativePath}: Missing 'execute' function`);
        console.warn(`⚠️  ${relativePath}: Missing 'execute' function`);
        continue;
      }

      const commandData = commandModule.data.toJSON();
      
      // Validate command name
      if (!commandData.name) {
        errors.push(`${relativePath}: Command missing name`);
        console.warn(`⚠️  ${relativePath}: Command missing name`);
        continue;
      }

      // Check for duplicates
      const duplicate = commands.find(cmd => cmd.name === commandData.name);
      if (duplicate) {
        errors.push(`${relativePath}: Duplicate command name '${commandData.name}'`);
        console.warn(`⚠️  ${relativePath}: Duplicate command name '${commandData.name}'`);
        continue;
      }

      commands.push(commandData);
      console.log(`✅ Loaded: /${commandData.name} (${relativePath})`);
      
    } catch (err) {
      const relativePath = path.relative(__dirname, file);
      const errorMsg = `${relativePath}: ${err.message}`;
      errors.push(errorMsg);
      console.error(`❌ Error loading ${relativePath}:`, err.message);
      if (err.stack) {
        console.error(err.stack);
      }
    }
  }

  return { commands, errors };
}

/**
 * Deploy commands to Discord
 */
async function deployCommands() {
  try {
    // Load configuration from database
    console.log('📋 Loading configuration...');
    config = await loadConfig();

    // Validate required configuration
    if (!config.DISCORD_TOKEN) {
      console.error('❌ DISCORD_TOKEN is not set in configuration or environment variables');
      process.exit(1);
    }

    if (!config.CLIENT_ID) {
      console.error('❌ CLIENT_ID is not set in configuration or environment variables');
      process.exit(1);
    }

    console.log('🚀 Starting command deployment...');
    console.log(`Bot Client ID: ${config.CLIENT_ID}`);
    console.log(`Deploy Type: ${config.GUILD_ID ? 'Guild (Development)' : 'Global (Production)'}`);

    // Load all commands
    const { commands, errors } = await loadCommands();

    if (commands.length === 0) {
      console.error('❌ No valid commands found to deploy!');
      if (errors.length > 0) {
        console.error('\nErrors:');
        errors.forEach(err => console.error(`  - ${err}`));
      }
      process.exit(1);
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Valid commands: ${commands.length}`);
    if (errors.length > 0) {
      console.log(`  ⚠️  Errors/Warnings: ${errors.length}`);
    }

    // Display command names
    console.log(`\n📋 Commands to deploy:`);
    commands.forEach(cmd => {
      console.log(`  - /${cmd.name}${cmd.description ? `: ${cmd.description}` : ''}`);
    });

    // Initialize REST client
    const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

    // Deploy commands
    console.log('\n🔄 Deploying commands to Discord...');

    let data;
    if (config.GUILD_ID) {
      // Deploy to guild (faster, for development)
      console.log(`Deploying to guild: ${config.GUILD_ID}`);
      data = await rest.put(
        Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} guild command(s).`);
    } else {
      // Deploy globally (slower, for production)
      console.log('Deploying globally (this may take up to 1 hour to propagate)...');
      data = await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} global command(s).`);
      console.log('⚠️  Note: Global commands may take up to 1 hour to appear in all servers.');
    }

    // Display deployed commands
    console.log('\n📋 Deployed Commands:');
    data.forEach(cmd => {
      console.log(`  ✅ /${cmd.name}`);
    });

    if (errors.length > 0) {
      console.log('\n⚠️  Warnings/Errors encountered:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n✨ Command deployment completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error deploying commands:');
    console.error(error);
    
    if (error.code === 50035) {
      console.error('\n💡 Invalid command data. Check your command structure.');
    } else if (error.code === 10062) {
      console.error('\n💡 Unknown interaction. Make sure your bot token and client ID are correct.');
    } else if (error.code === 50001) {
      console.error('\n💡 Missing access. Make sure your bot has the application.commands scope.');
    } else if (error.status === 401) {
      console.error('\n💡 Unauthorized. Check your DISCORD_TOKEN.');
    } else if (error.status === 403) {
      console.error('\n💡 Forbidden. Check bot permissions and that the bot is in the guild (if using GUILD_ID).');
    }
    
    process.exit(1);
  }
}

// Run deployment
deployCommands();
