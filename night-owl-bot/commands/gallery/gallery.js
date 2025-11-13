import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    ComponentType
} from 'discord.js';
import fetch from 'node-fetch';
import { loadConfig } from '../../utils/config.js';
import { getSupabase } from '../../utils/supabase.js';

const ITEMS_PER_PAGE = 5;

// Store active gallery sessions
// Sessions persist until replaced by a new command from the same user
const gallerySessions = new Map();

// Content type info
const contentTypeInfo = {
    'profiles': { icon: '📸', color: 0x9B59B6, name: 'Profiles', endpoint: 'profiles', path: 'profiles' },
    'emotes': { icon: '😀', color: 0x3498DB, name: 'Emotes', endpoint: 'emotes', path: 'emotes' },
    'wallpapers': { icon: '🖼️', color: 0xE67E22, name: 'Wallpapers', endpoint: 'wallpapers', path: 'wallpapers' },
    'emoji_combos': { icon: '🎨', color: 0xE91E63, name: 'Emoji Combos', endpoint: 'emoji_combos', path: 'emoji-combos' }
};

// Profile types and categories (from database schema)
const profileTypes = ['profile', 'banner'];
const profileCategories = ['discord', 'twitter', 'instagram', 'general'];

function createGalleryEmbed(items, type, page, totalPages, category = null) {
    const info = contentTypeInfo[type] || contentTypeInfo['profiles'];
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
    const pageItems = items.slice(startIndex, endIndex);

    if (pageItems.length === 0) {
        return new EmbedBuilder()
            .setTitle(`${info.icon} ${info.name} Gallery`)
            .setDescription(`No ${info.name.toLowerCase()} found${category ? ` in category "${category}"` : ''}.`)
            .setColor(info.color)
            .setFooter({ text: `Page ${page + 1} of ${totalPages || 1}` });
    }

    const embed = new EmbedBuilder()
        .setTitle(`${info.icon} ${info.name} Gallery`)
        .setDescription(
            pageItems.map((item, idx) => {
                const num = startIndex + idx + 1;
                const uploader = item.user_profiles?.username || item.user_profiles?.display_name || 'Unknown';
                const downloads = item.download_count || 0;
                const itemCategory = item.category || (item.combo_text ? 'Emoji Combo' : 'N/A');
                const title = item.title || item.name || 'Untitled';
                const truncatedTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
                
                return `**${num}.** ${truncatedTitle}\n` +
                       `   👤 ${uploader} • 📥 ${downloads} downloads${itemCategory !== 'N/A' ? ` • 📁 ${itemCategory}` : ''}`;
            }).join('\n\n')
        )
        .setColor(info.color)
        .setFooter({ 
            text: `Showing ${startIndex + 1}-${endIndex} of ${items.length} items • Page ${page + 1} of ${totalPages}${category ? ` • Filtered: ${category}` : ''}` 
        })
        .setTimestamp();

    // Set thumbnail from first item
    if (pageItems[0]?.image_url) {
        embed.setThumbnail(pageItems[0].image_url);
    }

    // Add category filter info if specified
    if (category) {
        embed.addFields({
            name: 'Filter',
            value: `Category: ${category}`,
            inline: true
        });
    }

    return embed;
}

async function createGalleryButtons(items, type, page, totalPages, sessionId, category = null, searchQuery = null) {
    const info = contentTypeInfo[type] || contentTypeInfo['profiles'];
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
    const pageItems = items.slice(startIndex, endIndex);

    const config = await loadConfig();
    const WEB_URL = config?.WEB_URL || 'https://profilesafterdark.com';

    // First row: Navigation buttons
    const navButtons = new ActionRowBuilder();

    // First page button
    navButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-first-${sessionId}`)
            .setLabel('⏮ First')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0 || totalPages <= 1)
    );

    // Previous button
    navButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-prev-${sessionId}`)
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0)
    );

    // Page indicator
    navButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-page-${sessionId}`)
            .setLabel(`${page + 1} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );

    // Next button
    navButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-next-${sessionId}`)
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );

    // Last page button
    navButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-last-${sessionId}`)
            .setLabel('Last ⏭')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1 || totalPages <= 1)
    );

    // Second row: Action buttons
    const actionButtons = new ActionRowBuilder();

    // Refresh button
    actionButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-refresh-${sessionId}`)
            .setLabel('🔄 Refresh')
            .setStyle(ButtonStyle.Primary)
    );

    // Type selector button
    actionButtons.addComponents(
        new ButtonBuilder()
            .setCustomId(`gallery-type-${sessionId}`)
            .setLabel('📋 Change Type')
            .setStyle(ButtonStyle.Primary)
    );

    // Category filter button (if applicable)
    if (type === 'profiles' || type === 'emotes' || type === 'wallpapers') {
        actionButtons.addComponents(
            new ButtonBuilder()
                .setCustomId(`gallery-category-${sessionId}`)
                .setLabel('📁 Filter Category')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    // View on Web button
    actionButtons.addComponents(
        new ButtonBuilder()
            .setLabel('🌐 View on Web')
            .setURL(`${WEB_URL}/gallery/${info.path}${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
            .setStyle(ButtonStyle.Link)
    );

    // Random item button
    if (items.length > 0) {
        actionButtons.addComponents(
            new ButtonBuilder()
                .setCustomId(`gallery-random-${sessionId}`)
                .setLabel('🎲 Random')
                .setStyle(ButtonStyle.Success)
        );
    }

    // Third row: Item view buttons
    // Use :: as separator since item.id might be a UUID with dashes
    const itemButtons = new ActionRowBuilder();
    pageItems.forEach((item, idx) => {
        if (idx < 5) { // Discord limit is 5 buttons per row
            itemButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`gallery-view-${sessionId}::${item.id}`)
                    .setLabel(`#${startIndex + idx + 1}`)
                    .setStyle(ButtonStyle.Success)
            );
        }
    });

    return [navButtons, actionButtons, itemButtons];
}

function createTypeSelectMenu(selectedType, sessionId) {
    const options = Object.entries(contentTypeInfo).map(([key, info]) => ({
        label: info.name,
        description: `Browse ${info.name.toLowerCase()}`,
        value: key,
        emoji: info.icon,
        default: key === selectedType
    }));

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`gallery-type-select-${sessionId}`)
            .setPlaceholder(`Selected: ${contentTypeInfo[selectedType]?.name || 'Profiles'}`)
            .addOptions(options)
    );
}

function createCategorySelectMenu(sessionId, currentCategory = null) {
    // This will be populated dynamically based on the type
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`gallery-category-select-${sessionId}`)
            .setPlaceholder(currentCategory ? `Current: ${currentCategory}` : 'Select a category...')
            .addOptions([
                { label: 'All Categories', value: 'all', description: 'Show all categories', default: !currentCategory },
                { label: 'Loading...', value: 'loading', description: 'Please wait', disabled: true }
            ])
    );
}

// Autocomplete handler for categories
export async function autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const type = interaction.options.getString('type') || 'profiles';

    try {
        if (focused.name === 'category') {
            const db = await getSupabase();
            let categories = [];

            // Fetch unique categories from the database
            if (type === 'profiles') {
                const { data } = await db
                    .from('profiles')
                    .select('category')
                    .or('status.is.null,status.eq.approved')
                    .limit(1000);
                
                if (data) {
                    categories = [...new Set(data.map(item => item.category).filter(Boolean))];
                }
            } else if (type === 'emotes') {
                const { data } = await db
                    .from('emotes')
                    .select('category')
                    .or('status.is.null,status.eq.approved')
                    .limit(1000);
                
                if (data) {
                    categories = [...new Set(data.map(item => item.category).filter(Boolean))];
                }
            } else if (type === 'wallpapers') {
                const { data } = await db
                    .from('wallpapers')
                    .select('category')
                    .or('status.is.null,status.eq.approved')
                    .limit(1000);
                
                if (data) {
                    categories = [...new Set(data.map(item => item.category).filter(Boolean))];
                }
            } else if (type === 'emoji_combos') {
                // Emoji combos don't have a category field, skip autocomplete
                await interaction.respond([]);
                return;
            }

            // Filter categories based on user input
            const filtered = categories
                .filter(cat => cat.toLowerCase().includes(focused.value.toLowerCase()))
                .slice(0, 25); // Discord limit is 25 options

            await interaction.respond(
                filtered.map(cat => ({ name: cat, value: cat }))
            );
        } else if (focused.name === 'type' && type === 'profiles') {
            // For profiles, also autocomplete the 'type' field (profile/banner)
            const filtered = profileTypes
                .filter(t => t.toLowerCase().includes(focused.value.toLowerCase()))
                .slice(0, 25);

            await interaction.respond(
                filtered.map(t => ({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t }))
            );
        }
    } catch (error) {
        console.error('Error in autocomplete:', error);
        await interaction.respond([]);
    }
}

export const data = new SlashCommandBuilder()
    .setName('gallery')
    .setDescription('Browse and view content from the website gallery')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Content type to browse')
            .setRequired(false)
            .addChoices(
                { name: 'Profiles', value: 'profiles' },
                { name: 'Emotes', value: 'emotes' },
                { name: 'Wallpapers', value: 'wallpapers' },
                { name: 'Emoji Combos', value: 'emoji_combos' }
            )
    )
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Category filter (optional)')
            .setRequired(false)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option.setName('search')
            .setDescription('Search query (optional)')
            .setRequired(false)
    );

export const category = 'Gallery';

export async function execute(interaction) {
    // Defer immediately to prevent timeout (ephemeral)
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true }).catch(() => {
            // Ignore errors if already responded
        });
    }
    
    try {

        const config = await loadConfig();
        const API_URL = config?.API_URL || config?.BACKEND_URL || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
        const WEB_URL = config?.WEB_URL || process.env.WEB_URL || 'https://profilesafterdark.com';

        const type = interaction.options.getString('type') || 'profiles';
        const category = interaction.options.getString('category');
        const searchQuery = interaction.options.getString('search');

        let items = [];
        let endpoint = `${API_URL}/api/v1/${contentTypeInfo[type]?.endpoint || 'profiles'}`;

        // If search query provided, use search endpoint
        if (searchQuery) {
            const params = new URLSearchParams();
            params.append('q', searchQuery);
            params.append('type', type);
            params.append('limit', '50');

            const response = await fetch(`${API_URL}/api/v1/search?${params}`);
            
            if (!response.ok) {
                console.error(`Search API error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Search API returned ${response.status}`);
            }

            const result = await response.json();
            console.log('Search API response:', JSON.stringify(result, null, 2));
            
            if (result.success && result.data) {
                items = result.data[type] || [];
                console.log(`Found ${items.length} items for type "${type}" in search results`);
            } else if (result[type]) {
                // Fallback: check if response has type directly
                items = result[type] || [];
                console.log(`Found ${items.length} items for type "${type}" (fallback)`);
            } else {
                console.warn('Unexpected search API response format:', result);
                items = [];
            }
            
            // Log if no items found
            if (items.length === 0) {
                console.log(`No items found for search query "${searchQuery}" and type "${type}"`);
                console.log('Available types in response:', result.data ? Object.keys(result.data) : 'none');
            }
        } else {
            // Regular gallery browse
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            params.append('limit', '50');
            params.append('offset', '0');

            const response = await fetch(`${endpoint}?${params}`);
            
            if (!response.ok) {
                console.error(`Gallery API error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Gallery API returned ${response.status}`);
            }

            const result = await response.json();
            console.log('Gallery API response:', JSON.stringify(result, null, 2));
            
            if (result.success && result.data) {
                items = Array.isArray(result.data) ? result.data : [];
            } else if (Array.isArray(result)) {
                // Fallback: check if response is directly an array
                items = result;
            } else if (result.data && Array.isArray(result.data)) {
                items = result.data;
            }
        }

        console.log(`Fetched ${items.length} items for type: ${type}`);

        if (items.length === 0) {
            return await interaction.editReply({
                content: `🔍 No ${contentTypeInfo[type]?.name.toLowerCase() || 'items'} found${searchQuery ? ` for "${searchQuery}"` : category ? ` in category "${category}"` : ''}.`,
            });
        }

        // Create session - replace any existing session for this user
        // Remove old sessions for this user first
        for (const [id, session] of gallerySessions.entries()) {
            if (session.userId === interaction.user.id) {
                gallerySessions.delete(id);
            }
        }
        
        const sessionId = `${interaction.user.id}_${Date.now()}`;
        const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
        
        gallerySessions.set(sessionId, {
            items,
            type,
            category,
            searchQuery,
            userId: interaction.user.id,
            createdAt: Date.now()
        });

        const embed = createGalleryEmbed(items, type, 0, totalPages, category);
        const buttons = await createGalleryButtons(items, type, 0, totalPages, sessionId, category, searchQuery);

        await interaction.editReply({
            embeds: [embed],
            components: buttons
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        await interaction.editReply({
            content: `⚠️ Failed to fetch gallery items: ${error.message}. Please try again later.`,
        });
    }
}

// Handle button and select menu interactions
export async function handleGalleryInteraction(interaction) {
    try {
        const customId = interaction.customId;
        
        if (!customId.startsWith('gallery-')) return false;

        const parts = customId.split('-');
        const action = parts[1]; // 'prev', 'next', 'page', 'type', 'view'
        
        // For 'view' action, we create a new message, so deferReply
        // For other actions, we update the original message, so deferUpdate
        if (!interaction.deferred && !interaction.replied) {
            if (action === 'view') {
                await interaction.deferReply({ ephemeral: true }).catch(err => {
                    console.error('Error deferring reply for view:', err);
                });
            } else {
                await interaction.deferUpdate().catch(err => {
                    console.error('Error deferring update:', err);
                    // If deferUpdate fails (e.g., ephemeral message), try deferReply
                    if (!interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => {});
                    }
                });
            }
        }

    // Handle type selector button
    if (action === 'type' && parts.length === 3) {
        const session = Array.from(gallerySessions.entries())
            .find(([_, s]) => s.userId === interaction.user.id);

        if (!session) {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }

        const typeMenu = createTypeSelectMenu(session[1].type, session[0]);
        if (interaction.deferred) {
            await interaction.editReply({
                content: 'Select a content type:',
                components: [typeMenu],
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: 'Select a content type:',
                components: [typeMenu],
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    // Handle type select menu
    if (action === 'type' && parts[2] === 'select') {
        // Defer if not already deferred
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => {});
        }
        
        const actualSessionId = parts.slice(3).join('-');
        const session = gallerySessions.get(actualSessionId);

        if (!session || session.userId !== interaction.user.id) {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }

        const newType = interaction.values[0];
        session.type = newType;
        session.items = [];
        session.page = 0;

        // Fetch new type data
        const config = await loadConfig();
        const API_URL = config?.API_URL || config?.BACKEND_URL || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
        const endpoint = `${API_URL}/api/v1/${contentTypeInfo[newType]?.endpoint || 'profiles'}`;

        const params = new URLSearchParams();
        if (session.category) params.append('category', session.category);
        params.append('limit', '50');
        params.append('offset', '0');

        const response = await fetch(`${endpoint}?${params}`);
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                session.items = Array.isArray(result.data) ? result.data : [];
            } else if (Array.isArray(result)) {
                session.items = result;
            } else if (result.data && Array.isArray(result.data)) {
                session.items = result.data;
            }
        }

        const totalPages = Math.ceil(session.items.length / ITEMS_PER_PAGE);
        const embed = createGalleryEmbed(session.items, newType, 0, totalPages, session.category);
        const buttons = await createGalleryButtons(session.items, newType, 0, totalPages, actualSessionId, session.category, session.searchQuery);

        // Use editReply if deferred, otherwise update
        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: buttons
            }).catch(err => {
                console.error('Error editing reply for type change:', err);
            });
        } else {
            await interaction.update({
                embeds: [embed],
                components: buttons
            }).catch(err => {
                console.error('Error updating interaction for type change:', err);
            });
        }
        return true;
    }

    // Handle view item button
    if (action === 'view') {
        // For view buttons: gallery-view-${sessionId}::${itemId}
        // Use :: as separator since item.id might be a UUID with dashes
        const customIdParts = customId.split('::');
        if (customIdParts.length !== 2) {
            console.error('Invalid view button customId format:', customId);
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Invalid button format. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '❌ Invalid button format. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }
        
        const sessionId = customIdParts[0].replace('gallery-view-', '');
        const itemId = customIdParts[1];
        
        // Try to find session by ID first
        let session = gallerySessions.get(sessionId);
        
        // If not found, search by user ID (fallback for edge cases)
        if (!session || session.userId !== interaction.user.id) {
            session = Array.from(gallerySessions.entries())
                .find(([_, s]) => s.userId === interaction.user.id)?.[1];
        }

        if (!session || session.userId !== interaction.user.id) {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }

        const item = session.items.find(i => {
            const id = i.id?.toString() || i.id;
            return id === itemId || id === itemId.toString();
        });
        
        if (!item) {
            console.error('Item not found in session:', { itemId, sessionId, availableIds: session.items.map(i => i.id) });
            if (interaction.deferred) {
                await interaction.editReply({
                    content: `❌ Item not found. (ID: ${itemId})`,
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: `❌ Item not found. (ID: ${itemId})`,
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }

        // Show item details
        const config = await loadConfig();
        const WEB_URL = config?.WEB_URL || process.env.WEB_URL || 'https://profilesafterdark.com';
        const info = contentTypeInfo[session.type] || contentTypeInfo['profiles'];

        const title = item.title || item.name || 'Untitled';
        const description = item.description || item.combo_text || 'No description';
        const imageUrl = item.image_url || null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${info.icon} ${title}`)
            .setDescription(description)
            .setColor(info.color)
            .addFields(
                { name: 'Category', value: item.category || (item.combo_text ? 'Emoji Combo' : 'N/A'), inline: true },
                { name: 'Downloads', value: (item.download_count || 0).toString(), inline: true },
                { name: 'Type', value: item.type || 'N/A', inline: true }
            )
            .setTimestamp(item.created_at);
        
        if (imageUrl) {
            embed.setImage(imageUrl);
        } else if (item.combo_text) {
            // For emoji combos, show the combo text prominently
            embed.setDescription(`**${item.combo_text}**\n\n${description}`);
        }

        if (item.user_profiles) {
            embed.setFooter({
                text: `Uploaded by ${item.user_profiles.username || item.user_profiles.display_name || 'Unknown'}`,
                iconURL: item.user_profiles.avatar_url || undefined
            });
        }

        if (item.tags && item.tags.length > 0) {
            embed.addFields({
                name: 'Tags',
                value: item.tags.slice(0, 10).join(', ') || 'None',
                inline: false
            });
        }

        const viewButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 View on Website')
                .setURL(`${WEB_URL}/gallery/${info.path}/${item.id}`)
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setCustomId(`gallery-back-${sessionId}`)
                .setLabel('← Back to Gallery')
                .setStyle(ButtonStyle.Secondary)
        );

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: [viewButtons],
            }).catch(() => {});
        } else {
            await interaction.reply({
                embeds: [embed],
                components: [viewButtons],
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    // Handle refresh button
    if (action === 'refresh') {
        const sessionId = parts.slice(2).join('-');
        let session = gallerySessions.get(sessionId);
        
        if (!session || session.userId !== interaction.user.id) {
            const fallbackSession = Array.from(gallerySessions.entries())
                .find(([_, s]) => s.userId === interaction.user.id);
            if (!fallbackSession) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                        ephemeral: true
                    }).catch(() => {});
                }
                return true;
            }
            session = fallbackSession[1];
            sessionId = fallbackSession[0];
        }
        
        // Re-fetch data
        const config = await loadConfig();
        const API_URL = config?.API_URL || config?.BACKEND_URL || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
        let endpoint = `${API_URL}/api/v1/${contentTypeInfo[session.type]?.endpoint || 'profiles'}`;
        
        if (session.searchQuery) {
            const params = new URLSearchParams();
            params.append('q', session.searchQuery);
            params.append('type', session.type);
            params.append('limit', '50');
            const response = await fetch(`${API_URL}/api/v1/search?${params}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    session.items = result.data[session.type] || [];
                }
            }
        } else {
            const params = new URLSearchParams();
            if (session.category) params.append('category', session.category);
            params.append('limit', '50');
            params.append('offset', '0');
            const response = await fetch(`${endpoint}?${params}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    session.items = Array.isArray(result.data) ? result.data : [];
                } else if (Array.isArray(result)) {
                    session.items = result;
                } else if (result.data && Array.isArray(result.data)) {
                    session.items = result.data;
                }
            }
        }
        
        const totalPages = Math.ceil(session.items.length / ITEMS_PER_PAGE);
        const currentPage = Math.min(parseInt(interaction.message.embeds[0]?.footer?.text?.match(/Page (\d+)/)?.[1] || '1') - 1, totalPages - 1);
        const embed = createGalleryEmbed(session.items, session.type, currentPage, totalPages, session.category);
        const buttons = await createGalleryButtons(session.items, session.type, currentPage, totalPages, sessionId, session.category, session.searchQuery);
        
        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: buttons
            }).catch(() => {});
        } else {
            await interaction.update({
                embeds: [embed],
                components: buttons
            }).catch(() => {});
        }
        return true;
    }

    // Handle random button
    if (action === 'random') {
        const sessionId = parts.slice(2).join('-');
        let session = gallerySessions.get(sessionId);
        
        if (!session || session.userId !== interaction.user.id) {
            session = Array.from(gallerySessions.entries())
                .find(([_, s]) => s.userId === interaction.user.id)?.[1];
        }
        
        if (!session || session.userId !== interaction.user.id || session.items.length === 0) {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '⏱️ This gallery session has expired or has no items. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⏱️ This gallery session has expired or has no items. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }
        
        // Show random item
        const randomItem = session.items[Math.floor(Math.random() * session.items.length)];
        const itemId = randomItem.id?.toString() || randomItem.id;
        
        // Reuse view item logic
        const config = await loadConfig();
        const WEB_URL = config?.WEB_URL || process.env.WEB_URL || 'https://profilesafterdark.com';
        const info = contentTypeInfo[session.type] || contentTypeInfo['profiles'];
        
        const title = randomItem.title || randomItem.name || 'Untitled';
        const description = randomItem.description || randomItem.combo_text || 'No description';
        const imageUrl = randomItem.image_url || null;
        
        const embed = new EmbedBuilder()
            .setTitle(`🎲 ${info.icon} Random ${info.name}: ${title}`)
            .setDescription(description)
            .setColor(info.color)
            .addFields(
                { name: 'Category', value: randomItem.category || (randomItem.combo_text ? 'Emoji Combo' : 'N/A'), inline: true },
                { name: 'Downloads', value: (randomItem.download_count || 0).toString(), inline: true },
                { name: 'Type', value: randomItem.type || 'N/A', inline: true }
            )
            .setTimestamp(randomItem.created_at);
        
        if (imageUrl) {
            embed.setImage(imageUrl);
        }
        
        if (randomItem.user_profiles) {
            embed.setFooter({
                text: `Uploaded by ${randomItem.user_profiles.username || randomItem.user_profiles.display_name || 'Unknown'}`,
                iconURL: randomItem.user_profiles.avatar_url || undefined
            });
        }
        
        const viewButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('View on Website')
                .setURL(`${WEB_URL}/gallery/${info.path}/${randomItem.id}`)
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setCustomId(`gallery-random-${sessionId}`)
                .setLabel('🎲 Another Random')
                .setStyle(ButtonStyle.Success)
        );
        
        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: [viewButton],
            }).catch(() => {});
        } else {
            await interaction.reply({
                embeds: [embed],
                components: [viewButton],
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    // Handle category filter button
    if (action === 'category') {
        const sessionId = parts.slice(2).join('-');
        const session = gallerySessions.get(sessionId);
        
        if (!session || session.userId !== interaction.user.id) {
            const fallbackSession = Array.from(gallerySessions.entries())
                .find(([_, s]) => s.userId === interaction.user.id);
            if (!fallbackSession) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                        ephemeral: true
                    }).catch(() => {});
                }
                return true;
            }
            // Fetch categories for this type
            const db = await getSupabase();
            let categories = [];
            const tableName = fallbackSession[1].type;
            const { data } = await db
                .from(tableName)
                .select('category')
                .or('status.is.null,status.eq.approved')
                .limit(1000);
            
            if (data) {
                categories = [...new Set(data.map(item => item.category).filter(Boolean))];
            }
            
            const categoryMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`gallery-category-select-${fallbackSession[0]}`)
                    .setPlaceholder(fallbackSession[1].category ? `Current: ${fallbackSession[1].category}` : 'Select a category...')
                    .addOptions([
                        { label: 'All Categories', value: 'all', description: 'Show all categories', default: !fallbackSession[1].category },
                        ...categories.slice(0, 24).map(cat => ({
                            label: cat,
                            value: cat,
                            default: cat === fallbackSession[1].category
                        }))
                    ])
            );
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: 'Select a category to filter:',
                    components: [categoryMenu],
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: 'Select a category to filter:',
                    components: [categoryMenu],
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }
    }

    // Handle category select menu
    if (action === 'category' && parts[2] === 'select') {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => {});
        }
        
        const actualSessionId = parts.slice(3).join('-');
        const session = gallerySessions.get(actualSessionId);
        
        if (!session || session.userId !== interaction.user.id) {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }
        
        const selectedCategory = interaction.values[0] === 'all' ? null : interaction.values[0];
        session.category = selectedCategory;
        session.items = [];
        
        // Re-fetch data with new category
        const config = await loadConfig();
        const API_URL = config?.API_URL || config?.BACKEND_URL || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
        const endpoint = `${API_URL}/api/v1/${contentTypeInfo[session.type]?.endpoint || 'profiles'}`;
        
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        params.append('limit', '50');
        params.append('offset', '0');
        
        const response = await fetch(`${endpoint}?${params}`);
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                session.items = Array.isArray(result.data) ? result.data : [];
            } else if (Array.isArray(result)) {
                session.items = result;
            } else if (result.data && Array.isArray(result.data)) {
                session.items = result.data;
            }
        }
        
        const totalPages = Math.ceil(session.items.length / ITEMS_PER_PAGE);
        const embed = createGalleryEmbed(session.items, session.type, 0, totalPages, selectedCategory);
        const buttons = await createGalleryButtons(session.items, session.type, 0, totalPages, actualSessionId, selectedCategory, session.searchQuery);
        
        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: buttons
            }).catch(() => {});
        } else {
            await interaction.update({
                embeds: [embed],
                components: buttons
            }).catch(() => {});
        }
        return true;
    }

    // Handle back button
    if (action === 'back') {
        const sessionId = parts.slice(2).join('-');
        let session = gallerySessions.get(sessionId);
        
        if (!session || session.userId !== interaction.user.id) {
            const fallbackSession = Array.from(gallerySessions.entries())
                .find(([_, s]) => s.userId === interaction.user.id);
            if (!fallbackSession) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                        ephemeral: true
                    }).catch(() => {});
                }
                return true;
            }
            session = fallbackSession[1];
            sessionId = fallbackSession[0];
        }
        
        const totalPages = Math.ceil(session.items.length / ITEMS_PER_PAGE);
        const currentPage = 0; // Go back to first page
        const embed = createGalleryEmbed(session.items, session.type, currentPage, totalPages, session.category);
        const buttons = await createGalleryButtons(session.items, session.type, currentPage, totalPages, sessionId, session.category, session.searchQuery);
        
        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: buttons
            }).catch(() => {});
        } else {
            await interaction.update({
                embeds: [embed],
                components: buttons
            }).catch(() => {});
        }
        return true;
    }

    // Handle pagination (prev, next, first, last, page)
    // Extract sessionId based on action type
    let sessionId;
    if (action === 'prev' || action === 'next' || action === 'page' || action === 'first' || action === 'last' || action === 'back') {
        sessionId = parts.slice(2).join('-');
    } else {
        // For other actions, try to find session by user
        const session = Array.from(gallerySessions.entries())
            .find(([_, s]) => s.userId === interaction.user.id);
        if (!session) {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                    ephemeral: true
                }).catch(() => {});
            }
            return true;
        }
        sessionId = session[0];
    }
    
    const session = gallerySessions.get(sessionId);
    
    if (!session) {
        if (interaction.deferred) {
            await interaction.editReply({
                content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: '⏱️ This gallery session has expired. Please run `/gallery` again.',
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    if (session.userId !== interaction.user.id) {
        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ You can only navigate your own gallery session.',
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: '❌ You can only navigate your own gallery session.',
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    const totalPages = Math.ceil(session.items.length / ITEMS_PER_PAGE);
    const currentPage = parseInt(interaction.message.embeds[0]?.footer?.text?.match(/Page (\d+)/)?.[1] || '1') - 1;
    
    let newPage = currentPage;
    
    if (action === 'first') {
        newPage = 0;
    } else if (action === 'prev' && currentPage > 0) {
        newPage = currentPage - 1;
    } else if (action === 'next' && currentPage < totalPages - 1) {
        newPage = currentPage + 1;
    } else if (action === 'last') {
        newPage = totalPages - 1;
    }

    const embed = createGalleryEmbed(session.items, session.type, newPage, totalPages, session.category);
    const buttons = await createGalleryButtons(session.items, session.type, newPage, totalPages, sessionId, session.category, session.searchQuery);

    // Use editReply if deferred, otherwise update
    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components: buttons
        }).catch(err => {
            console.error('Error editing reply for pagination:', err);
        });
    } else {
        await interaction.update({
            embeds: [embed],
            components: buttons
        }).catch(err => {
            console.error('Error updating interaction for pagination:', err);
            // Fallback to reply if update fails
            if (!interaction.replied) {
                interaction.reply({
                    content: '⚠️ There was an error updating the page. Please try again.',
                    ephemeral: true
                }).catch(() => {});
            }
        });
    }

    return true;
    } catch (error) {
        console.error('Error in handleGalleryInteraction:', error);
        console.error('Interaction details:', {
            customId: interaction.customId,
            user: interaction.user?.id,
            deferred: interaction.deferred,
            replied: interaction.replied
        });
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '⚠️ There was an error processing this interaction. Please try again.',
                ephemeral: true
            }).catch(() => {});
        } else if (interaction.deferred) {
            await interaction.editReply({
                content: '⚠️ There was an error processing this interaction. Please try again.',
            }).catch(() => {});
        }
        return true;
    }
}
