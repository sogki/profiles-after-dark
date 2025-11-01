// commands/remind.js
import { SlashCommandBuilder } from 'discord.js';

const reminders = [];

function parseTime(input) {
  const regex = /^(\d+)(s|m|h|d)$/;
  const match = input.toLowerCase().match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
  }
  return null;
}

export const data = new SlashCommandBuilder()
  .setName('remind')
  .setDescription('Set a reminder')
  .addStringOption(opt => opt.setName('time').setDescription('When to remind (e.g. 10m)').setRequired(true))
  .addStringOption(opt => opt.setName('message').setDescription('What to remind').setRequired(true));

export const category = 'General'; // Command category

export async function execute(interaction) {
  const timeStr = interaction.options.getString('time');
  const message = interaction.options.getString('message');
  const ms = parseTime(timeStr);

  if (!ms) {
    return interaction.reply({ content: '❌ Invalid time format! Use s, m, h, or d (e.g. 10m).', ephemeral: true });
  }

  await interaction.reply(`⏰ Reminder set for ${timeStr}. I will DM you then.`);

  setTimeout(async () => {
    try {
      const user = await interaction.client.users.fetch(interaction.user.id);
      await user.send(`⏰ Reminder: ${message}`);
    } catch {
      // DM failed, maybe user blocked DMs
    }
  }, ms);
}
