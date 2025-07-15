# Release Checklist

## Pre-Release Documentation Updates

### 1. CHANGELOG.md
- [ ] Add new version entry with current date
- [ ] Document all changes in appropriate categories:
  - **Added** - for new features
  - **Changed** - for changes in existing functionality  
  - **Deprecated** - for soon-to-be removed features
  - **Removed** - for now removed features
  - **Fixed** - for any bug fixes
  - **Security** - in case of vulnerabilities
- [ ] Keep entries concise and technical
- [ ] Follow semantic versioning format `[X.Y.Z] - YYYY-MM-DD`

### 2. RELEASE-NOTES.md
- [ ] Add detailed release section with migration guides
- [ ] Include feature explanations and user benefits
- [ ] Add breaking changes and migration instructions
- [ ] Include performance metrics if applicable
- [ ] Add usage examples for new features

### 3. README.md
- [ ] Update version numbers in installation examples
- [ ] Update feature list if new major features added
- [ ] Verify all links are working
- [ ] Update compatibility matrix if needed
- [ ] Refresh examples if API changes occurred

### 4. package.json
- [ ] Bump version number following semantic versioning
- [ ] Update dependencies if needed
- [ ] Verify build scripts are current

## Release Process

### 1. Version Bumping
```bash
# For patch release (bug fixes)
npm run release:patch

# For minor release (new features)
npm run release:minor

# For major release (breaking changes)  
npm run release:major
```

### 2. Pre-Release Validation
- [ ] Run `npm run ci:local` to validate build
- [ ] Run `npm run publish:check` to test package
- [ ] Verify all documentation is updated
- [ ] Test new features manually
- [ ] Check TypeScript compilation

### 3. Git Operations
- [ ] Commit all documentation changes
- [ ] Create git tag with version number
- [ ] Push changes and tags to repository

### 4. NPM Publishing
- [ ] Run `npm run publish:manual` for production release
- [ ] Verify package is published correctly
- [ ] Test installation from npm

## Post-Release Tasks

### 1. GitHub Release
- [ ] Create GitHub release with tag
- [ ] Copy release notes from RELEASE-NOTES.md
- [ ] Attach any necessary artifacts

### 2. Documentation Verification
- [ ] Verify README displays correctly on npm
- [ ] Check GitHub repository documentation
- [ ] Validate all links in documentation

### 3. Communication
- [ ] Update any relevant project documentation
- [ ] Notify users of major changes if applicable
- [ ] Update project wikis or external documentation

## Documentation Standards

### CHANGELOG.md Guidelines
- Use standard changelog format
- Keep entries concise and technical
- Group by semantic versioning categories
- Reference RELEASE-NOTES.md for details

### RELEASE-NOTES.md Guidelines
- Provide detailed feature explanations
- Include migration guides for breaking changes
- Add performance improvements with metrics
- Include code examples for new features

### README.md Guidelines
- Keep general and version-agnostic
- Focus on getting started quickly
- Include comprehensive feature overview
- Maintain working examples and links

## Version Strategy

### Semantic Versioning
- **PATCH (x.y.Z)**: Bug fixes, performance improvements
- **MINOR (x.Y.z)**: New features, backward compatible
- **MAJOR (X.y.z)**: Breaking changes, major rewrites

### Documentation Update Frequency
- **Every Release**: CHANGELOG.md, RELEASE-NOTES.md
- **Major/Minor Releases**: README.md, API documentation
- **Major Releases**: Migration guides, compatibility matrices
