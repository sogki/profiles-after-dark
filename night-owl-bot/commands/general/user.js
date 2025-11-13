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
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/users/${username}`);
        const data = await res.json();
        const embed = new EmbedBuilder()
            .setTitle(`🦉 User Info: ${username}`)
            .setColor('Purple')
            .addFields(
                { name: 'Username', value: data.username, inline: true },
                { name: 'Posts', value: data.posts.toString(), inline: true },
                { name: 'Join Date', value: data.joinDate, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.reply(`⚠️ Could not fetch data for user: ${username}.`);
    }
}