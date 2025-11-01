import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Recursively find all `.js` (or `.ts` in dev) files inside a folder.
 */
function getAllCommandFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllCommandFiles(fullPath));
    } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function loadCommands() {
  const commands = [];
  const foldersPath = path.resolve(process.cwd(), 'commands'); // ensure correct absolute path
  const commandFiles = getAllCommandFiles(foldersPath);

  console.log(`Found ${commandFiles.length} command files.`);

  for (const file of commandFiles) {
    try {
      const command = await import(pathToFileURL(file).href);
      if (command.data && typeof command.data.toJSON === 'function') {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command from ${file}`);
      } else {
        console.warn(`⚠️ Skipped ${file}: Missing 'data' export or 'toJSON'.`);
      }
    } catch (err) {
      console.error(`❌ Error loading command ${file}:`, err);
    }
  }

  return commands;
}

(async () => {
  try {
    const commands = await loadCommands();

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    console.log(`🔄 Refreshing ${commands.length} slash commands...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Slash commands reloaded successfully.');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
