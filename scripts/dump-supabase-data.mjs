import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = { ...loadEnv(".env"), ...loadEnv("night-owl-bot/.env") };
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const outDir = path.resolve("supabase/archive");
const tablesDir = path.join(outDir, "tables");
fs.mkdirSync(tablesDir, { recursive: true });

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE_SIZE = 1000;

async function listPublicTables() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load OpenAPI schema: ${res.status} ${await res.text()}`);
  }

  const openapi = await res.json();
  return Object.keys(openapi.definitions || {})
    .filter((name) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name))
    .sort();
}

async function dumpTable(table) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const file = path.join(tablesDir, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2));
  return rows.length;
}

async function dumpAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`auth.users: ${error.message}`);
    const batch = data?.users || [];
    if (batch.length === 0) break;
    users.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        banned_until: u.banned_until,
        role: u.role,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata,
      }))
    );
    if (batch.length < perPage) break;
    page += 1;
  }

  const file = path.join(tablesDir, "auth_users.json");
  fs.writeFileSync(file, JSON.stringify(users, null, 2));
  return users.length;
}

async function dumpStorageBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`storage.buckets: ${error.message}`);
  const buckets = data || [];
  fs.writeFileSync(
    path.join(tablesDir, "storage_buckets.json"),
    JSON.stringify(buckets, null, 2)
  );
  return buckets;
}

const tables = await listPublicTables();
const summary = {
  dumped_at: new Date().toISOString(),
  project_url: url,
  tables: {},
  auth_users: 0,
  storage_buckets: [],
  notes: [
    "Public table rows dumped via PostgREST (service role).",
    "Auth users dumped via Admin API (subset of fields).",
    "Storage bucket metadata only — file objects are not downloaded.",
    "Migrations in supabase/migrations/ remain the schema source of truth.",
  ],
};

console.log(`Found ${tables.length} public tables`);

for (const table of tables) {
  process.stdout.write(`Dumping ${table}... `);
  try {
    const count = await dumpTable(table);
    summary.tables[table] = { rows: count, status: "ok" };
    console.log(`${count} rows`);
  } catch (err) {
    summary.tables[table] = { rows: 0, status: "error", error: String(err.message || err) };
    console.log(`FAILED: ${err.message || err}`);
  }
}

process.stdout.write("Dumping auth users... ");
try {
  summary.auth_users = await dumpAuthUsers();
  console.log(`${summary.auth_users} users`);
} catch (err) {
  summary.auth_users = -1;
  summary.auth_users_error = String(err.message || err);
  console.log(`FAILED: ${err.message || err}`);
}

process.stdout.write("Dumping storage bucket metadata... ");
try {
  const buckets = await dumpStorageBuckets();
  summary.storage_buckets = buckets.map((b) => b.name);
  console.log(`${buckets.length} buckets`);
} catch (err) {
  summary.storage_buckets_error = String(err.message || err);
  console.log(`FAILED: ${err.message || err}`);
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(summary, null, 2));
fs.writeFileSync(
  path.join(outDir, "README.md"),
  `# Supabase archive

Dumped on ${summary.dumped_at}

- \`tables/*.json\` — row data for each public table
- \`tables/auth_users.json\` — auth users (via Admin API)
- \`tables/storage_buckets.json\` — storage bucket metadata only
- \`manifest.json\` — dump summary

Schema lives in \`../migrations/\`. Storage **files** (images etc.) are not included; download those from the Supabase Dashboard → Storage if needed.

**Privacy:** this archive may contain emails and personal data. Do not commit it to a public repo.
`
);

console.log("\nDone. Archive written to supabase/archive/");
