import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Checks the bot latency.');

  export const category = 'Information'; // Command category

export async function execute(interaction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;

  await interaction.editReply(`🏓 Pong! Latency is ${latency}ms.`);
}
