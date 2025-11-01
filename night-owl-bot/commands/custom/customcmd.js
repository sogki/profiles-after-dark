// commands/customcmd.js
import { SlashCommandBuilder } from 'discord.js';

// In-memory storage example — replace with DB in production
const customCommands = new Map();

export const data = new SlashCommandBuilder()
  .setName('customcmd')
  .setDescription('Add or run a custom command')
  .addSubcommand(sub =>
    sub.setName('add')
      .setDescription('Add a new custom command')
      .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true))
      .addStringOption(opt => opt.setName('response').setDescription('Response text').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('run')
      .setDescription('Run a custom command')
      .addStringOption(opt => opt.setName('name').setDescription('Command name').setRequired(true))
  );

export const category = 'Custom'; // Command category

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const name = interaction.options.getString('name').toLowerCase();

  if (subcommand === 'add') {
    const response = interaction.options.getString('response');
    customCommands.set(name, response);
    await interaction.reply(`✅ Custom command \`${name}\` added!`);
  } else if (subcommand === 'run') {
    if (!customCommands.has(name)) {
      return interaction.reply({ content: `❌ Command \`${name}\` not found.`, ephemeral: true });
    }
    await interaction.reply(customCommands.get(name));
  }
}
