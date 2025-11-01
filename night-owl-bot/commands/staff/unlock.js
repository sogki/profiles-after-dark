// commands/unlock.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Unlock the current channel (allow send messages to everyone)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
  try {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });
    await interaction.reply('🔓 Channel unlocked.');
  } catch (e) {
    console.error(e);
    await interaction.reply({ content: '❌ Failed to unlock channel.', ephemeral: true });
  }
}
