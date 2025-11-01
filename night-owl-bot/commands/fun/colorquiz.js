import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

const quizData = {
  question: "Which color best represents calmness?",
  options: [
    { label: "Red", value: "red" },
    { label: "Blue", value: "blue" },
    { label: "Yellow", value: "yellow" },
    { label: "Green", value: "green" },
  ],
  correct: "blue",
  explanation: "Blue is often associated with calmness and tranquility.",
};

export const data = new SlashCommandBuilder()
  .setName('colorquiz')
  .setDescription('Take a quick color quiz to test your vibe!');

export const category = 'Fun'; // Command category

export async function execute(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('colorquiz_select')
      .setPlaceholder('Select the color you think fits best')
      .addOptions(quizData.options),
  );

  const embed = new EmbedBuilder()
    .setTitle('🎨 Color Quiz')
    .setDescription(quizData.question)
    .setColor('Blue');

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

  const filter = i => i.customId === 'colorquiz_select' && i.user.id === interaction.user.id;

  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

  collector.on('collect', async i => {
    await i.deferUpdate();

    if (i.values[0] === quizData.correct) {
      await i.editReply({
        content: `✅ Correct! ${quizData.explanation}`,
        embeds: [],
        components: [],
      });
    } else {
      await i.editReply({
        content: `❌ Oops! The correct answer is **Blue**. ${quizData.explanation}`,
        embeds: [],
        components: [],
      });
    }
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: '⌛ Time’s up! Try again later.', embeds: [], components: [] });
    }
  });
}
