# Changelog

Notable changes to MSR Firebase are recorded here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [1.0.0]

### Added

- Selective automatic migration backups through `FirebaseConfig.backupPaths` and the `--backup-paths` CLI option. Omitting the option keeps full-database backups ([#87](https://github.com/migration-script-runner/msr-firebase/issues/87)).
- Core configuration loading before Firebase handler creation when `FirebaseRunner.getInstance()` receives no explicit `config` ([#95](https://github.com/migration-script-runner/msr-firebase/issues/95)).

### Changed

- Migrated the adapter to the MSR Core v1 runner API. Core integrations use `MigrationScriptRunner`, `IRunnerOptions`, and `IRunnerDependencies`; custom CLI adapters use `createRunner` ([#75](https://github.com/migration-script-runner/msr-firebase/issues/75)).
- Lock records now store `runnerId` instead of `executorId`. Runner ID parsing also preserves hostnames containing hyphens ([#75](https://github.com/migration-script-runner/msr-firebase/issues/75)).
- Set the supported Node.js version to `>=22.13.0` and refreshed the runtime and development toolchain ([#76](https://github.com/migration-script-runner/msr-firebase/issues/76), [#102](https://github.com/migration-script-runner/msr-firebase/issues/102)).
- Made `IEntity.key` optional, so entities without a Firebase key no longer need `key: undefined` ([#80](https://github.com/migration-script-runner/msr-firebase/issues/80)).
- Removed unused dependencies and replaced the remaining Lodash usage with native JavaScript ([#69](https://github.com/migration-script-runner/msr-firebase/issues/69)).

### Fixed

- Corrected database-root and shifted-path handling, and aligned entity deletion and nullable read types with Firebase Realtime Database behavior ([#84](https://github.com/migration-script-runner/msr-firebase/issues/84)).

## [0.2.0] - 2025-12-21

### Added

- Added distributed migration locking with atomic Firebase transactions and CLI commands to inspect or force-release locks ([#18](https://github.com/migration-script-runner/msr-firebase/issues/18), [#61](https://github.com/migration-script-runner/msr-firebase/issues/61), [#63](https://github.com/migration-script-runner/msr-firebase/issues/63), [#64](https://github.com/migration-script-runner/msr-firebase/issues/64)).
- Added a typed `FirebaseRunner` API and `getInstance()` factory, and integrated MSR Core v0.8.4 ([#19](https://github.com/migration-script-runner/msr-firebase/issues/19), [#62](https://github.com/migration-script-runner/msr-firebase/issues/62), [#68](https://github.com/migration-script-runner/msr-firebase/issues/68)).
- Added the `--backup-mode` CLI option and a Jekyll documentation site with a v0.1.x migration guide ([#20](https://github.com/migration-script-runner/msr-firebase/issues/20), [#22](https://github.com/migration-script-runner/msr-firebase/issues/22)).

### Changed

- **Breaking:** Renamed the npm package from `msr-firebase` to `@migration-script-runner/firebase`; update the dependency and import paths.
- Improved emulator CI, concurrent-locking coverage, and release checks ([#21](https://github.com/migration-script-runner/msr-firebase/issues/21)).

## [0.1.6] - 2023-12-10

### Added

- Added Firebase data and entity services, completed the migration handler, and reused a single database connection across services ([#10](https://github.com/migration-script-runner/msr-firebase/issues/10), [#11](https://github.com/migration-script-runner/msr-firebase/issues/11), [#12](https://github.com/migration-script-runner/msr-firebase/issues/12)).
- Added compatibility with `migration-script-runner` v0.1.11 and database cleanup support for tests ([#11](https://github.com/migration-script-runner/msr-firebase/issues/11), [#12](https://github.com/migration-script-runner/msr-firebase/issues/12)).

## [0.1.5] - 2023-12-03

### Changed

- Centralized Firebase test credentials and setup in `scripts/ci.sh` for the CircleCI, Travis CI, and GitHub Actions workflows ([#2](https://github.com/migration-script-runner/msr-firebase/issues/2)).

## [0.1.4] - 2023-12-03

### Added

- Added Firebase database connection setup using the service-account key and database URL, including environment-based configuration for CI ([#2](https://github.com/migration-script-runner/msr-firebase/issues/2), [#3](https://github.com/migration-script-runner/msr-firebase/issues/3)).

### Changed

- Updated database connection tests to use asynchronous setup and improved the CI environment configuration ([#2](https://github.com/migration-script-runner/msr-firebase/issues/2), [#3](https://github.com/migration-script-runner/msr-firebase/issues/3)).

## [0.1.1] - 2023-11-22

### Added

- Published the initial `msr-firebase` package with the first Firebase migration-handler adapter scaffold and its basic test and CI setup.

[1.0.0]: https://github.com/migration-script-runner/msr-firebase/compare/v0.2.0...master
[0.2.0]: https://github.com/migration-script-runner/msr-firebase/releases/tag/v0.2.0
[0.1.6]: https://github.com/migration-script-runner/msr-firebase/releases/tag/v0.1.6
[0.1.5]: https://github.com/migration-script-runner/msr-firebase/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/migration-script-runner/msr-firebase/compare/v0.1.1...v0.1.4
[0.1.1]: https://github.com/migration-script-runner/msr-firebase/tree/v0.1.1
