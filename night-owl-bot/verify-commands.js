import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { loadConfig } from './utils/config.js';

dotenv.config();

/**
 * Verify that commands are registered in Discord
 */
async function verifyCommands() {
  try {
    const config = await loadConfig();

    if (!config.DISCORD_TOKEN) {
      console.error('❌ DISCORD_TOKEN is not set');
      process.exit(1);
    }

    if (!config.CLIENT_ID) {
      console.error('❌ CLIENT_ID is not set');
      process.exit(1);
    }

    const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

    console.log('🔍 Verifying registered commands...');

    let commands;
    if (config.GUILD_ID) {
      console.log(`Checking guild commands for guild: ${config.GUILD_ID}`);
      commands = await rest.get(
        Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID)
      );
      console.log(`✅ Found ${commands.length} guild command(s):\n`);
    } else {
      console.log('Checking global commands...');
      commands = await rest.get(
        Routes.applicationCommands(config.CLIENT_ID)
      );
      console.log(`✅ Found ${commands.length} global command(s):\n`);
    }

    if (commands.length === 0) {
      console.log('⚠️  No commands found! Run "npm run deploy" to deploy commands.');
      process.exit(1);
    }

    // Display commands
    commands.forEach((cmd, index) => {
      console.log(`${index + 1}. /${cmd.name}`);
      if (cmd.description) {
        console.log(`   Description: ${cmd.description}`);
      }
      if (cmd.options && cmd.options.length > 0) {
        console.log(`   Options: ${cmd.options.length}`);
      }
      console.log('');
    });

    console.log('✅ Command verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying commands:');
    console.error(error);
    
    if (error.status === 401) {
      console.error('\n💡 Unauthorized. Check your DISCORD_TOKEN.');
    } else if (error.status === 403) {
      console.error('\n💡 Forbidden. Check bot permissions.');
    } else if (error.code === 10062) {
      console.error('\n💡 Unknown interaction. Make sure your bot token and client ID are correct.');
    }
    
    process.exit(1);
  }
}

verifyCommands();

