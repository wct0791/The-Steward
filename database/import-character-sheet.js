#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const DatabaseManager = require('./DatabaseManager');

/**
 * Character Sheet Importer
 * Imports Chip's character sheet data into the user_profile table
 */
class CharacterSheetImporter {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.characterSheetPath = path.join(__dirname, '..', 'character-sheet.yaml');
    }

    /**
     * Load and parse character sheet YAML
     * @returns {Promise<object>} Parsed character sheet data
     */
    async loadCharacterSheet() {
        try {
            if (!fs.existsSync(this.characterSheetPath)) {
                throw new Error(`Character sheet not found: ${this.characterSheetPath}`);
            }

            const yamlContent = fs.readFileSync(this.characterSheetPath, 'utf8');
            const characterData = yaml.load(yamlContent);
            
            console.log('✅ Character sheet loaded successfully');
            return characterData;

        } catch (error) {
            console.error('❌ Failed to load character sheet:', error.message);
            throw error;
        }
    }

    /**
     * Transform character sheet data for database storage
     * @param {object} rawData - Raw character sheet data
     * @returns {object} Transformed data ready for database
     */
    transformData(rawData) {
        return {
            name: rawData.name,
            roles: rawData.roles,
            learning_goals: rawData.learning_goals,
            current_projects: rawData.current_projects,
            tone_preference: rawData.tone_preference,
            neurotype_style: rawData.neurotype_style,
            preferred_formats: rawData.preferred_formats,
            default_output_format: rawData.preferences?.default_output_format || rawData.default_output_format,
            default_verbosity: rawData.preferences?.default_verbosity || rawData.default_verbosity,
            copilot_comments_format: rawData.copilot_comments_format,
            abilities: rawData.abilities,
            preferences: rawData.preferences,
            tools_environment: rawData.tools_environment,
            task_type_preferences: rawData.task_type_preferences,
            fallback_behavior: rawData.fallback_behavior,
            loadouts: rawData.loadouts,
            active_memory: rawData.active_memory,
            model_endpoints: rawData.model_endpoints,
            
            // Future enhancement fields (prepare for time-aware routing)
            time_of_day_profile: this.extractTimeProfile(rawData),
            cognitive_patterns: this.extractCognitivePatterns(rawData)
        };
    }

    /**
     * Extract time-of-day preferences from character data
     * @param {object} rawData - Raw character sheet data
     * @returns {object} Time-based preferences
     */
    extractTimeProfile(rawData) {
        // Future enhancement: analyze task_type_preferences and other data
        // to infer time-based routing preferences
        const timeProfile = {
            peak_hours: [], // Hours when user is most productive
            preferred_models_by_time: {}, // Different models for different times
            energy_patterns: {}, // Energy levels throughout the day
            task_preferences_by_time: {} // What tasks work best at what times
        };

        // For now, return empty structure ready for future enhancement
        return timeProfile;
    }

    /**
     * Extract cognitive patterns from character data
     * @param {object} rawData - Raw character sheet data
     * @returns {object} Cognitive patterns and preferences
     */
    extractCognitivePatterns(rawData) {
        const patterns = {
            neurotype_accommodations: {
                adhd_aware: rawData.neurotype_style?.includes('ADHD'),
                clarity_first: rawData.neurotype_style?.includes('clarity-first'),
                scaffold_friendly: rawData.neurotype_style?.includes('scaffold-friendly')
            },
            
            communication_style: {
                tone: rawData.tone_preference,
                formatting_preferences: rawData.preferences?.formatting_style || [],
                prompting_style: rawData.preferences?.prompting_style || []
            },
            
            working_patterns: {
                scripting_preference: rawData.abilities?.scripting_preference,
                ide: rawData.abilities?.ide,
                memory_usage: rawData.preferences?.memory_use || {}
            },
            
            ai_interaction_preferences: {
                ai_behavior_preferences: rawData.preferences?.ai_behavior || [],
                default_verbosity: rawData.default_verbosity,
                copilot_integration: !!rawData.copilot_comments_format
            }
        };

        return patterns;
    }

    /**
     * Display import summary
     * @param {object} characterData - Character data being imported
     */
    displayImportSummary(characterData) {
        console.log('\n📊 IMPORT SUMMARY');
        console.log('==================');
        console.log(`Name: ${characterData.name}`);
        console.log(`Roles: ${(characterData.roles || []).length} roles`);
        console.log(`Learning Goals: ${(characterData.learning_goals || []).length} goals`);
        console.log(`Current Projects: ${(characterData.current_projects || []).length} projects`);
        console.log(`Task Type Preferences: ${Object.keys(characterData.task_type_preferences || {}).length} mappings`);
        console.log(`Loadouts: ${Object.keys(characterData.loadouts || {}).length} configurations`);
        console.log(`Tools Environment: ${Object.keys(characterData.tools_environment || {}).length} categories`);
        console.log(`Active Memory: ${(characterData.active_memory || []).length} items`);

        // Show key preferences
        if (characterData.tone_preference) {
            console.log(`Tone Preference: ${characterData.tone_preference}`);
        }
        if (characterData.neurotype_style) {
            console.log(`Neurotype Style: ${characterData.neurotype_style}`);
        }
        if (characterData.default_output_format) {
            console.log(`Default Output: ${characterData.default_output_format}`);
        }
    }

    /**
     * Validate character sheet data
     * @param {object} characterData - Character data to validate
     * @returns {object} Validation result
     */
    validateCharacterData(characterData) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!characterData.name) {
            errors.push('Name is required');
        }

        // Validate task type preferences
        if (characterData.task_type_preferences) {
            const validTaskTypes = ['write', 'summarize', 'debug', 'route', 'research', 'fallback', 'sensitive'];
            for (const taskType of Object.keys(characterData.task_type_preferences)) {
                if (!validTaskTypes.includes(taskType)) {
                    warnings.push(`Unknown task type: ${taskType}`);
                }
            }
        }

        // Validate loadouts
        if (characterData.loadouts) {
            for (const [loadoutName, loadout] of Object.entries(characterData.loadouts)) {
                if (!loadout.model) {
                    warnings.push(`Loadout '${loadoutName}' missing model specification`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Import character sheet data into database
     * @param {boolean} force - Force reimport even if user exists
     * @returns {Promise<void>}
     */
    async import(force = false) {
        try {
            console.log('🚀 Starting character sheet import...');

            // Load character sheet
            const rawData = await this.loadCharacterSheet();
            
            // Transform data
            const characterData = this.transformData(rawData);
            
            // Validate data
            const validation = this.validateCharacterData(characterData);
            
            if (!validation.valid) {
                console.error('❌ Validation failed:');
                validation.errors.forEach(error => console.error(`  - ${error}`));
                throw new Error('Character sheet validation failed');
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️  Validation warnings:');
                validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
            }

            // Display summary
            this.displayImportSummary(characterData);

            // Check if user already exists
            if (!force) {
                const existingProfile = await this.dbManager.getUserProfile(characterData.name);
                if (existingProfile) {
                    console.log('\n⚠️  User profile already exists. Use --force to overwrite.');
                    const answer = await this.promptUser('Overwrite existing profile? (y/N): ');
                    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                        console.log('Import cancelled.');
                        return;
                    }
                }
            }

            // Save to database
            console.log('\n💾 Saving to database...');
            const profileId = await this.dbManager.saveUserProfile(characterData);
            
            console.log(`✅ Character sheet imported successfully!`);
            console.log(`   Profile ID: ${profileId}`);
            console.log(`   Name: ${characterData.name}`);

            // Verify the import
            console.log('\n🔍 Verifying import...');
            const savedProfile = await this.dbManager.getUserProfile(characterData.name);
            
            if (savedProfile) {
                console.log('✅ Verification successful - data retrieved from database');
                
                // Show key data points
                console.log('\n📋 Key Profile Data:');
                console.log(`  Roles: ${savedProfile.roles?.length || 0}`);
                console.log(`  Task Preferences: ${Object.keys(savedProfile.task_type_preferences || {}).length}`);
                console.log(`  Loadouts: ${Object.keys(savedProfile.loadouts || {}).length}`);
                console.log(`  Profile Version: ${savedProfile.profile_version}`);
            } else {
                throw new Error('Verification failed - could not retrieve saved profile');
            }

        } catch (error) {
            console.error('❌ Import failed:', error.message);
            throw error;
        } finally {
            await this.dbManager.close();
        }
    }

    /**
     * Simple prompt for user input
     * @private
     */
    async promptUser(question) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    /**
     * Show current profile data
     * @param {string} name - User name to show
     * @returns {Promise<void>}
     */
    async showProfile(name) {
        try {
            const profile = await this.dbManager.getUserProfile(name);
            
            if (!profile) {
                console.log(`❌ No profile found for user: ${name}`);
                return;
            }

            console.log('\n👤 USER PROFILE');
            console.log('================');
            console.log(`Name: ${profile.name}`);
            console.log(`Created: ${profile.created_at}`);
            console.log(`Updated: ${profile.updated_at}`);
            console.log(`Version: ${profile.profile_version}`);
            
            console.log('\n🎭 ROLES & PROJECTS');
            console.log('===================');
            console.log(`Roles: ${(profile.roles || []).join(', ')}`);
            console.log(`Current Projects: ${(profile.current_projects || []).join(', ')}`);
            console.log(`Learning Goals: ${(profile.learning_goals || []).join(', ')}`);
            
            console.log('\n⚙️  PREFERENCES');
            console.log('===============');
            console.log(`Tone: ${profile.tone_preference}`);
            console.log(`Neurotype: ${profile.neurotype_style}`);
            console.log(`Output Format: ${profile.default_output_format}`);
            console.log(`Verbosity: ${profile.default_verbosity}`);
            
            console.log('\n🎯 TASK PREFERENCES');
            console.log('===================');
            for (const [task, model] of Object.entries(profile.task_type_preferences || {})) {
                console.log(`${task}: ${model}`);
            }
            
            console.log('\n🔧 LOADOUTS');
            console.log('===========');
            for (const [name, config] of Object.entries(profile.loadouts || {})) {
                console.log(`${name}: ${config.model} (${config.tone || 'default'} tone)`);
            }

        } catch (error) {
            console.error('❌ Failed to show profile:', error.message);
        } finally {
            await this.dbManager.close();
        }
    }
}

// CLI interface
if (require.main === module) {
    const importer = new CharacterSheetImporter();
    const command = process.argv[2] || 'import';
    const flags = process.argv.slice(3);

    const commands = {
        'import': () => {
            const force = flags.includes('--force') || flags.includes('-f');
            return importer.import(force);
        },
        'show': () => {
            const name = flags[0] || 'Chip Talbert';
            return importer.showProfile(name);
        },
        'help': () => {
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 CHARACTER SHEET IMPORTER                     ║
║                    The Steward Database                       ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node database/import-character-sheet.js [command] [options]

COMMANDS:
  import      Import character sheet into database (default)
  show        Show current profile data
  help        Show this help message

OPTIONS:
  --force, -f    Force overwrite existing profile (import only)

EXAMPLES:
  node database/import-character-sheet.js
  node database/import-character-sheet.js import --force
  node database/import-character-sheet.js show
  node database/import-character-sheet.js show "Chip Talbert"
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

module.exports = CharacterSheetImporter;