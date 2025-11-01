// commands/slowmode.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('Set slowmode for the current channel')
  .addIntegerOption(opt => opt.setName('seconds').setDescription('Seconds for slowmode (0 to disable)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
  const seconds = interaction.options.getInteger('seconds');
  if (seconds < 0 || seconds > 21600) {
    return interaction.reply({ content: '❌ Slowmode must be between 0 and 21600 seconds.', ephemeral: true });
  }
  try {
    await interaction.channel.setRateLimitPerUser(seconds);
    await interaction.reply({ content: `✅ Slowmode set to ${seconds} seconds.` , ephemeral: true });
  } catch (e) {
    console.error(e);
    await interaction.reply({ content: '❌ Failed to set slowmode.', ephemeral: true });
  }
}
