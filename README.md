# d1-sync-local

Sync Cloudflare D1 remote databases to your local development environment with ease.

## Features

- 🚀 **Auto-detection**: Automatically reads `wrangler.toml` to find all D1 databases
- 🔄 **Environment support**: Sync from any environment (dev, staging, production)
- 🛡️ **Safe operation**: Confirms before overwriting local data
- 📊 **Validation**: Shows synced tables and record counts
- 🎨 **Beautiful CLI**: Colored output with progress indicators
- 🌍 **Multi-language**: Auto-detects language (English, 简体中文, 繁體中文, 日本語)

## Installation

```bash
npm install -g d1-sync-local
```

Or use directly with npx:

```bash
npx d1-sync-local
```

## Usage

Navigate to your Cloudflare Workers project directory (where `wrangler.toml` is located) and run:

```bash
d1-sync-local
```

Or use the shorter alias:

```bash
d1sl
```

The tool will:
1. Read your `wrangler.toml` configuration
2. Show all available D1 databases
3. Let you select which remote database to sync from
4. Sync the data to your local development database
5. Validate and show the results

## Requirements

- Node.js >= 14.0.0
- Wrangler CLI installed (`npm install -g wrangler`)
- A Cloudflare Workers project with D1 database configuration

## How it works

1. **Reads wrangler.toml**: Automatically detects all D1 database configurations
2. **Exports remote data**: Uses `wrangler d1 export` to get remote database data
3. **Fixes SQL format**: Handles D1 export format issues (missing quotes, etc.)
4. **Cleans local database**: Removes existing local database files
5. **Imports data**: Creates fresh local database with remote data
6. **Validates**: Shows imported tables and record counts

## Example

```bash
$ d1-sync-local

🚀 D1 Sync to Local

✓ Found wrangler.toml
Local database: my-app-db

? Select source database to sync from:
❯ Local/Default (my-app-db)
  Staging (my-app-db-staging)
  Production (my-app-db-production)

⚠️  This will sync my-app-db-staging to local database
? All local data will be replaced. Continue? (y/N)

✓ Export completed
✓ Cleaned local database (3 files)
✓ Export file processed
✓ Import completed

📊 Synced 6 tables:
  ✓ users: 150 records
  ✓ products: 89 records
  ✓ orders: 1203 records
  ✓ categories: 12 records
  ✓ sessions: 567 records
  ✓ logs: 4521 records

✨ Sync completed successfully!
```

## Configuration

The tool reads your `wrangler.toml` file to find D1 databases:

```toml
# Default/Local database
[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Environment-specific databases
[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "my-app-db-staging"
database_id = "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "my-app-db-production"
database_id = "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"
```

## Language Support

The tool automatically detects your system language and displays messages in:
- **English** (default)
- **简体中文** (Simplified Chinese)
- **繁體中文** (Traditional Chinese)
- **日本語** (Japanese)

### Manual Language Selection

You can override the auto-detected language using the `D1_SYNC_LANG` environment variable:

```bash
# Use Simplified Chinese
D1_SYNC_LANG=zh-cn d1-sync-local

# Use Traditional Chinese
D1_SYNC_LANG=zh-tw d1-sync-local

# Use Japanese
D1_SYNC_LANG=ja d1-sync-local

# Use English
D1_SYNC_LANG=en d1-sync-local
```

## Troubleshooting

### "wrangler.toml not found"
Make sure you run the command in your Cloudflare Workers project directory.

### "No D1 databases found"
Check that your `wrangler.toml` has D1 database configurations.

### Permission errors
Make sure you have the necessary permissions to access the remote databases.

## License

MIT