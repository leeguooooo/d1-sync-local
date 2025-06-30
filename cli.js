#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const prompts = require('prompts');
const toml = require('toml');
const chalk = require('chalk');
const ora = require('ora');

const execAsync = promisify(exec);
const packageJson = require('./package.json');
const { detectLanguage, t } = require('./locales');

// Detect user language
const lang = detectLanguage();

// Check for version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(packageJson.version);
  process.exit(0);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${chalk.bold('d1-sync-local')} - ${t('description', lang)}

${chalk.bold(t('usage', lang) + ':')}
  d1-sync-local    Sync D1 database to local
  d1sl             ${t('shortAlias', lang)}

${chalk.bold(t('options', lang) + ':')}
  -v, --version    ${t('showVersion', lang)}
  -h, --help       ${t('showHelp', lang)}

${chalk.bold(t('examples', lang) + ':')}
  $ d1-sync-local
  $ d1sl
  $ npx d1-sync-local
`);
  process.exit(0);
}

class D1SyncLocal {
  constructor() {
    this.wranglerConfigPath = path.join(process.cwd(), 'wrangler.toml');
    this.exportDir = path.join(process.cwd(), '.d1-sync-exports');
    this.lang = lang;
  }

  async readWranglerConfig() {
    if (!fs.existsSync(this.wranglerConfigPath)) {
      throw new Error(t('configNotFound', this.lang));
    }

    const configContent = fs.readFileSync(this.wranglerConfigPath, 'utf-8');
    return toml.parse(configContent);
  }

  parseD1Databases(config) {
    const databases = {};
    
    // Parse default/local database
    if (config.d1_databases) {
      config.d1_databases.forEach(db => {
        databases.local = {
          name: 'Local/Default',
          binding: db.binding,
          database_name: db.database_name,
          database_id: db.database_id,
          envFlag: ''
        };
      });
    }

    // Parse environment-specific databases
    if (config.env) {
      Object.entries(config.env).forEach(([envName, envConfig]) => {
        if (envConfig.d1_databases) {
          envConfig.d1_databases.forEach(db => {
            databases[envName] = {
              name: envName.charAt(0).toUpperCase() + envName.slice(1),
              binding: db.binding,
              database_name: db.database_name,
              database_id: db.database_id,
              envFlag: `--env ${envName}`
            };
          });
        }
      });
    }

    return databases;
  }

  async selectDatabase(databases) {
    const choices = Object.entries(databases).map(([key, db]) => ({
      title: `${db.name} (${db.database_name})`,
      value: key,
      description: `${t('binding', this.lang)}: ${db.binding}`
    }));

    const { source } = await prompts({
      type: 'select',
      name: 'source',
      message: t('selectSource', this.lang),
      choices
    });

    return source ? databases[source] : null;
  }

  async executeCommand(command, spinner, successMsg) {
    try {
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
      if (stderr && !stderr.includes('warning')) {
        throw new Error(stderr);
      }
      spinner.succeed(successMsg);
      return stdout;
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }

  fixD1Export(inputFile, outputFile) {
    const content = fs.readFileSync(inputFile, 'utf8');
    
    // Add DROP TABLE IF EXISTS before CREATE TABLE
    let fixedContent = content.replace(/CREATE TABLE (\w+)/g, 'DROP TABLE IF EXISTS $1;\nCREATE TABLE $1');
    
    // Fix INSERT statements with missing quotes
    fixedContent = fixedContent.replace(/INSERT INTO (\w+) VALUES\((.*?)\);/gs, (match, tableName, values) => {
      const fixedValues = values.split(/,(?![^()]*\))/).map(value => {
        value = value.trim();
        if (value === 'NULL') return value;
        if (value.startsWith("'") && value.endsWith("'")) return value;
        if (/^-?\d+(\.\d+)?$/.test(value)) return value;
        return `'${value.replace(/'/g, "''")}'`;
      });
      return `INSERT INTO ${tableName} VALUES(${fixedValues.join(',')});`;
    });
    
    fs.writeFileSync(outputFile, fixedContent);
  }

  async deleteLocalDatabase(databaseName) {
    const wranglerDir = path.join(process.cwd(), '.wrangler');
    let deletedCount = 0;
    
    if (fs.existsSync(wranglerDir)) {
      const findDbFiles = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            findDbFiles(fullPath);
          } else if (file.includes(databaseName)) {
            try {
              fs.unlinkSync(fullPath);
              deletedCount++;
            } catch (e) {
              // Ignore errors
            }
          }
        }
      };
      
      findDbFiles(wranglerDir);
    }
    
    return deletedCount;
  }

  async validateSync(databaseName) {
    try {
      const result = await execAsync(`npx wrangler d1 execute ${databaseName} --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"`);
      
      const tables = [];
      const matches = result.stdout.match(/"name":\s*"([^"]+)"/g);
      if (matches) {
        matches.forEach(match => {
          const tableName = match.match(/"name":\s*"([^"]+)"/)[1];
          tables.push(tableName);
        });
      }
      
      console.log(chalk.cyan(`\n📊 ${t('syncedTables', this.lang, { count: tables.length })}`));
      
      for (const table of tables) {
        try {
          const countResult = await execAsync(`npx wrangler d1 execute ${databaseName} --local --command="SELECT COUNT(*) as count FROM ${table}"`);
          const match = countResult.stdout.match(/"count":\s*(\d+)/);
          const count = match ? match[1] : '0';
          console.log(chalk.green(`  ✓ ${table}: ${count} ${t('records', this.lang)}`));
        } catch (e) {
          console.log(chalk.yellow(`  ⚠️  ${table}: ${t('unableToCount', this.lang)}`));
        }
      }
      
      return true;
    } catch (error) {
      console.warn(chalk.yellow(`\n⚠️  ${t('validationFailed', this.lang)}`), error.message);
      return false;
    }
  }

  async run() {
    console.log(chalk.bold.cyan('\n' + t('title', this.lang) + '\n'));
    
    try {
      // Read wrangler.toml
      const spinner = ora(t('readingConfig', this.lang)).start();
      const config = await this.readWranglerConfig();
      const databases = this.parseD1Databases(config);
      spinner.succeed(t('foundConfig', this.lang));
      
      if (Object.keys(databases).length === 0) {
        console.error(chalk.red(t('noDatabases', this.lang)));
        process.exit(1);
      }
      
      // Let user select local database
      const localDb = databases.local;
      if (!localDb) {
        console.error(chalk.red(t('noLocalDb', this.lang)));
        process.exit(1);
      }
      
      console.log(chalk.gray(`${t('localDatabase', this.lang)}: ${localDb.database_name}`));
      
      // Select source database
      const sourceDb = await this.selectDatabase(databases);
      if (!sourceDb) {
        console.log(chalk.red(t('noDbSelected', this.lang)));
        return;
      }
      
      // Confirm
      console.log(chalk.yellow(`\n⚠️  ${t('syncWarning', this.lang, { source: sourceDb.database_name })}`));
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: t('confirmReplace', this.lang),
        initial: false
      });
      
      if (!confirm) {
        console.log(chalk.red(t('cancelled', this.lang)));
        return;
      }
      
      // Create export directory
      if (!fs.existsSync(this.exportDir)) {
        fs.mkdirSync(this.exportDir, { recursive: true });
      }
      
      // Export source database
      const exportSpinner = ora(t('exportingDb', this.lang)).start();
      const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
      const exportFile = path.join(this.exportDir, `export_${timestamp}.sql`);
      
      await this.executeCommand(
        `npx wrangler d1 export ${sourceDb.database_name} ${sourceDb.envFlag} --output="${exportFile}"`,
        exportSpinner,
        t('exportComplete', this.lang)
      );
      
      // Delete local database files
      const deleteSpinner = ora(t('cleaningLocal', this.lang)).start();
      const deletedCount = await this.deleteLocalDatabase(localDb.database_name);
      deleteSpinner.succeed(t('cleanedLocal', this.lang, { count: deletedCount }));
      
      // Fix export file
      const fixSpinner = ora(t('processingExport', this.lang)).start();
      const fixedFile = exportFile.replace('.sql', '_fixed.sql');
      this.fixD1Export(exportFile, fixedFile);
      fixSpinner.succeed(t('exportProcessed', this.lang));
      
      // Import to local
      const importSpinner = ora(t('importingLocal', this.lang)).start();
      await this.executeCommand(
        `npx wrangler d1 execute ${localDb.database_name} --local --file="${fixedFile}"`,
        importSpinner,
        t('importComplete', this.lang)
      );
      
      // Clean up
      fs.unlinkSync(exportFile);
      fs.unlinkSync(fixedFile);
      
      // Validate
      await this.validateSync(localDb.database_name);
      
      console.log(chalk.green.bold('\n' + t('syncSuccess', this.lang) + '\n'));
      
    } catch (error) {
      console.error(chalk.red(`\n❌ ${t('error', this.lang)}`), error.message);
      process.exit(1);
    }
  }
}

// Run the tool
const sync = new D1SyncLocal();
sync.run();