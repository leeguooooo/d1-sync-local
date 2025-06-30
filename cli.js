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

class D1SyncLocal {
  constructor() {
    this.wranglerConfigPath = path.join(process.cwd(), 'wrangler.toml');
    this.exportDir = path.join(process.cwd(), '.d1-sync-exports');
  }

  async readWranglerConfig() {
    if (!fs.existsSync(this.wranglerConfigPath)) {
      throw new Error('wrangler.toml not found in current directory');
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
      description: `Binding: ${db.binding}`
    }));

    const { source } = await prompts({
      type: 'select',
      name: 'source',
      message: 'Select source database to sync from:',
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
      
      console.log(chalk.cyan(`\n📊 Synced ${tables.length} tables:`));
      
      for (const table of tables) {
        try {
          const countResult = await execAsync(`npx wrangler d1 execute ${databaseName} --local --command="SELECT COUNT(*) as count FROM ${table}"`);
          const match = countResult.stdout.match(/"count":\s*(\d+)/);
          const count = match ? match[1] : '0';
          console.log(chalk.green(`  ✓ ${table}: ${count} records`));
        } catch (e) {
          console.log(chalk.yellow(`  ⚠️  ${table}: unable to count`));
        }
      }
      
      return true;
    } catch (error) {
      console.warn(chalk.yellow('\n⚠️  Validation failed:'), error.message);
      return false;
    }
  }

  async run() {
    console.log(chalk.bold.cyan('\n🚀 D1 Sync to Local\n'));
    
    try {
      // Read wrangler.toml
      const spinner = ora('Reading wrangler.toml...').start();
      const config = await this.readWranglerConfig();
      const databases = this.parseD1Databases(config);
      spinner.succeed('Found wrangler.toml');
      
      if (Object.keys(databases).length === 0) {
        console.error(chalk.red('No D1 databases found in wrangler.toml'));
        process.exit(1);
      }
      
      // Let user select local database
      const localDb = databases.local;
      if (!localDb) {
        console.error(chalk.red('No local D1 database configuration found'));
        process.exit(1);
      }
      
      console.log(chalk.gray(`Local database: ${localDb.database_name}`));
      
      // Select source database
      const sourceDb = await this.selectDatabase(databases);
      if (!sourceDb) {
        console.log(chalk.red('No database selected'));
        return;
      }
      
      // Confirm
      console.log(chalk.yellow(`\n⚠️  This will sync ${sourceDb.database_name} to local database`));
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'All local data will be replaced. Continue?',
        initial: false
      });
      
      if (!confirm) {
        console.log(chalk.red('Cancelled'));
        return;
      }
      
      // Create export directory
      if (!fs.existsSync(this.exportDir)) {
        fs.mkdirSync(this.exportDir, { recursive: true });
      }
      
      // Export source database
      const exportSpinner = ora('Exporting source database...').start();
      const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
      const exportFile = path.join(this.exportDir, `export_${timestamp}.sql`);
      
      await this.executeCommand(
        `npx wrangler d1 export ${sourceDb.database_name} ${sourceDb.envFlag} --output="${exportFile}"`,
        exportSpinner,
        'Export completed'
      );
      
      // Delete local database files
      const deleteSpinner = ora('Cleaning local database...').start();
      const deletedCount = await this.deleteLocalDatabase(localDb.database_name);
      deleteSpinner.succeed(`Cleaned local database (${deletedCount} files)`);
      
      // Fix export file
      const fixSpinner = ora('Processing export file...').start();
      const fixedFile = exportFile.replace('.sql', '_fixed.sql');
      this.fixD1Export(exportFile, fixedFile);
      fixSpinner.succeed('Export file processed');
      
      // Import to local
      const importSpinner = ora('Importing to local database...').start();
      await this.executeCommand(
        `npx wrangler d1 execute ${localDb.database_name} --local --file="${fixedFile}"`,
        importSpinner,
        'Import completed'
      );
      
      // Clean up
      fs.unlinkSync(exportFile);
      fs.unlinkSync(fixedFile);
      
      // Validate
      await this.validateSync(localDb.database_name);
      
      console.log(chalk.green.bold('\n✨ Sync completed successfully!\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  }
}

// Run the tool
const sync = new D1SyncLocal();
sync.run();