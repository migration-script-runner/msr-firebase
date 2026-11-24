#!/usr/bin/env node

import { createCLI } from '@migration-script-runner/core';
import { FirebaseRunner } from './FirebaseRunner';
import { FirebaseConfig } from './model/FirebaseConfig';
import { IFirebaseDB } from './interface';
import { version } from '../package.json';

/**
 * Firebase Realtime Database CLI for Migration Script Runner.
 *
 * Provides command-line interface for managing Firebase database migrations with full
 * support for built-in commands (migrate, list, down, validate, backup) and
 * Firebase-specific custom commands.
 *
 * @example
 * ```bash
 * # Run all pending migrations
 * msr-firebase migrate
 *
 * # Show Firebase connection info
 * msr-firebase firebase:info
 *
 * # List migrations
 * msr-firebase list --format table
 * ```
 */
function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

const program = createCLI<IFirebaseDB, FirebaseRunner, FirebaseConfig>({
    name: 'msr-firebase',
    description: 'Firebase Realtime Database Migration Runner',
    version,

    // Default configuration for Firebase
    config: {
        folder: './migrations',
        tableName: 'schema_version',
    },

    // Register Firebase-specific CLI options
    addCustomOptions: (program) => {
        program
            .option('--database-url <url>', 'Firebase Realtime Database URL')
            .option('--credentials <path>', 'Path to service account key file')
            .option('--backup-paths <path...>', 'Relative database paths to include in automatic backups');
    },

    // Map custom CLI flags to config properties
    extendFlags: (config, flags) => {
        // config is now properly typed as FirebaseConfig thanks to TConfig generic
        if (flags.databaseUrl && typeof flags.databaseUrl === 'string') {
            config.databaseUrl = flags.databaseUrl;
        }
        if (flags.credentials && typeof flags.credentials === 'string') {
            config.applicationCredentials = flags.credentials;
        }
        if (flags.backupPaths !== undefined) {
            if (!isStringArray(flags.backupPaths)) {
                throw new TypeError('--backup-paths requires one or more relative database paths');
            }
            config.backupPaths = flags.backupPaths;
        }
    },

    // Factory function to create adapter with merged config
    createRunner: async (config, cliOptions) => {
        // Initialize Firebase runner with merged configuration
        const appConfig = new FirebaseConfig();
        Object.assign(appConfig, config);

        return FirebaseRunner.getInstance({ config: appConfig, ...cliOptions });
    },

    // Add Firebase-specific custom commands
    extendCLI: (program, createRunner) => {
        program
            .command('firebase:info')
            .description('Show Firebase connection information')
            .action(async () => {
                try {
                    const runner = await createRunner();
                    const info = runner.getConnectionInfo();

                    console.log('\n📊 Firebase Connection Information:\n');
                    console.log(`  Database URL: ${info.databaseUrl || 'Not set (using emulator?)'}`);
                    console.log(`  Shift Path:   ${info.shift || '/'}`);
                    console.log(`  Table Name:   ${info.tableName}`);
                    console.log('');

                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error:', error instanceof Error ? error.message : error);
                    process.exit(7); // Database connection error
                }
            });

        program
            .command('firebase:test-connection')
            .description('Test Firebase database connection')
            .action(async () => {
                try {
                    const runner = await createRunner();
                    const firebaseDb = runner.getHandler().db;
                    const isConnected = await firebaseDb.checkConnection();

                    if (isConnected) {
                        console.log('✅ Firebase connection successful!');
                        const info = runner.getConnectionInfo();
                        console.log(`   Connected to: ${info.databaseUrl || 'localhost (emulator)'}`);
                        process.exit(0);
                    } else {
                        console.error('❌ Firebase connection failed');
                        process.exit(7);
                    }
                } catch (error) {
                    console.error('❌ Error testing connection:', error instanceof Error ? error.message : error);
                    process.exit(7);
                }
            });

        program
            .command('firebase:nodes')
            .description('List all root nodes in Firebase database')
            .action(async () => {
                try {
                    const runner = await createRunner();
                    const nodes = await runner.listNodes();

                    if (nodes.length === 0) {
                        console.log('📭 No nodes found in database');
                        process.exit(0);
                    }

                    console.log('\n📂 Root Nodes:\n');
                    nodes.forEach((node, index) => {
                        console.log(`  ${index + 1}. ${node}`);
                    });
                    console.log(`\n  Total: ${nodes.length} node${nodes.length === 1 ? '' : 's'}\n`);

                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error listing nodes:', error instanceof Error ? error.message : error);
                    process.exit(7);
                }
            });

        program
            .command('firebase:backup-nodes')
            .description('Backup specific Firebase nodes')
            .argument('<nodes...>', 'Node paths to backup (e.g., users posts)')
            .action(async (nodes: string[]) => {
                try {
                    const runner = await createRunner();
                    const backup = await runner.backupNodes(nodes);

                    console.log('\n💾 Node Backup:\n');
                    for (const [node, data] of Object.entries(backup)) {
                        if (data === null) {
                            console.log(`  ⚠️  ${node}: (not found)`);
                        } else {
                            const size = JSON.stringify(data).length;
                            console.log(`  ✅ ${node}: ${size} bytes`);
                        }
                    }

                    console.log('\n📄 Backup Data:\n');
                    console.log(JSON.stringify(backup, null, 2));
                    console.log('');

                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error backing up nodes:', error instanceof Error ? error.message : error);
                    process.exit(7);
                }
            });
    },
});

// Parse command-line arguments
program.parse(process.argv);
