# MSR: Firebase Documentation

This directory contains the Jekyll-based documentation site for MSR: Firebase, hosted on GitHub Pages.

## Local Development

### Prerequisites

- Ruby 2.6 or higher
- Bundler 1.17.2 or a compatible newer version

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

The site will be available at `http://localhost:4000/`. The configured `baseurl` is empty.

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
├── CNAME                        # Custom Pages domain
├── Gemfile                      # Ruby dependencies
├── .gitignore                   # Ignore Jekyll build files
├── index.md                     # Home page (nav_order: 1)
├── getting-started.md           # Getting Started (nav_order: 2)
├── features.md                  # Features (nav_order: 3)
├── cli-usage/                   # CLI Usage (nav_order: 4, has_children: true)
│   ├── index.md
│   ├── commands.md
│   ├── configuration.md
│   ├── examples.md
│   └── ci-cd.md
├── library-usage/               # Library Usage (nav_order: 5, has_children: true)
│   ├── index.md
│   ├── quick-start.md
│   ├── configuration.md
│   └── examples.md
├── api/                         # API Reference (nav_order: 6, has_children: true)
│   ├── index.md
│   ├── FirebaseRunner.md
│   ├── FirebaseConfig.md
│   ├── interfaces.md
│   ├── services.md
│   └── types.md
├── writing-migrations/          # Writing Migrations (nav_order: 7, has_children: true)
│   ├── index.md
│   ├── migration-scripts.md
│   ├── transactions.md
│   ├── backup-restore.md
│   ├── backup-storage.md
│   ├── testing.md
│   ├── migration-locking.md
│   ├── best-practices.md
│   ├── using-entityservice.md
│   └── entityservice-examples.md
├── version-migration/           # Version Migration (nav_order: 8, has_children: true)
│   ├── index.md
│   ├── v0.2-to-v1.0.md           # v1.0.0 migration guide
│   └── v0.1-to-v0.2.md           # Historical migration guide
├── _includes/                   # Custom Just the Docs includes
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

The site uses the custom domain configured in [`CNAME`](CNAME) and [`_config.yml`](_config.yml): <https://firebase.migration-script-runner.dev/>. The [`docs.yml` workflow](../.github/workflows/docs.yml) builds the Jekyll site and checks internal links on pushes and pull requests to `master`, `develop`, and `release/*`; it is a validation workflow, not the Pages deployment mechanism.

For local development, the empty `baseurl` in `_config.yml` means the site is served at the root path (`http://localhost:4000/`).

## Theme

Uses [Just the Docs](https://just-the-docs.github.io/just-the-docs/) theme for consistent styling with MSR Core documentation.

## Documentation Organization

The documentation is organized by **user intent**:

1. **Getting Started** - Installation and quick start for new users
2. **Features** - Overview of Firebase-specific capabilities
3. **CLI Usage** - Complete command-line interface documentation
4. **Library Usage** - Programmatic API usage and integration
5. **API Reference** - Detailed API documentation
6. **Writing Migrations** - Guides for writing and managing migrations
7. **Version Migration** - Upgrade guides between versions

### Focus on Firebase-Specific Content

Each page documents **only Firebase-specific features**:
- Firebase-specific CLI flags (`--database-url`, `--credentials`, `--backup-mode`)
- Firebase-specific commands (`firebase:info`, `firebase:test-connection`, `firebase:nodes`)
- Firebase limitations (transaction limitations, single-node atomicity)
- Links to [MSR Core docs](https://core.migration-script-runner.dev) for inherited functionality

## Contributing

When adding new documentation:

1. **Choose the right section** based on user intent (CLI vs Library vs Writing Migrations)
2. Create markdown file in appropriate directory
3. Add proper frontmatter with `layout`, `title`, `nav_order`, and parent information
4. **Focus on Firebase-specific features only** - link to MSR Core for inherited features
5. Use GitHub Flavored Markdown
6. Test locally before pushing
7. Ensure navigation order is logical
