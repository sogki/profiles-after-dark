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

const outRoot = path.resolve("supabase/archive/storage");
fs.mkdirSync(outRoot, { recursive: true });

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE_SIZE = 100;
const CONCURRENCY = 6;

async function listAllInPrefix(bucket, prefix = "") {
  const files = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

      // Folders have id === null in Supabase storage listing
      const isFolder = item.id === null;

      if (isFolder) {
        const nested = await listAllInPrefix(bucket, fullPath);
        files.push(...nested);
      } else {
        files.push({
          path: fullPath,
          size: item.metadata?.size ?? null,
          mime: item.metadata?.mimetype ?? null,
          updated_at: item.updated_at ?? null,
        });
      }
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return files;
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
if (bucketsError) {
  console.error("Failed to list buckets:", bucketsError.message);
  process.exit(1);
}

const manifest = {
  dumped_at: new Date().toISOString(),
  project_url: url,
  buckets: {},
  totals: { files: 0, bytes: 0, failed: 0 },
};

console.log(`Found ${buckets.length} buckets → ${outRoot}\n`);

for (const bucket of buckets) {
  const bucketName = bucket.name;
  const bucketDir = path.join(outRoot, bucketName);
  fs.mkdirSync(bucketDir, { recursive: true });

  process.stdout.write(`Listing ${bucketName}... `);
  let files;
  try {
    files = await listAllInPrefix(bucketName);
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
    manifest.buckets[bucketName] = {
      public: bucket.public,
      status: "list_failed",
      error: String(err.message || err),
      files: [],
    };
    continue;
  }
  console.log(`${files.length} files`);

  const downloaded = [];
  let bucketBytes = 0;
  let bucketFailed = 0;

  await mapPool(files, CONCURRENCY, async (file) => {
    const dest = path.join(bucketDir, file.path);
    ensureDirForFile(dest);

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(file.path);

      if (error) throw error;
      if (!data) throw new Error("empty response");

      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      bucketBytes += buffer.length;
      downloaded.push({
        path: file.path,
        bytes: buffer.length,
        mime: file.mime,
        status: "ok",
      });
      process.stdout.write(`  ✓ ${bucketName}/${file.path} (${buffer.length} bytes)\n`);
    } catch (err) {
      bucketFailed += 1;
      downloaded.push({
        path: file.path,
        bytes: 0,
        mime: file.mime,
        status: "failed",
        error: String(err.message || err),
      });
      process.stdout.write(`  ✗ ${bucketName}/${file.path}: ${err.message || err}\n`);
    }
  });

  manifest.buckets[bucketName] = {
    public: bucket.public,
    status: bucketFailed ? "partial" : "ok",
    file_count: downloaded.length,
    bytes: bucketBytes,
    failed: bucketFailed,
    files: downloaded,
  };
  manifest.totals.files += downloaded.length;
  manifest.totals.bytes += bucketBytes;
  manifest.totals.failed += bucketFailed;
}

fs.writeFileSync(
  path.join(outRoot, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

fs.writeFileSync(
  path.join(outRoot, "README.md"),
  `# Storage archive

Dumped on ${manifest.dumped_at}

- One folder per bucket under this directory
- \`manifest.json\` lists every file and download status

## Restore later

Upload files back into matching bucket names/paths in a new Supabase project
(Dashboard, CLI, or S3 sync).

**Privacy:** may contain user-uploaded media. Kept out of git via \`.gitignore\`.
`
);

const mb = (manifest.totals.bytes / (1024 * 1024)).toFixed(2);
console.log(
  `\nDone. ${manifest.totals.files} files, ${mb} MB, ${manifest.totals.failed} failed.`
);
console.log(`Archive: ${outRoot}`);
