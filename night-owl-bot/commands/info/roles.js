import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('roles')
  .setDescription('Lists all roles in the server.');

  export const category = 'Information'; // Command category

export async function execute(interaction) {
  const roles = interaction.guild.roles.cache
    .filter(role => role.id !== interaction.guild.id) // exclude @everyone
    .sort((a, b) => b.position - a.position)
    .map(role => role.toString())
    .join(', ') || 'No roles';

  const embed = new EmbedBuilder()
    .setTitle(`Roles in ${interaction.guild.name}`)
    .setDescription(roles)
    .setColor('Orange')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
