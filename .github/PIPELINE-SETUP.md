# CI/CD Pipeline Setup

## 🚀 Automated Publishing Pipeline

This repository includes GitHub Actions workflows for automated testing and publishing.

## 📋 Setup Requirements

### 1. NPM Token Setup
To enable automatic publishing to npm, you need to set up an NPM token:

1. **Generate NPM Token:**
   - Go to [npmjs.com](https://www.npmjs.com) → Account → Access Tokens
   - Click "Generate New Token" → Choose "Automation" type
   - Copy the generated token

2. **Add to GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token

### 2. GitHub Token (Automatic)
The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## 🔄 How the Pipeline Works

### Automatic Pipeline (Main Branch)
- **Triggers:** Push to `main` branch
- **Steps:**
  1. Run tests on Node.js 18, 20, and 22
  2. Check if package version changed
  3. If version is new → Publish to npm
  4. Create GitHub release with changelog

### Manual Release Pipeline
- **Triggers:** Manual workflow dispatch
- **Use case:** When you want to control the exact version
- **Steps:**
  1. Update package version
  2. Run tests
  3. Publish to npm
  4. Create GitHub release

### Dependabot Updates
- **Automatic dependency updates** every week
- **Security patches** as needed

## 📦 Publishing Workflow

### Option 1: Automatic (Recommended)
1. Update your code
2. Bump version in `package.json`:
   ```bash
   npm version patch  # 2.0.0 → 2.0.1
   npm version minor  # 2.0.0 → 2.1.0
   npm version major  # 2.0.0 → 3.0.0
   ```
3. Push to main:
   ```bash
   git push && git push --tags
   ```
4. Pipeline automatically publishes if version is new

### Option 2: Manual Release
1. Go to GitHub → Actions → "Manual Release"
2. Click "Run workflow"
3. Enter version number and release notes
4. Pipeline handles everything

## 🛡️ Safety Features

- **Tests must pass** before publishing
- **Version collision protection** - won't republish existing versions
- **Multi-Node testing** ensures compatibility
- **Dry-run testing** validates package creation

## 📊 Status Badges

Add these to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/ajithsimon/i18n-translation-manager/workflows/CI/CD%20Pipeline/badge.svg)
![npm version](https://badge.fury.io/js/i18n-translation-manager.svg)
![Node.js Version](https://img.shields.io/node/v/i18n-translation-manager.svg)
```
