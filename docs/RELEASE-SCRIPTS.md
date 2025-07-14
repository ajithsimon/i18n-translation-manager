# Release & Pipeline Scripts

This document explains the npm scripts available for managing releases and CI/CD workflows.

## 🚀 Quick Release Commands

### Automatic Version Bump & Pipeline Trigger
```bash
# Patch release (2.0.0 → 2.0.1) - for bug fixes
npm run release:patch

# Minor release (2.0.0 → 2.1.0) - for new features
npm run release:minor

# Major release (2.0.0 → 3.0.0) - for breaking changes
npm run release:major
```

**What happens:**
1. Updates version in `package.json`
2. Creates git tag
3. Pushes to GitHub
4. Triggers automated CI/CD pipeline
5. Publishes to npm (if tests pass)

### Custom Version
```bash
# Set specific version
npm run release:custom 2.1.5
```

## 🧪 Testing & Validation

### Local CI Checks
```bash
# Run the same checks as CI pipeline locally
npm run ci:local
```
**Runs:** Tests → Linting → Build → Package validation

### Publish Validation
```bash
# Test what would be published (without actually publishing)
npm run publish:check
```
**Shows:** Package contents, size, files included

### Individual Pipeline Steps
```bash
npm run pipeline:test   # Tests + linting
npm run pipeline:build  # Build + package validation
npm run pipeline:check  # Full pipeline check
```

## 📦 Manual Publishing

### Safe Manual Publish
```bash
# Run all checks then publish manually
npm run publish:manual
```
**Use when:** You need to publish outside of the automated pipeline

### Direct Publish (Not Recommended)
```bash
# Direct publish (skips some safety checks)
npm publish
```

## 🔧 Development Scripts

### Development Server
```bash
npm run dev         # CLI with auto-reload
npm run server:dev  # Web server with auto-reload
npm start           # Regular CLI
npm run server      # Regular web server
```

### Testing
```bash
npm test            # Run tests once
npm run test:watch  # Run tests in watch mode
```

## 📋 Available Scripts Summary

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `release:patch` | Bug fixes (2.0.0 → 2.0.1) | Fix bugs, small improvements |
| `release:minor` | New features (2.0.0 → 2.1.0) | Add features, maintain compatibility |
| `release:major` | Breaking changes (2.0.0 → 3.0.0) | API changes, major updates |
| `ci:local` | Run local CI checks | Before pushing changes |
| `publish:check` | Validate package | Check what will be published |
| `publish:manual` | Manual safe publish | Emergency releases |
| `release:help` | Show help | Learn available commands |

## 🔄 Recommended Workflow

### For Regular Development:
```bash
# 1. Make changes to your code
# 2. Test locally
npm run ci:local

# 3. Check what will be published
npm run publish:check

# 4. Release (choose appropriate version bump)
npm run release:patch  # or minor/major
```

### For Quick Bug Fixes:
```bash
# 1. Fix the bug
# 2. Quick local test
npm test

# 3. Patch release
npm run release:patch
```

### For Major Releases:
```bash
# 1. Complete feature development
# 2. Full local validation
npm run ci:local

# 3. Check package contents
npm run publish:check

# 4. Major release
npm run release:major
```

## 🛡️ Safety Features

- **All scripts run tests first** - Prevents broken releases
- **Dry-run validation** - See what happens without risk
- **Local CI simulation** - Catch issues before GitHub
- **Version bump automation** - Consistent versioning
- **Git tag creation** - Proper release tracking

## 🚨 Troubleshooting

### "npm ERR! Git working directory not clean"
```bash
git add .
git commit -m "your changes"
# Then run release script
```

### "Tests failed"
```bash
npm test  # See specific test failures
# Fix issues, then retry
```

### "Version already exists"
- The automated pipeline prevents duplicate versions
- Choose a different version bump level
- Or wait for the previous release to complete

## 🎯 Best Practices

1. **Always run `npm run ci:local`** before releasing
2. **Use semantic versioning** (patch/minor/major)
3. **Test in development environment** first
4. **Check `npm run publish:check`** to verify package contents
5. **Let the automated pipeline handle publishing** when possible

## 📞 Help

```bash
# Show available release commands
npm run release:help

# Show all available scripts
npm run
```
