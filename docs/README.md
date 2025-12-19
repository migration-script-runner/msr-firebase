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
├── _config.yml              # Jekyll configuration
├── Gemfile                  # Ruby dependencies
├── .gitignore              # Ignore Jekyll build files
├── index.md                # Home page (nav_order: 1)
├── getting-started.md      # (nav_order: 2)
├── installation.md         # (nav_order: 3)
├── api/                    # (nav_order: 4, has_children: true)
│   ├── index.md
│   ├── FirebaseHandler.md
│   ├── FirebaseRunner.md
│   └── ...
├── guides/                 # (nav_order: 5, has_children: true)
│   ├── index.md
│   ├── writing-migrations.md
│   └── ...
├── examples/               # (nav_order: 6, has_children: true)
│   ├── index.md
│   └── ...
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

## Contributing

When adding new documentation:

1. Create markdown file in appropriate directory
2. Add proper frontmatter with `layout`, `title`, `nav_order`, and parent information
3. Use GitHub Flavored Markdown
4. Test locally before pushing
5. Ensure navigation order is logical
