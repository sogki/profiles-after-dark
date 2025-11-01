import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows a list of all commands.');

export const category = 'General'; // Command category

export async function execute(interaction) {
  const commands = interaction.client.commands;

  // Group commands by category
  const categories = {};

  for (const [name, command] of commands) {
    if (!command?.data) continue;

    const category = command.category || 'Uncategorized';

    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({
      name,
      description: command.data.description || 'No description',
    });
  }

  // Create select menu options for each category
  const options = Object.entries(categories).map(([cat, cmds]) => ({
    label: cat,
    description: `${cmds.length} command${cmds.length > 1 ? 's' : ''}`,
    value: cat.toLowerCase().replace(/\s+/g, '-'),
  }));

  // If no categories found, just show a simple embed
  if (options.length === 0) {
    return interaction.reply({
      content: 'No commands found.',
      ephemeral: true,
    });
  }

  // Send initial embed with categories list
  const embed = new EmbedBuilder()
    .setTitle('📜 NightOwl Bot Commands')
    .setDescription('Select a category from the menu below to see commands.')
    .setColor('Blurple');

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help-select-category')
      .setPlaceholder('Choose a command category')
      .addOptions(options)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

  // Create a collector to handle menu selection
  const filter = i => i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    componentType: 'STRING_SELECT',
    time: 60_000, // 60 seconds timeout
  });

  collector.on('collect', async i => {
    if (i.customId !== 'help-select-category') return;

    const selectedCategory = i.values[0];
    const categoryName = Object.keys(categories).find(
      cat => cat.toLowerCase().replace(/\s+/g, '-') === selectedCategory
    );

    if (!categoryName) {
      return i.update({ content: 'Invalid category selected.', components: [], embeds: [], ephemeral: true });
    }

    const cmds = categories[categoryName];

    const cmdsEmbed = new EmbedBuilder()
      .setTitle(`📂 ${categoryName} Commands`)
      .setColor('Blurple')
      .setDescription(
        cmds
          .map(cmd => `**/${cmd.name}** — ${cmd.description}`)
          .join('\n')
      )
      .setFooter({ text: 'Select another category to view more commands.' })
      .setTimestamp();

    // Update the message with commands in the selected category
    await i.update({ embeds: [cmdsEmbed], components: [row], ephemeral: true });
  });

  collector.on('end', () => {
    // Disable the menu after timeout
    const disabledRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help-select-category')
        .setPlaceholder('Help menu expired')
        .setDisabled(true)
        .addOptions(options)
    );
    interaction.editReply({ components: [disabledRow] }).catch(() => {});
  });
}
