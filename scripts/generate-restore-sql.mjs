import fs from "fs";
import path from "path";

const archiveDir = path.resolve("supabase/archive");
const tablesDir = path.join(archiveDir, "tables");
const outFile = path.join(archiveDir, "restore.sql");

const SKIP_FILES = new Set(["auth_users.json", "storage_buckets.json"]);

/** Prefer parents before dependents when FK checks are on (replica mode still helps). */
const TABLE_ORDER = [
  "badges",
  "spam_patterns",
  "moderation_rules",
  "system_settings",
  "bot_config",
  "guild_settings",
  "modlogs_channels",
  "user_profiles",
  "user_roles",
  "user_settings",
  "user_stats",
  "staff_permissions",
  "profiles",
  "profile_pairs",
  "emotes",
  "emoji_combos",
  "wallpapers",
  "announcements",
  "announcement_views",
  "announcement_dismissals",
  "downloads",
  "favorites",
  "follows",
  "feedback",
  "user_badges",
  "badge_progress",
  "notifications",
  "reports",
  "appeals",
  "appeals_responses",
  "moderation_logs",
  "moderation_actions",
  "moderation_threads",
  "moderation_messages",
  "mod_cases",
  "mod_logs",
  "user_warnings",
  "auto_moderation_scans",
  "deleted_messages",
  "discord_users",
  "discord_webhooks",
  "account_linking_codes",
  "account_backups",
  "api_metrics",
  "ticket_conversations",
  "flair_profiles",
  "flair_profile_themes",
  "flair_profile_layouts",
  "flair_subscriptions",
  "flair_emote_collections",
  "flair_emote_sets",
  "flair_emotes",
];

function dollarQuote(value, tag = "pad") {
  let i = 0;
  let marker = `$${tag}$`;
  while (value.includes(marker)) {
    i += 1;
    marker = `$${tag}${i}$`;
  }
  return `${marker}${value}${marker}`;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  if (value === null || value === undefined) return "'{}'::jsonb";
  return `${dollarQuote(JSON.stringify(value))}::jsonb`;
}

function sqlTimestamp(value) {
  if (!value) return "NULL";
  return `${sqlString(value)}::timestamptz`;
}

const tableFiles = fs
  .readdirSync(tablesDir)
  .filter((f) => f.endsWith(".json") && !SKIP_FILES.has(f));

const available = new Map(
  tableFiles.map((f) => [f.replace(/\.json$/, ""), path.join(tablesDir, f)])
);

const orderedNames = [
  ...TABLE_ORDER.filter((name) => available.has(name)),
  ...[...available.keys()].filter((name) => !TABLE_ORDER.includes(name)).sort(),
];

const lines = [];
lines.push(`-- Profiles After Dark — data restore
-- Generated: ${new Date().toISOString()}
--
-- HOW TO USE (future restore):
-- 1. Create a new Supabase project
-- 2. Apply schema from supabase/migrations (supabase db push / migration up)
-- 3. Run this file in the SQL Editor (or: psql --file supabase/archive/restore.sql)
--
-- Notes:
-- - This restores public table DATA from the JSON archive dump.
-- - Auth users are recreated without original password hashes; they must reset passwords.
-- - Storage FILES are not included (only table rows that reference URLs).
-- - session_replication_role = replica relaxes FK/trigger enforcement during load.
`);

lines.push("BEGIN;");
lines.push("SET LOCAL session_replication_role = replica;");
lines.push("");

// Auth users first so public FKs to auth.users succeed when replica mode is off.
const authPath = path.join(tablesDir, "auth_users.json");
if (fs.existsSync(authPath)) {
  const users = loadJson(authPath);
  lines.push("-- ---------------------------------------------------------------------------");
  lines.push("-- auth.users + auth.identities (password hashes unavailable — reset required)");
  lines.push("-- ---------------------------------------------------------------------------");
  lines.push("");

  for (const user of users) {
    const id = user.id;
    const email = user.email || null;
    const phone = user.phone || null;
    const role = user.role || "authenticated";
    const appMeta = user.app_metadata || { provider: "email", providers: ["email"] };
    const userMeta = user.user_metadata || {};

    lines.push(`-- user ${email || id}`);
    lines.push(`INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  banned_until,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  ${sqlString(id)}::uuid,
  'authenticated',
  ${sqlString(role)},
  ${sqlString(email)},
  NULL,
  ${sqlTimestamp(user.email_confirmed_at)},
  ${sqlTimestamp(user.banned_until)},
  ${sqlJson(appMeta)},
  ${sqlJson(userMeta)},
  ${sqlTimestamp(user.created_at)},
  ${sqlTimestamp(user.created_at)},
  ${sqlTimestamp(user.last_sign_in_at)},
  '',
  '',
  '',
  '',
  ${sqlString(phone)},
  false,
  false
) ON CONFLICT (id) DO NOTHING;`);

    if (email) {
      lines.push(`INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  ${sqlString(id)}::uuid,
  ${sqlString(id)}::uuid,
  ${sqlJson({
    sub: id,
    email,
    email_verified: Boolean(user.email_confirmed_at),
    phone_verified: false,
  })},
  'email',
  ${sqlString(email)},
  ${sqlTimestamp(user.last_sign_in_at || user.created_at)},
  ${sqlTimestamp(user.created_at)},
  ${sqlTimestamp(user.created_at)}
) ON CONFLICT DO NOTHING;`);
    }

    lines.push("");
  }
}

for (const table of orderedNames) {
  const rows = loadJson(available.get(table));
  lines.push(`-- ---------------------------------------------------------------------------`);
  lines.push(`-- public.${table} (${rows.length} rows)`);
  lines.push(`-- ---------------------------------------------------------------------------`);

  if (!Array.isArray(rows) || rows.length === 0) {
    lines.push(`-- (empty)`);
    lines.push("");
    continue;
  }

  const payload = dollarQuote(JSON.stringify(rows));
  lines.push(`INSERT INTO public.${table}`);
  lines.push(`SELECT * FROM jsonb_populate_recordset(NULL::public.${table}, ${payload}::jsonb);`);
  lines.push("");
}

lines.push("SET LOCAL session_replication_role = DEFAULT;");
lines.push("COMMIT;");
lines.push("");
lines.push("-- Restore complete.");

fs.writeFileSync(outFile, lines.join("\n"), "utf8");

const sizeMb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
console.log(`Wrote ${outFile} (${sizeMb} MB)`);
console.log(`Tables: ${orderedNames.length}`);
console.log(`Auth users: ${fs.existsSync(authPath) ? loadJson(authPath).length : 0}`);
