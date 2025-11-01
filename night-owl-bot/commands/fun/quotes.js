import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const quotes = [
  "Simplicity is the ultimate sophistication.",
  "Colors speak louder than words.",
  "Find beauty in the everyday.",
  "Quiet moments hold the deepest meaning.",
  "Dream in pastel hues and starlit skies.",
  "Embrace the calm, embody the night.",
  "Art is the heartbeat of the soul.",
  "Less noise, more essence.",
];

export const data = new SlashCommandBuilder()
  .setName('quotes')
  .setDescription('Get a beautifully styled aesthetic quote.');

export const category = 'Fun'; // Command category

export async function execute(interaction) {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const embed = new EmbedBuilder()
    .setTitle('🌸 Aesthetic Quote')
    .setDescription(`*${quote}*`)
    .setColor('Purple')
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
