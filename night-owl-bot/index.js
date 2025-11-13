import {
  Client,
  Collection,
  GatewayIntentBits,
  ActivityType,
} from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { loadConfig, getConfig } from "./utils/config.js";
import { cacheDeletedMessage } from "./commands/staff/modlogs.js";
import { syncDiscordUser } from "./utils/webhooks.js";

// Load dotenv first
dotenv.config();

// Log that bot is starting
console.log('🤖 Discord Bot Worker Process Starting...');
console.log(`📅 Started at: ${new Date().toISOString()}`);

// Load configuration from database (falls back to env vars)
let config = {};

const intentsArray = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
];

// DEBUG: Check if any intent is undefined
if (intentsArray.some((i) => i === undefined)) {
  console.error(
    "One or more intents are undefined! Check your GatewayIntentBits imports."
  );
  process.exit(1);
}

console.log("DEBUG: Intents array values:", intentsArray);

const client = new Client({
  intents: intentsArray,
});

client.commands = new Collection();

async function loadCommands() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const foldersPath = path.join(__dirname, "commands");
  
  if (!fs.existsSync(foldersPath)) {
    console.error(`❌ Commands directory does not exist: ${foldersPath}`);
    return;
  }

  const commandFolders = fs.readdirSync(foldersPath, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name);

  console.log(`📂 Loading commands from ${commandFolders.length} category(ies)...`);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    console.log(`  📁 ${folder}: ${commandFiles.length} command(s)`);

    for (const file of commandFiles) {
      try {
        const filePath = path.resolve(commandsPath, file);
        const commandModule = await import(pathToFileURL(filePath).href);

        if (!commandModule.data) {
          console.warn(`    ⚠️  ${file}: Missing 'data' export`);
          continue;
        }

        if (!commandModule.execute) {
          console.warn(`    ⚠️  ${file}: Missing 'execute' function`);
          continue;
        }

        // Assign category if exists, else use folder name
        commandModule.category ??= folder.charAt(0).toUpperCase() + folder.slice(1);

        // Store command and category on the object for help command usage
        client.commands.set(commandModule.data.name, commandModule);
        console.log(`    ✅ Loaded: /${commandModule.data.name}`);
      } catch (error) {
        console.error(`    ❌ Error loading ${file}:`, error.message);
      }
    }
  }

  console.log(`✨ Loaded ${client.commands.size} command(s) total.`);
}

(async () => {
  try {
    console.log('🤖 ========================================');
    console.log('🤖 Discord Bot Worker Process Starting...');
    console.log('🤖 ========================================');
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🔧 Node version: ${process.version}`);
    console.log(`📁 Working directory: ${process.cwd()}`);
    
    // Load configuration from database
    console.log('📋 Loading configuration...');
    config = await loadConfig();
    
    // Log loaded config keys (without secret values)
    const publicKeys = Object.keys(config).filter(key => 
      !key.includes('TOKEN') && 
      !key.includes('KEY') && 
      !key.includes('SECRET') &&
      !key.includes('PASSWORD')
    );
    console.log(`📦 Loaded config keys: ${publicKeys.join(', ')}`);
    if (Object.keys(config).length - publicKeys.length > 0) {
      console.log(`🔐 Loaded ${Object.keys(config).length - publicKeys.length} secret key(s) from database`);
    }
    
    // Verify required config values
    if (!config.DISCORD_TOKEN) {
      console.error('❌ DISCORD_TOKEN is not set in configuration or environment variables');
      console.error('💡 Please run: npm run setup:config');
      console.error('💡 Or set DISCORD_TOKEN in .env file');
      process.exit(1);
    }

    // Verify Supabase config
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
      console.error('💡 These are required to load commands and sync users');
    }

    console.log('✅ Configuration loaded successfully');
    await loadCommands();

    // Add error handlers before login
    client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });

    client.on('warn', (warning) => {
      console.warn('⚠️ Discord client warning:', warning);
    });

    client.on('disconnect', () => {
      console.warn('⚠️ Bot disconnected from Discord');
    });

    client.on('reconnecting', () => {
      console.log('🔄 Bot reconnecting to Discord...');
    });

    client.once("ready", async () => {
      console.log(`✅ NightOwl is online as ${client.user.tag}`);
      console.log(`🆔 Bot ID: ${client.user.id}`);
      console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);

      // Deploy commands on startup if GUILD_ID is set
      if (config.GUILD_ID) {
        try {
          console.log(`🔄 Deploying commands to guild: ${config.GUILD_ID}...`);
          const { REST, Routes } = await import('discord.js');
          const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
          
          const commands = [];
          for (const [name, command] of client.commands.entries()) {
            if (command.data) {
              commands.push(command.data.toJSON());
            }
          }

          if (commands.length > 0) {
            const data = await rest.put(
              Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
              { body: commands }
            );
            console.log(`✅ Successfully deployed ${data.length} guild command(s).`);
          }
        } catch (error) {
          console.error('❌ Failed to deploy commands on startup:', error.message);
          console.error('💡 You may need to manually run: npm run deploy');
        }
      } else {
        console.log('⚠️  GUILD_ID not set - commands will need to be deployed globally');
        console.log('💡 Run: npm run deploy (this may take up to 1 hour for global commands)');
      }

      client.user.setPresence({
        activities: [
          { name: "profilesafterdark.com", type: ActivityType.Watching },
        ],
        status: "idle",
      });

      // Sync Discord users on startup
      try {
        console.log('Syncing Discord users...');
        for (const guild of client.guilds.cache.values()) {
          const members = await guild.members.fetch({ limit: 100 }).catch(() => new Map());
          
          for (const member of members.values()) {
            if (member.user.bot) continue;

            await syncDiscordUser(member.user.id, {
              guild_id: guild.id,
              username: member.user.username,
              discriminator: member.user.discriminator,
              avatar_url: member.user.displayAvatarURL(),
              joined_at: member.joinedAt?.toISOString()
            });
          }
        }
        console.log('Discord users synced successfully');
      } catch (error) {
        console.error('Error syncing Discord users:', error);
      }
    });

    client.on("messageDelete", (message) => {
      if (!message.guild) return;

      const cached = {
        id: message.id,
        content: message.content,
        author: message.author ?? { tag: "Unknown", id: "Unknown" },
        channelId: message.channel.id,
        attachments: message.attachments,
        stickers: message.stickers,
        deletedAt: new Date(),
      };

      cacheDeletedMessage(message.guild.id, cached);
    });

    client.on("guildMemberAdd", async (member) => {
      if (member.user.bot) return;

      try {
        await syncDiscordUser(member.user.id, {
          guild_id: member.guild.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          avatar_url: member.user.displayAvatarURL(),
          joined_at: member.joinedAt?.toISOString()
        });
      } catch (error) {
        console.error('Error syncing new member:', error);
      }
    });

    client.on("userUpdate", async (oldUser, newUser) => {
      try {
        // Update Discord user data when user info changes
        for (const guild of client.guilds.cache.values()) {
          const member = await guild.members.fetch(newUser.id).catch(() => null);
          if (!member || member.user.bot) continue;

          await syncDiscordUser(newUser.id, {
            guild_id: guild.id,
            username: newUser.username,
            discriminator: newUser.discriminator,
            avatar_url: newUser.displayAvatarURL(),
            joined_at: member.joinedAt?.toISOString()
          });
        }
      } catch (error) {
        console.error('Error syncing user update:', error);
      }
    });

    client.on("interactionCreate", async (interaction) => {
      // Handle select menu interactions
      if (interaction.isStringSelectMenu()) {
        try {
          // Try to handle help command select menu
          const helpCommand = client.commands.get('help');
          if (helpCommand && helpCommand.handleHelpInteraction) {
            const handled = await helpCommand.handleHelpInteraction(interaction);
            if (handled) return;
          }

          // Try to handle gallery command select menu
          const galleryCommand = client.commands.get('gallery');
          if (galleryCommand && galleryCommand.handleGalleryInteraction) {
            const handled = await galleryCommand.handleGalleryInteraction(interaction);
            if (handled) return;
          }
        } catch (error) {
          console.error('Error handling select menu interaction:', error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "⚠️ There was an error processing this interaction.",
              ephemeral: true,
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              content: "⚠️ There was an error processing this interaction.",
            });
          }
        }
        return;
      }

      // Handle button interactions (for pagination, etc.)
      if (interaction.isButton()) {
        try {
          // Try to handle help command buttons
          const helpCommand = client.commands.get('help');
          if (helpCommand && helpCommand.handleHelpInteraction) {
            const handled = await helpCommand.handleHelpInteraction(interaction);
            if (handled) return;
          }

          // Try to handle gallery command buttons
          const galleryCommand = client.commands.get('gallery');
          if (galleryCommand && galleryCommand.handleGalleryInteraction) {
            const handled = await galleryCommand.handleGalleryInteraction(interaction);
            if (handled) return;
          }

          // Try to handle button interaction in search command
          const searchCommand = client.commands.get('search');
          if (searchCommand && searchCommand.handleButtonInteraction) {
            const handled = await searchCommand.handleButtonInteraction(interaction);
            if (handled) return;
          }

          // Add more button handlers here as needed
        } catch (error) {
          console.error('Error handling button interaction:', error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "⚠️ There was an error processing this interaction.",
              ephemeral: true,
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              content: "⚠️ There was an error processing this interaction.",
            });
          }
        }
        return;
      }

      // Handle autocomplete interactions
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command && command.autocomplete) {
          try {
            await command.autocomplete(interaction);
          } catch (error) {
            console.error('Error handling autocomplete:', error);
          }
        }
        return;
      }

      // Handle slash commands
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) {
        // Unknown command - respond quickly
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Unknown command. Use `/help` to see available commands.",
            ephemeral: true,
          });
        }
        return;
      }

      try {
        // Execute command with timeout protection
        const timeout = setTimeout(async () => {
          if (!interaction.replied && !interaction.deferred) {
            try {
              await interaction.deferReply({ ephemeral: true });
            } catch (err) {
              // Already responded or expired
            }
          }
        }, 2500); // Defer at 2.5 seconds to be safe

        await command.execute(interaction);
        clearTimeout(timeout);
      } catch (error) {
        console.error('Command execution error:', error);
        
        // Handle unknown interaction errors gracefully
        if (error.code === 10062) {
          console.warn('Interaction expired - command took too long to respond');
          return; // Don't try to respond to expired interactions
        }
        
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({
              content: "⚠️ There was an error executing this command.",
              ephemeral: true,
            });
          } catch (err) {
            if (err.code !== 10062) {
              console.error('Failed to send error response:', err);
            }
          }
        } else if (interaction.deferred) {
          try {
            await interaction.editReply({
              content: "⚠️ There was an error executing this command.",
            });
          } catch (err) {
            if (err.code !== 10062) {
              console.error('Failed to edit error response:', err);
            }
          }
        }
      }
    });

    // Use config from database (already loaded, no fallback needed)
    const token = config.DISCORD_TOKEN;
    if (!token) {
      console.error('❌ DISCORD_TOKEN is required to start the bot');
      console.error('💡 Set it in the database bot_config table or run: npm run setup:config');
      process.exit(1);
    }
    
    console.log('🚀 Starting bot...');
    console.log(`🔑 Token length: ${token ? token.length : 0} characters`);
    console.log(`🔑 Token starts with: ${token ? token.substring(0, 10) + '...' : 'N/A'}`);
    
    try {
      await client.login(token);
      console.log('✅ Login attempt completed');
    } catch (loginError) {
      console.error('❌ Login failed:', loginError);
      console.error('Error details:', {
        message: loginError.message,
        code: loginError.code,
        stack: loginError.stack
      });
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during client setup:", error);
    console.error("Error stack:", error.stack);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  console.error('Error stack:', error.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
});
