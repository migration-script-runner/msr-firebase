# MSR: Firebase Documentation

This directory contains the Jekyll-based documentation site for MSR: Firebase, hosted on GitHub Pages.

## Local Development

### Prerequisites

- Ruby 3.1 or higher
- Bundler

### Quick Start with npm Scripts

From the project root:

```bash
# Install Jekyll dependencies (one-time setup)
npm run docs:install

# Run Jekyll server locally
npm run docs:serve

# Build docs (output to docs/_site/)
npm run docs:build
```

The site will be available at `http://localhost:4000/msr-firebase/`

### Manual Commands (without npm)

```bash
# Setup
cd docs
bundle install

# Run locally
bundle exec jekyll serve

# Build only
bundle exec jekyll build
```

The built site will be in `docs/_site/`

## Structure

```
docs/
├── _config.yml                  # Jekyll configuration
├── Gemfile                      # Ruby dependencies
├── .gitignore                   # Ignore Jekyll build files
├── index.md                     # Home page (nav_order: 1)
├── getting-started.md           # Getting Started (nav_order: 2)
├── cli-usage/                   # CLI Usage (nav_order: 3, has_children: true)
│   ├── index.md
│   ├── commands.md
│   ├── configuration.md
│   ├── examples.md
│   └── ci-cd.md
├── library-usage/               # Library Usage (nav_order: 4, has_children: true)
│   ├── index.md
│   ├── quick-start.md
│   ├── configuration.md
│   └── examples.md
├── api/                         # API Reference (nav_order: 5, has_children: true)
│   ├── index.md
│   ├── FirebaseRunner.md
│   ├── FirebaseConfig.md
│   ├── interfaces.md
│   ├── services.md
│   └── types.md
├── writing-migrations/          # Writing Migrations (nav_order: 6, has_children: true)
│   ├── index.md
│   ├── migration-scripts.md
│   ├── transactions.md
│   ├── backup-restore.md
│   ├── testing.md
│   ├── migration-locking.md
│   └── best-practices.md
├── version-migration/           # Version Migration (nav_order: 7, has_children: true)
│   ├── index.md
│   └── v0.1-to-v0.2.md
└── assets/
    └── css/
        └── custom.css (optional)
```

## Frontmatter Templates

### Root Level Pages
```yaml
---
layout: default
title: Page Title
nav_order: 1
---
```

### Parent Pages (with children)
```yaml
---
layout: default
title: Parent Title
nav_order: 2
has_children: true
---
```

### Child Pages
```yaml
---
layout: default
title: Child Title
parent: Parent Title
nav_order: 1
---
```

### Grandchild Pages
```yaml
---
layout: default
title: Grandchild Title
parent: Child Title
grand_parent: Parent Title
nav_order: 1
---
```

## Deployment

Documentation is automatically deployed to GitHub Pages when changes are pushed to the `master` branch via GitHub Actions workflow (`.github/workflows/jekyll.yml`).

**Live Site**: https://migration-script-runner.github.io/msr-firebase/

## Theme

Uses [Just the Docs](https://just-the-docs.github.io/just-the-docs/) theme for consistent styling with MSR Core documentation.

## Documentation Organization

The documentation is organized by **user intent**:

1. **Getting Started** - Installation and quick start for new users
2. **CLI Usage** - Complete command-line interface documentation
3. **Library Usage** - Programmatic API usage and integration
4. **API Reference** - Detailed API documentation
5. **Writing Migrations** - Guides for writing and managing migrations
6. **Version Migration** - Upgrade guides between versions

### Focus on Firebase-Specific Content

Each page documents **only Firebase-specific features**:
- Firebase-specific CLI flags (`--database-url`, `--credentials`, `--backup-mode`)
- Firebase-specific commands (`firebase:info`, `firebase:test-connection`, `firebase:nodes`)
- Firebase limitations (transaction limitations, single-node atomicity)
- Links to [MSR Core docs](https://migration-script-runner.github.io/msr-core) for inherited functionality

## Contributing

When adding new documentation:

1. **Choose the right section** based on user intent (CLI vs Library vs Writing Migrations)
2. Create markdown file in appropriate directory
3. Add proper frontmatter with `layout`, `title`, `nav_order`, and parent information
4. **Focus on Firebase-specific features only** - link to MSR Core for inherited features
5. Use GitHub Flavored Markdown
6. Test locally before pushing
7. Ensure navigation order is logical
