// commands/purge.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Delete a number of messages from the channel')
  .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
  const amount = interaction.options.getInteger('amount');
  if (amount < 1 || amount > 100) {
    return interaction.reply({ content: '❌ Amount must be between 1 and 100.', ephemeral: true });
  }
  try {
    const deleted = await interaction.channel.bulkDelete(amount, true);
    await interaction.reply({ content: `🧹 Deleted ${deleted.size} messages.`, ephemeral: true });
  } catch (e) {
    console.error(e);
    await interaction.reply({ content: '❌ Failed to delete messages.', ephemeral: true });
  }
}
