import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const moods = {
  calm: {
    description: "Soft pastels and gentle blues to soothe your spirit.",
    colors: ["#A8DADC", "#F1FAEE", "#457B9D"],
  },
  energetic: {
    description: "Vibrant reds and oranges to fuel your fire.",
    colors: ["#E63946", "#F4A261", "#E76F51"],
  },
  mysterious: {
    description: "Deep purples and blacks for the enigmatic soul.",
    colors: ["#6A0572", "#320A3B", "#9D4EDD"],
  },
};

export const data = new SlashCommandBuilder()
  .setName('mood')
  .setDescription('Choose a mood to get a theme or color palette suggestion.')
  .addStringOption(option =>
    option
      .setName('mood')
      .setDescription('Select your current mood')
      .setRequired(true)
      .addChoices(
        { name: 'Calm', value: 'calm' },
        { name: 'Energetic', value: 'energetic' },
        { name: 'Mysterious', value: 'mysterious' },
      ));

export const category = 'Fun'; // Command category

export async function execute(interaction) {
  const mood = interaction.options.getString('mood');
  const theme = moods[mood];

  const embed = new EmbedBuilder()
    .setTitle(`🎭 Mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`)
    .setDescription(theme.description)
    .setColor(theme.colors[0])
    .addFields(
      { name: 'Suggested Colors', value: theme.colors.join(' | '), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
