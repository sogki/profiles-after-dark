import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

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
        const res = await fetch(`${process.env.BACKEND_URL}/api/user/${username}`);
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