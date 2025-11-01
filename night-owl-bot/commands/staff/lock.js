// commands/lock.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Lock the current channel (deny send messages to everyone)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
  try {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });
    await interaction.reply('🔒 Channel locked.');
  } catch (e) {
    console.error(e);
    await interaction.reply({ content: '❌ Failed to lock channel.', ephemeral: true });
  }
}
