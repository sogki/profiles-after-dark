import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('user')
    .setDescription('Fetch user data from backend.')
    .addStringOption(option =>
        option.setName('username')
            .setDescription('Username to lookup')
            .setRequired(true));

export const category = 'General'; // Command category

export async function execute(interaction) {
    const username = interaction.options.getString('username');
    
    // Defer reply immediately to avoid timeout
    await interaction.deferReply();
    
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/users/${username}`);
        
        if (!res.ok) {
            return await interaction.editReply(`⚠️ Could not fetch data for user: ${username}.`);
        }
        
        const data = await res.json();
        
        if (!data.success || !data.data) {
            return await interaction.editReply(`⚠️ User "${username}" not found.`);
        }
        
        const userData = data.data.profile || data.data;
        const stats = data.data.stats || {};
        
        const embed = new EmbedBuilder()
            .setTitle(`🦉 User Info: ${username}`)
            .setColor('Purple')
            .addFields(
                { name: 'Username', value: userData.username || username, inline: true },
                { name: 'Display Name', value: userData.display_name || 'N/A', inline: true },
                { name: 'Total Uploads', value: (stats.total_uploads || 0).toString(), inline: true },
                { name: 'Total Downloads', value: (stats.total_downloads || 0).toString(), inline: true },
                { name: 'Badges', value: (stats.badges || 0).toString(), inline: true },
            )
            .setTimestamp();
            
        if (userData.avatar_url) {
            embed.setThumbnail(userData.avatar_url);
        }
        
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching user:', error);
        await interaction.editReply(`⚠️ Could not fetch data for user: ${username}.`);
    }
}