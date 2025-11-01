import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Shows info about the bot.');

export const category = 'General'; // Command category

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('NightOwl')
    .setDescription('This bot helps you manage your server and has cool commands!')
    .setColor('Blurple')
    .addFields(
      { name: 'Developer', value: 'Profiles After Dark', inline: true },
      { name: 'Library', value: 'discord.js v14', inline: true },
      { name: 'Latency', value: `${Date.now() - interaction.createdTimestamp}ms`, inline: true }
    )
    .setTimestamp()
    .setAuthor({name: "NightOwl 🌙 Showcasing aesthetic profiles"});

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
