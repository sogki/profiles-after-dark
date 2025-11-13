import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows a list of all commands with categories and pagination.');

export const category = 'General';

// Store active help sessions
const helpSessions = new Map();

const COMMANDS_PER_PAGE = 8;
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Category icons and colors
const categoryInfo = {
  'General': { icon: '⚙️', color: 0x5865F2, description: 'General bot commands' },
  'Gallery': { icon: '🖼️', color: 0x9B59B6, description: 'Browse and search content' },
  'Information': { icon: 'ℹ️', color: 0x3498DB, description: 'Get information about users and servers' },
  'Fun': { icon: '🎮', color: 0xE91E63, description: 'Fun and entertainment commands' },
  'Moderation': { icon: '🛡️', color: 0xE74C3C, description: 'Staff moderation tools' },
  'Custom': { icon: '✨', color: 0xF39C12, description: 'Custom server commands' },
  'Uncategorized': { icon: '📦', color: 0x95A5A6, description: 'Uncategorized commands' }
};

function getCategoryInfo(categoryName) {
  return categoryInfo[categoryName] || {
    icon: '📦',
    color: 0x95A5A6,
    description: 'Commands'
  };
}

function createHelpEmbed(categories, selectedCategory = null, page = 0) {
  if (!selectedCategory) {
    // Main help menu
    const embed = new EmbedBuilder()
      .setTitle('📜 NightOwl Bot Commands')
      .setDescription('Select a category from the dropdown below to view commands.\n\n**Categories:**')
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: 'Use the dropdown to browse commands by category' });

    // Add category list
    const categoryList = Object.entries(categories)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, cmds]) => {
        const info = getCategoryInfo(cat);
        return `${info.icon} **${cat}** — ${cmds.length} command${cmds.length !== 1 ? 's' : ''}`;
      })
      .join('\n');

    embed.addFields({
      name: 'Available Categories',
      value: categoryList || 'No categories available',
      inline: false
    });

    return embed;
  }

  // Category-specific view with pagination
  const commands = categories[selectedCategory] || [];
  const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);
  const startIndex = page * COMMANDS_PER_PAGE;
  const endIndex = Math.min(startIndex + COMMANDS_PER_PAGE, commands.length);
  const pageCommands = commands.slice(startIndex, endIndex);

  const info = getCategoryInfo(selectedCategory);

  const embed = new EmbedBuilder()
    .setTitle(`${info.icon} ${selectedCategory} Commands`)
    .setDescription(info.description)
    .setColor(info.color)
    .setTimestamp();

  if (pageCommands.length === 0) {
    embed.addFields({
      name: 'No Commands',
      value: 'This category has no commands.',
      inline: false
    });
  } else {
    const commandsList = pageCommands
      .map((cmd, idx) => {
        const num = startIndex + idx + 1;
        return `**${num}.** \`/${cmd.name}\`\n   ${cmd.description || 'No description'}`;
      })
      .join('\n\n');

    embed.addFields({
      name: 'Commands',
      value: commandsList,
      inline: false
    });

    if (totalPages > 1) {
      embed.setFooter({ 
        text: `Page ${page + 1} of ${totalPages} • Showing ${startIndex + 1}-${endIndex} of ${commands.length} commands` 
      });
    } else {
      embed.setFooter({ 
        text: `${commands.length} command${commands.length !== 1 ? 's' : ''} in this category` 
      });
    }
  }

  return embed;
}

function createCategorySelectMenu(categories, selectedCategory = null) {
  const options = Object.entries(categories)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, cmds]) => {
      const info = getCategoryInfo(cat);
      return {
        label: cat,
        description: `${cmds.length} command${cmds.length !== 1 ? 's' : ''}`,
        value: cat.toLowerCase().replace(/\s+/g, '-'),
        emoji: info.icon,
        default: selectedCategory && cat.toLowerCase().replace(/\s+/g, '-') === selectedCategory.toLowerCase().replace(/\s+/g, '-')
      };
    });

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help-category-select')
      .setPlaceholder(selectedCategory ? `Selected: ${selectedCategory}` : 'Choose a command category')
      .addOptions(options.slice(0, 25)) // Discord limit is 25 options
  );
}

function createPaginationButtons(selectedCategory, page, totalPages, sessionId) {
  if (!selectedCategory || totalPages <= 1) {
    return null; // No pagination needed
  }

  const buttons = new ActionRowBuilder();

  // Previous button
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`help-prev-${sessionId}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0)
  );

  // Page indicator (non-clickable)
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`help-page-${sessionId}`)
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  // Next button
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`help-next-${sessionId}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1)
  );

  // Back to categories button
  buttons.addComponents(
    new ButtonBuilder()
      .setCustomId(`help-back-${sessionId}`)
      .setLabel('📂 Categories')
      .setStyle(ButtonStyle.Primary)
  );

  return buttons;
}

export async function execute(interaction) {
  // Defer reply immediately
  await interaction.deferReply({ ephemeral: true });

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

  // Sort commands within each category
  Object.keys(categories).forEach(cat => {
    categories[cat].sort((a, b) => a.name.localeCompare(b.name));
  });

  if (Object.keys(categories).length === 0) {
    return await interaction.editReply({
      content: '❌ No commands found.',
    });
  }

  // Create session
  const sessionId = `${interaction.user.id}_${Date.now()}`;
  helpSessions.set(sessionId, {
    categories,
    selectedCategory: null,
    page: 0,
    userId: interaction.user.id,
    createdAt: Date.now()
  });

  // Clean up old sessions
  for (const [id, session] of helpSessions.entries()) {
    if (Date.now() - session.createdAt > SESSION_TIMEOUT) {
      helpSessions.delete(id);
    }
  }

  // Create initial embed and components
  const embed = createHelpEmbed(categories);
  const categoryMenu = createCategorySelectMenu(categories);
  const components = [categoryMenu];

  await interaction.editReply({
    embeds: [embed],
    components
  });
}

// Handle select menu and button interactions
export async function handleHelpInteraction(interaction) {
  const customId = interaction.customId;

  if (!customId.startsWith('help-')) return false;

  // Extract session ID from custom ID
  let sessionId = null;
  let action = null;

  if (customId.startsWith('help-category-select')) {
    // Category selection
    const session = Array.from(helpSessions.entries())
      .find(([_, s]) => s.userId === interaction.user.id && Date.now() - s.createdAt < SESSION_TIMEOUT);

    if (!session) {
      await interaction.reply({
        content: '⏱️ This help session has expired. Please run `/help` again.',
        ephemeral: true
      });
      return true;
    }

    sessionId = session[0];
    const selectedValue = interaction.values[0];
    const categoryName = Object.keys(session[1].categories).find(
      cat => cat.toLowerCase().replace(/\s+/g, '-') === selectedValue
    );

    if (!categoryName) {
      await interaction.reply({
        content: '❌ Invalid category selected.',
        ephemeral: true
      });
      return true;
    }

    session[1].selectedCategory = categoryName;
    session[1].page = 0;
    action = 'category-selected';
  } else {
    // Button interaction
    const parts = customId.split('-');
    if (parts.length < 3) return false;

    action = parts[1]; // 'prev', 'next', 'back', or 'page'
    sessionId = parts.slice(2).join('-');

    const session = helpSessions.get(sessionId);

    if (!session) {
      await interaction.reply({
        content: '⏱️ This help session has expired. Please run `/help` again.',
        ephemeral: true
      });
      return true;
    }

    // Check if user owns this session
    if (session.userId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ You can only navigate your own help menu.',
        ephemeral: true
      });
      return true;
    }

    if (action === 'back') {
      session.selectedCategory = null;
      session.page = 0;
    } else if (action === 'prev' && session.page > 0) {
      session.page--;
    } else if (action === 'next') {
      const commands = session.categories[session.selectedCategory] || [];
      const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);
      if (session.page < totalPages - 1) {
        session.page++;
      }
    }
  }

  const session = helpSessions.get(sessionId);
  if (!session) return true;

  const { categories, selectedCategory, page } = session;
  const commands = selectedCategory ? categories[selectedCategory] || [] : [];
  const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);

  const embed = createHelpEmbed(categories, selectedCategory, page);
  const categoryMenu = createCategorySelectMenu(categories, selectedCategory);
  const paginationButtons = createPaginationButtons(selectedCategory, page, totalPages, sessionId);

  const components = [categoryMenu];
  if (paginationButtons) {
    components.push(paginationButtons);
  }

  await interaction.update({
    embeds: [embed],
    components
  });

  return true;
}
