import { loadConfig } from './config.js';
import { addMemberRole, removeMemberRole, getPremiumRoleConfig } from './discordAdmin.js';

function isPremiumActive(subscription) {
  if (!subscription) return false;
  const tier = subscription.subscription_tier;
  const status = subscription.status;
  const premiumTier = tier === 'premium';
  const activeStatus = status === 'active' || status === 'trialing';
  return premiumTier && activeStatus;
}

export async function syncPremiumRoleForDiscordUser({
  db,
  webUserId,
  discordId,
  guildId,
  source = 'unknown',
}) {
  if (!db || !webUserId || !discordId) {
    return { success: false, skipped: true, error: 'Missing db, web user id, or discord id.' };
  }

  const config = await loadConfig();
  const roleConfig = getPremiumRoleConfig(config);
  const targetGuildId = guildId || roleConfig.guildId;

  if (!targetGuildId || !roleConfig.roleId) {
    return { success: false, skipped: true, error: 'Missing GUILD_ID or PREMIUM_ROLE_ID in config.' };
  }

  const { data: subscription, error: subError } = await db
    .from('flair_subscriptions')
    .select('subscription_tier, status')
    .eq('user_id', webUserId)
    .single();

  if (subError && subError.code !== 'PGRST116') {
    return { success: false, skipped: false, error: `Failed to load subscription: ${subError.message}` };
  }

  const shouldHaveRole = isPremiumActive(subscription);
  const reason = `Flair premium sync (${source})`;

  if (shouldHaveRole) {
    return addMemberRole({
      guildId: targetGuildId,
      userId: discordId,
      roleId: roleConfig.roleId,
      reason,
    });
  }

  return removeMemberRole({
    guildId: targetGuildId,
    userId: discordId,
    roleId: roleConfig.roleId,
    reason,
  });
}

export async function syncPremiumRoleForUserLinks({
  db,
  webUserId,
  source = 'unknown',
}) {
  if (!db || !webUserId) {
    return { success: false, skipped: true, error: 'Missing db or web user id.' };
  }

  const { data: links, error } = await db
    .from('discord_users')
    .select('discord_id, guild_id')
    .eq('web_user_id', webUserId);

  if (error) {
    return { success: false, skipped: false, error: `Failed to load discord links: ${error.message}` };
  }

  if (!links || links.length === 0) {
    return { success: true, skipped: true };
  }

  const results = [];
  for (const link of links) {
    const result = await syncPremiumRoleForDiscordUser({
      db,
      webUserId,
      discordId: link.discord_id,
      guildId: link.guild_id,
      source,
    });
    results.push(result);
  }

  const failed = results.find((r) => !r.success && !r.skipped);
  if (failed) return failed;

  return { success: true, results };
}
