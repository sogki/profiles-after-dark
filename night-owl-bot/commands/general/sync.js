import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { loadConfig } from '../../utils/config.js';
import { getSupabase } from '../../utils/supabase.js';

export const data = new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Link your Discord account to your website account')
    .addStringOption(option =>
        option.setName('code')
            .setDescription('The linking code from your website settings')
            .setRequired(true)
            .setMaxLength(8)
            .setMinLength(8)
    );

export const category = 'General';

export async function execute(interaction) {
    // Defer reply immediately (ephemeral)
    await interaction.deferReply({ ephemeral: true });

    try {
        const code = interaction.options.getString('code');
        const config = await loadConfig();
        const API_URL = config?.API_URL || config?.BACKEND_URL || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

        // Get Discord user info
        const discordId = interaction.user.id;
        const username = interaction.user.username;
        const discriminator = interaction.user.discriminator;
        const avatarUrl = interaction.user.displayAvatarURL({ dynamic: true, size: 256 });
        const guildId = interaction.guild?.id || '0'; // Use '0' if DM

        // Validate code with API
        const response = await fetch(`${API_URL}/api/v1/account-linking/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code.toUpperCase(),
                discord_id: discordId,
                username,
                discriminator,
                avatar_url: avatarUrl,
                guild_id: guildId
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            const errorMessage = result.error || 'Failed to link account. Please check your code and try again.';
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Account Linking Failed')
                .setDescription(errorMessage)
                .setColor(0xFF0000)
                .addFields({
                    name: '💡 Tips',
                    value: '• Make sure you copied the code correctly\n• Codes expire after 15 minutes\n• Each code can only be used once\n• Generate a new code from your website settings if needed',
                    inline: false
                })
                .setTimestamp();

            return await interaction.editReply({
                embeds: [errorEmbed]
            });
        }

        // Success! Create notification
        const db = await getSupabase();
        const userId = result.data.user_id;
        const websiteUsername = result.data.username;

        // Create notification for website user
        const { error: notifError } = await db
            .from('notifications')
            .insert({
                user_id: userId,
                type: 'account_linked',
                title: 'Discord Account Linked',
                description: `Your Discord account (${username}) has been successfully linked!`,
                metadata: {
                    discord_id: discordId,
                    discord_username: username,
                    linked_at: new Date().toISOString()
                }
            });

        if (notifError) {
            console.error('Error creating notification:', notifError);
        }

        // Send success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Account Successfully Linked!')
            .setDescription(`Your Discord account has been linked to **${websiteUsername}** on Profiles After Dark.`)
            .setColor(0x00FF00)
            .addFields(
                {
                    name: 'Discord Account',
                    value: `${username}${discriminator !== '0' ? `#${discriminator}` : ''}`,
                    inline: true
                },
                {
                    name: 'Website Account',
                    value: websiteUsername,
                    inline: true
                },
                {
                    name: 'Linked At',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: false
                }
            )
            .setFooter({
                text: 'You will receive a notification on the website confirming the link.',
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({
            embeds: [successEmbed]
        });

        // Try to send DM notification (optional, might fail if DMs are disabled)
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('✅ Account Linked Successfully!')
                .setDescription(`Your Discord account has been linked to your Profiles After Dark account (**${websiteUsername}**).`)
                .setColor(0x00FF00)
                .addFields({
                    name: 'What\'s Next?',
                    value: '• Your accounts are now synced\n• You can use Discord features on the website\n• Check your website notifications for more details',
                    inline: false
                })
                .setTimestamp();

            await interaction.user.send({ embeds: [dmEmbed] }).catch(() => {
                // DMs might be disabled, that's okay
            });
        } catch (error) {
            // DMs disabled or other error, ignore
        }

    } catch (error) {
        console.error('Error in sync command:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('An unexpected error occurred while linking your account. Please try again later.')
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.editReply({
            embeds: [errorEmbed]
        });
    }
}

