---
layout: default
title: Version Migration
nav_order: 8
has_children: true
---

# Version Migration

This section contains guides for upgrading between major versions of Firebase Migration Script Runner. Each guide includes detailed instructions, breaking changes, and examples to help you migrate smoothly.

## Current Upgrade Guide

- [**v0.1.x → v0.2.0**](v0.1-to-v0.2.md) - **Breaking:** Package rename from `msr-firebase` to `@migration-script-runner/firebase`, MSR Core v0.8.0 upgrade, migration locking support

## Migration Policy

### When We Create Migration Guides

We create migration guides for:
- **Major version changes** (e.g., v1 to v2) - Always includes migration guide
- **Breaking changes** in minor versions (e.g., v0.1 to v0.2) - Includes migration guide
- **Package renames** or structural changes - Includes migration guide
- **MSR Core major upgrades** - Includes migration guide if breaking changes affect Firebase implementation

### What's In a Migration Guide

Each guide includes:
- ✅ Summary of changes
- ✅ Breaking changes list
- ✅ Step-by-step migration instructions
- ✅ Before/after code examples
- ✅ Troubleshooting tips
- ✅ Verification checklist

## Semantic Versioning

Firebase Migration Script Runner follows [Semantic Versioning](https://semver.org/):

- **MAJOR version** (x.0.0) - Incompatible API changes
- **MINOR version** (0.x.0) - New features, may include breaking changes during 0.x phase
- **PATCH version** (0.0.x) - Bug fixes, backward compatible

During the 0.x phase (pre-1.0), minor versions may contain breaking changes. We provide migration guides for all breaking changes.

## Getting Help

If you encounter issues during migration:

1. **Check the migration guide** for your version
2. **Review troubleshooting sections** in the guide
3. **Search existing issues**: [GitHub Issues](https://github.com/migration-script-runner/msr-firebase/issues)
4. **Open a new issue** with the `migration` label if you're still stuck

## Staying Up to Date

To stay informed about new releases:

- Watch the [GitHub repository](https://github.com/migration-script-runner/msr-firebase)
- Check the [CHANGELOG](../../CHANGELOG.md) for detailed release notes
- Follow migration guides sequentially if skipping versions
