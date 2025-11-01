import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('colorpicker')
  .setDescription('Pick a color from the dropdown.');

export const category = 'Fun'; // Command category

export async function execute(interaction) {
  const colors = [
    { label: 'Red', value: '#FF0000', description: 'Bright Red' },
    { label: 'Green', value: '#00FF00', description: 'Bright Green' },
    { label: 'Blue', value: '#0000FF', description: 'Bright Blue' },
    { label: 'Purple', value: '#800080', description: 'Purple' },
    { label: 'Orange', value: '#FFA500', description: 'Orange' },
    { label: 'Random', value: 'random', description: 'Pick a random color!' },
  ];

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_color')
    .setPlaceholder('Choose a color')
    .addOptions(colors);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setTitle('🎨 Color Picker')
    .setDescription('Select a color from the dropdown below!')
    .setColor('Blurple');

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
