import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View website statistics.');

export const category = 'General'; // Command category

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const response = await fetch(`${API_URL}/api/stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const { data: stats, success } = await response.json();

        if (!success || !stats) {
            return await interaction.editReply({
                content: '⚠️ Failed to fetch statistics.',
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Profiles After Dark Statistics')
            .setDescription('Website content and user statistics')
            .setColor('Purple')
            .addFields(
                { name: '📸 Profiles', value: stats.profiles?.toLocaleString() || '0', inline: true },
                { name: '😀 Emotes', value: stats.emotes?.toLocaleString() || '0', inline: true },
                { name: '🖼️ Wallpapers', value: stats.wallpapers?.toLocaleString() || '0', inline: true },
                { name: '👥 Discord Users', value: stats.discordUsers?.toLocaleString() || '0', inline: true },
                { name: '🌐 Website', value: `[Visit Site](${process.env.WEB_URL || 'https://profilesafterdark.com'})`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Profiles After Dark' });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching stats:', error);
        await interaction.editReply({
            content: '⚠️ Failed to fetch statistics. Please try again later.',
        });
    }
}


