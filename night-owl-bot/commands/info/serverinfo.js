import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Displays information about the server.');

  export const category = 'Information'; // Command category

export async function execute(interaction) {
  const { guild } = interaction;

  const embed = new EmbedBuilder()
    .setTitle(`Server Info: ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .addFields(
      { name: 'Server ID', value: guild.id, inline: true },
      { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
      { name: 'Members', value: `${guild.memberCount}`, inline: true },
      { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
      { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
      { name: 'Boost Level', value: `Tier ${guild.premiumTier}`, inline: true }
    )
    .setColor('Green')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
