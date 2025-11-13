import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

const ITEMS_PER_PAGE = 5;

export const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for profiles, emotes, wallpapers, or emoji combos')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('Search query (title, tag, etc.)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Content type to search')
            .setRequired(false)
            .addChoices(
                { name: 'All', value: 'all' },
                { name: 'Profiles', value: 'profiles' },
                { name: 'Emotes', value: 'emotes' },
                { name: 'Wallpapers', value: 'wallpapers' },
                { name: 'Emoji Combos', value: 'emoji_combos' }
            )
    );

export const category = 'Gallery';

// Store active pagination sessions
const paginationSessions = new Map();

function createSearchEmbed(results, query, type, page = 0) {
    const allResults = [
        ...(results.profiles || []).map(r => ({ ...r, contentType: 'profiles', icon: '📸' })),
        ...(results.emotes || []).map(r => ({ ...r, contentType: 'emotes', icon: '😀' })),
        ...(results.wallpapers || []).map(r => ({ ...r, contentType: 'wallpapers', icon: '🖼️' })),
        ...(results.emoji_combos || []).map(r => ({ ...r, contentType: 'emoji_combos', icon: '🎨' }))
    ];

    const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allResults.length);
    const pageResults = allResults.slice(startIndex, endIndex);

    if (pageResults.length === 0) {
        return new EmbedBuilder()
            .setTitle('🔍 Search Results')
            .setDescription(`No results found for "${query}"`)
            .setColor('Red')
            .setFooter({ text: `Page ${page + 1} of ${totalPages || 1}` });
    }

    const embed = new EmbedBuilder()
        .setTitle(`🔍 Search Results for "${query}"`)
        .setDescription(
            pageResults.map((item, idx) => {
                const num = startIndex + idx + 1;
                const uploader = item.user_profiles?.username || item.user_profiles?.display_name || 'Unknown';
                const downloads = item.download_count || 0;
                const category = item.category || 'N/A';
                
                return `${item.icon} **${num}.** ${item.title || 'Untitled'}\n` +
                       `   👤 ${uploader} • 📥 ${downloads} downloads • 📁 ${category}`;
            }).join('\n\n')
        )
        .setColor('Purple')
        .setFooter({ 
            text: `Showing ${startIndex + 1}-${endIndex} of ${allResults.length} results • Page ${page + 1} of ${totalPages}` 
        })
        .setTimestamp();

    // Set thumbnail from first result
    if (pageResults[0]?.image_url) {
        embed.setThumbnail(pageResults[0].image_url);
    }

    // Add type filter info if specified
    if (type && type !== 'all') {
        embed.addFields({
            name: 'Filter',
            value: `Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            inline: true
        });
    }

    return embed;
}

async function createPaginationButtons(page, totalPages, sessionId) {
    const buttons = new ActionRowBuilder();

    // Previous button
    buttons.addComponents(
        new ButtonBuilder()
            .setCustomId(`search_prev_${sessionId}`)
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0)
    );

    // Page indicator (non-clickable)
    buttons.addComponents(
        new ButtonBuilder()
            .setCustomId(`search_page_${sessionId}`)
            .setLabel(`${page + 1} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );

    // Next button
    buttons.addComponents(
        new ButtonBuilder()
            .setCustomId(`search_next_${sessionId}`)
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );

    // View on Web button
    const config = await getConfig('WEB_URL', 'https://profilesafterdark.com');
    buttons.addComponents(
        new ButtonBuilder()
            .setLabel('View on Web')
            .setURL(`${config}/gallery`)
            .setStyle(ButtonStyle.Link)
    );

    return buttons;
}

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const type = interaction.options.getString('type') || 'all';
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';

        // Fetch search results (get more than we need for pagination)
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('type', type);
        params.append('limit', '50'); // Get up to 50 results for pagination

        const response = await fetch(`${API_URL}/api/v1/search?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const { data: results, success, total } = await response.json();

        if (!success || !results) {
            return await interaction.editReply({
                content: '⚠️ Failed to perform search. Please try again later.',
            });
        }

        const allResults = [
            ...(results.profiles || []),
            ...(results.emotes || []),
            ...(results.wallpapers || []),
            ...(results.emoji_combos || [])
        ];

        if (allResults.length === 0) {
            return await interaction.editReply({
                content: `🔍 No results found for "${query}". Try a different search term.`,
            });
        }

        // Create session for pagination
        const sessionId = `${interaction.user.id}_${Date.now()}`;
        const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);
        
        paginationSessions.set(sessionId, {
            results,
            query,
            type,
            userId: interaction.user.id,
            createdAt: Date.now()
        });

        // Clean up old sessions (older than 10 minutes)
        for (const [id, session] of paginationSessions.entries()) {
            if (Date.now() - session.createdAt > 10 * 60 * 1000) {
                paginationSessions.delete(id);
            }
        }

        const embed = createSearchEmbed(results, query, type, 0);
        const buttons = await createPaginationButtons(0, totalPages, sessionId);

        await interaction.editReply({
            embeds: [embed],
            components: [buttons]
        });
    } catch (error) {
        console.error('Error searching:', error);
        await interaction.editReply({
            content: '⚠️ Failed to perform search. Please try again later.',
        });
    }
}

// Handle button interactions for pagination
export async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    
    if (!customId.startsWith('search_')) return false;

    const parts = customId.split('_');
    const action = parts[1]; // 'prev', 'next', or 'page'
    const sessionId = parts.slice(2).join('_');

    const session = paginationSessions.get(sessionId);
    
    if (!session) {
        await interaction.reply({
            content: '⏱️ This search session has expired. Please run the search command again.',
            ephemeral: true
        });
        return true;
    }

    // Check if user owns this session
    if (session.userId !== interaction.user.id) {
        await interaction.reply({
            content: '❌ You can only navigate your own search results.',
            ephemeral: true
        });
        return true;
    }

    const allResults = [
        ...(session.results.profiles || []),
        ...(session.results.emotes || []),
        ...(session.results.wallpapers || []),
        ...(session.results.emoji_combos || [])
    ];

    const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);
    
    // Get current page from message
    const currentPage = parseInt(interaction.message.embeds[0]?.footer?.text?.match(/Page (\d+)/)?.[1] || '1') - 1;
    
    let newPage = currentPage;
    
    if (action === 'prev' && currentPage > 0) {
        newPage = currentPage - 1;
    } else if (action === 'next' && currentPage < totalPages - 1) {
        newPage = currentPage + 1;
    }

    const embed = createSearchEmbed(session.results, session.query, session.type, newPage);
    const buttons = await createPaginationButtons(newPage, totalPages, sessionId);

    await interaction.update({
        embeds: [embed],
        components: [buttons]
    });

    return true;
}
