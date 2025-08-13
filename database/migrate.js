#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * Database Migration Manager
 * Handles database initialization, schema updates, and data migrations
 */
class DatabaseMigrator {
    constructor() {
        this.dbPath = path.join(__dirname, 'steward.db');
        this.tablesPath = path.join(__dirname, 'tables.sql');
        this.indexesPath = path.join(__dirname, 'indexes.sql');
        this.viewsPath = path.join(__dirname, 'views.sql');
        this.db = null;
    }

    /**
     * Initialize database connection
     * @returns {Promise<void>}
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('✅ Database connection established');
                    // Enable foreign key constraints
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    /**
     * Close database connection
     * @returns {Promise<void>}
     */
    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Check if database exists and has tables
     * @returns {Promise<boolean>}
     */
    async databaseExists() {
        if (!fs.existsSync(this.dbPath)) {
            return false;
        }

        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='user_profile'",
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(!!row);
                    }
                }
            );
        });
    }

    /**
     * Get current database version
     * @returns {Promise<number>}
     */
    async getDatabaseVersion() {
        return new Promise((resolve) => {
            this.db.get('PRAGMA user_version', (err, row) => {
                if (err) {
                    console.warn('Could not get database version:', err.message);
                    resolve(0);
                } else {
                    resolve(row.user_version);
                }
            });
        });
    }

    /**
     * Set database version
     * @param {number} version - Version number to set
     * @returns {Promise<void>}
     */
    async setDatabaseVersion(version) {
        return new Promise((resolve, reject) => {
            this.db.run(`PRAGMA user_version = ${version}`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Database version set to ${version}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Execute SQL statements from a file
     * @param {string} filePath - Path to SQL file
     * @param {string} description - Description for logging
     * @returns {Promise<void>}
     */
    async executeSQLFile(filePath, description) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filePath)) {
                reject(new Error(`SQL file not found: ${filePath}`));
                return;
            }

            const sql = fs.readFileSync(filePath, 'utf8');
            
            // Split into individual statements and clean them up
            const statements = sql
                .replace(/--[^\n]*/g, '') // Remove comment lines
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => {
                    // Filter out empty statements
                    return stmt.length > 0 && 
                           stmt.toLowerCase().includes('create');
                })
                .map(stmt => stmt + ';'); // Re-add semicolon

            if (statements.length === 0) {
                console.log(`⚠️  No valid statements found in ${description}`);
                resolve();
                return;
            }

            console.log(`📝 Executing ${statements.length} ${description} statements...`);

            let completed = 0;
            
            const executeNext = () => {
                if (completed >= statements.length) {
                    console.log(`✅ ${description} completed successfully`);
                    resolve();
                    return;
                }

                const statement = statements[completed];
                this.db.run(statement, (err) => {
                    if (err) {
                        console.error(`Error executing ${description} statement ${completed + 1}:`, err);
                        console.error('Statement:', statement.substring(0, 100) + '...');
                        reject(err);
                    } else {
                        completed++;
                        executeNext();
                    }
                });
            };

            executeNext();
        });
    }

    /**
     * Create complete database schema
     * @returns {Promise<void>}
     */
    async createSchema() {
        console.log('🏗️  Creating database schema...');
        
        // Execute in order: tables, then indexes, then views
        await this.executeSQLFile(this.tablesPath, 'table creation');
        await this.executeSQLFile(this.indexesPath, 'index creation');
        await this.executeSQLFile(this.viewsPath, 'view creation');
        
        console.log('✅ Complete schema created successfully');
    }

    /**
     * Create backup of existing database
     * @returns {Promise<string>} Path to backup file
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, `steward-backup-${timestamp}.db`);
        
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(this.dbPath)) {
                resolve(null); // No database to backup
                return;
            }

            fs.copyFile(this.dbPath, backupPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Database backup created: ${backupPath}`);
                    resolve(backupPath);
                }
            });
        });
    }

    /**
     * Run database migrations
     * @param {boolean} force - Force recreation of database
     * @returns {Promise<void>}
     */
    async migrate(force = false) {
        try {
            console.log('🚀 Starting database migration...');

            await this.initialize();

            const exists = await this.databaseExists();
            const currentVersion = exists ? await this.getDatabaseVersion() : 0;
            const targetVersion = 1; // Current schema version

            console.log(`📊 Current version: ${currentVersion}, Target version: ${targetVersion}`);

            if (force || !exists) {
                console.log('🔄 Creating fresh database...');
                
                if (exists) {
                    await this.createBackup();
                }
                
                await this.createSchema();
                await this.setDatabaseVersion(targetVersion);
                
            } else if (currentVersion < targetVersion) {
                console.log('⬆️  Upgrading database schema...');
                await this.createBackup();
                
                // Future: Add version-specific migration logic here
                // For now, we'll just update the schema
                await this.createSchema();
                await this.setDatabaseVersion(targetVersion);
                
            } else {
                console.log('✅ Database is up to date');
            }

            console.log('🎉 Migration completed successfully');

        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        } finally {
            await this.close();
        }
    }

    /**
     * Reset database (for development/testing)
     * @returns {Promise<void>}
     */
    async reset() {
        try {
            console.log('🔥 Resetting database...');
            
            if (fs.existsSync(this.dbPath)) {
                await this.createBackup();
                fs.unlinkSync(this.dbPath);
                console.log('🗑️  Existing database deleted');
            }

            await this.migrate(true);
            console.log('✅ Database reset completed');

        } catch (error) {
            console.error('❌ Reset failed:', error);
            throw error;
        }
    }

    /**
     * Validate database integrity
     * @returns {Promise<boolean>}
     */
    async validate() {
        try {
            await this.initialize();

            return new Promise((resolve, reject) => {
                this.db.run('PRAGMA integrity_check', (err) => {
                    if (err) {
                        console.error('❌ Database integrity check failed:', err);
                        reject(err);
                    } else {
                        console.log('✅ Database integrity check passed');
                        resolve(true);
                    }
                });
            });

        } catch (error) {
            console.error('❌ Validation failed:', error);
            return false;
        } finally {
            await this.close();
        }
    }

    /**
     * Show database statistics
     * @returns {Promise<void>}
     */
    async showStats() {
        try {
            await this.initialize();

            const tables = [
                'user_profile',
                'model_performance',
                'routing_decisions',
                'user_feedback',
                'learning_insights',
                'journal_entries',
                'context_data'
            ];

            console.log('\n📈 Database Statistics:');
            console.log('========================');

            for (const table of tables) {
                await new Promise((resolve) => {
                    this.db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                        if (err) {
                            console.log(`${table}: Error - ${err.message}`);
                        } else {
                            console.log(`${table}: ${row.count} records`);
                        }
                        resolve();
                    });
                });
            }

            // Show database file size
            const stats = fs.statSync(this.dbPath);
            const fileSizeInBytes = stats.size;
            const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
            console.log(`\nDatabase file size: ${fileSizeInMB} MB`);

        } catch (error) {
            console.error('❌ Failed to show stats:', error);
        } finally {
            await this.close();
        }
    }
}

// CLI interface
if (require.main === module) {
    const migrator = new DatabaseMigrator();
    const command = process.argv[2] || 'migrate';

    const commands = {
        'migrate': () => migrator.migrate(),
        'reset': () => migrator.reset(),
        'validate': () => migrator.validate(),
        'stats': () => migrator.showStats(),
        'help': () => {
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    DATABASE MIGRATOR                          ║
║                   The Steward Database                        ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node database/migrate.js [command]

COMMANDS:
  migrate     Create or update database schema (default)
  reset       Delete and recreate database from scratch
  validate    Check database integrity
  stats       Show database statistics
  help        Show this help message

EXAMPLES:
  node database/migrate.js
  node database/migrate.js reset
  node database/migrate.js stats
            `);
        }
    };

    if (commands[command]) {
        commands[command]().catch(error => {
            console.error('Command failed:', error.message);
            process.exit(1);
        });
    } else {
        console.error(`Unknown command: ${command}`);
        commands.help();
        process.exit(1);
    }
}

module.exports = DatabaseMigrator;