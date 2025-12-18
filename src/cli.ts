#!/usr/bin/env node

import { createCLI } from '@migration-script-runner/core';
import { FirebaseRunner } from './FirebaseRunner';
import { FirebaseHandler } from './service/FirebaseHandler';
import { AppConfig } from './model/AppConfig';
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
const program = createCLI<IFirebaseDB, FirebaseRunner>({
    name: 'msr-firebase',
    description: 'Firebase Realtime Database Migration Runner',
    version,

    // Default configuration for Firebase
    config: {
        folder: './migrations',
        tableName: 'schema_version',
    },

    // Factory function to create adapter with merged config
    createExecutor: (config) => {
        // Initialize Firebase handler and adapter
        // Note: createCLI expects synchronous factory, but Firebase requires async connection
        // The CLI framework will handle the promise resolution automatically
        const appConfig = new AppConfig();
        Object.assign(appConfig, config);

        return (async () => {
            const handler = await FirebaseHandler.getInstance(appConfig);
            return new FirebaseRunner({ handler, config });
        })() as unknown as FirebaseRunner;
    },

    // Add Firebase-specific custom commands
    extendCLI: (program, createExecutor) => {
        program
            .command('firebase:info')
            .description('Show Firebase connection information')
            .action(async () => {
                try {
                    const runnerPromise = createExecutor() as unknown as Promise<FirebaseRunner>;
                    const runner = await runnerPromise;
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
                    const runnerPromise = createExecutor() as unknown as Promise<FirebaseRunner>;
                    const runner = await runnerPromise;
                    const firebaseDb = runner['getHandler']().db;
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
    },
});

// Parse command-line arguments
program.parse(process.argv);
