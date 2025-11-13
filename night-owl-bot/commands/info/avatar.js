import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Gets the avatar of a user.')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('User to get avatar for')
      .setRequired(false)
  );

  export const category = 'Information'; // Command category

export async function execute(interaction) {
  // Defer reply immediately to avoid timeout
  await interaction.deferReply();

  const user = interaction.options.getUser('target') || interaction.user;

  const embed = new EmbedBuilder()
    .setTitle(`${user.tag}'s Avatar`)
    .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
    .setColor('Purple')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
