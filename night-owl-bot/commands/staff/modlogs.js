import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { setModlogsChannel, getModlogsChannel, getSupabase } from '../../utils/supabase.js';

// Function to cache deleted messages to Supabase
export async function cacheDeletedMessage(guildId, message) {
  try {
    const db = await getSupabase();
    await db
      .from('deleted_messages')
      .insert({
        message_id: message.id,
        guild_id: guildId,
        channel_id: message.channelId,
        author_id: message.author?.id || null,
        author_tag: message.author?.tag || 'Unknown',
        content: message.content || '',
        attachments: message.attachments ? Array.from(message.attachments.values()).map(a => ({
          id: a.id,
          url: a.url,
          name: a.name,
          size: a.size
        })) : [],
        stickers: message.stickers ? Array.from(message.stickers.values()).map(s => ({
          id: s.id,
          name: s.name,
          url: s.url
        })) : [],
        deleted_at: message.deletedAt || new Date().toISOString(),
        cached: true
      });
  } catch (error) {
    console.error('Error caching deleted message:', error);
  }
}

export const data = new SlashCommandBuilder()
  .setName('modlogs')
  .setDescription('Manage moderation logs channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('set')
      .setDescription('Set the channel for moderation logs')
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('Channel to send moderation logs')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('refresh')
      .setDescription('Show recent deleted messages from cache')
  );

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'set') {
    const channel = interaction.options.getChannel('channel');

    await setModlogsChannel(guildId, channel.id);

    return interaction.reply({
      content: `✅ Moderation logs channel set to ${channel}.`,
      ephemeral: true,
    });
  }

  if (subcommand === 'refresh') {
    await interaction.deferReply({ ephemeral: true });

    const channelId = await getModlogsChannel(guildId);
    if (!channelId) {
      return interaction.editReply({
        content: '⚠️ Moderation logs channel is not set. Use `/modlogs set` first.',
      });
    }

    // Fetch recent deleted messages from Supabase
    const db = await getSupabase();
    const { data: cachedMessages, error } = await db
      .from('deleted_messages')
      .select('*')
      .eq('guild_id', guildId)
      .order('deleted_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching deleted messages:', error);
      return interaction.editReply({
        content: '⚠️ Failed to fetch deleted messages from database.',
      });
    }

    if (!cachedMessages || cachedMessages.length === 0) {
      return interaction.editReply({
        content: 'ℹ️ No deleted messages found in the database to display.',
      });
    }

    // Create embeds for last 5 deleted messages
    const embeds = cachedMessages.map(msg => {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Deleted Message')
        .setColor('DarkRed')
        .addFields(
          { name: 'Author', value: `${msg.author_tag || 'Unknown'} (${msg.author_id || 'Unknown'})`, inline: true },
          { name: 'Channel', value: `<#${msg.channel_id}>`, inline: true },
          { name: 'Message ID', value: msg.message_id, inline: true },
          { name: 'Content', value: msg.content || '*No text content*', inline: false }
        )
        .setTimestamp(msg.deleted_at || new Date());

      // Attachments or stickers
      if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        const att = msg.attachments[0];
        if (att.url) embed.setImage(att.url);
      } else if (msg.stickers && Array.isArray(msg.stickers) && msg.stickers.length > 0) {
        embed.addFields({ name: 'Stickers', value: msg.stickers.map(s => s.name || s).join(', ') });
      }

      return embed;
    });

    try {
      const modlogsChannel = await interaction.guild.channels.fetch(channelId);
      if (!modlogsChannel) throw new Error('Modlogs channel not found');

      await modlogsChannel.send({ embeds });

      await interaction.editReply({
        content: `✅ Sent last ${embeds.length} deleted messages to ${modlogsChannel}.`,
      });
    } catch (error) {
      console.error('Error sending modlogs:', error);
      await interaction.editReply({
        content: '⚠️ Failed to send logs to the modlogs channel.',
      });
    }
  }
}
