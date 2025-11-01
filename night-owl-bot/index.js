import {
  Client,
  Collection,
  GatewayIntentBits,
  ActivityType,
} from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import dotenv from "dotenv";
import { cacheDeletedMessage } from "./commands/staff/modlogs.js";
import { syncDiscordUser } from "./utils/webhooks.js";

dotenv.config();

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
  const foldersPath = path.join("./commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.resolve(commandsPath, file);
      const commandModule = await import(pathToFileURL(filePath).href);

      // Assign category if exists, else 'Uncategorized'
      commandModule.category ??= "Uncategorized";

      // Store command and category on the object for help command usage
      client.commands.set(commandModule.data.name, commandModule);
    }
  }
}

(async () => {
  try {
    await loadCommands();

    client.once("ready", async () => {
      console.log(`NightOwl is online as ${client.user.tag}`);

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
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "⚠️ There was an error executing this command.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: "⚠️ There was an error executing this command.",
          });
        }
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error during client setup:", error);
  }
})();
