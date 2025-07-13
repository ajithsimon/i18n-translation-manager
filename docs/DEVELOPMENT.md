# Development Guide

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/ajithsimon/i18n-translation-manager.git
   cd i18n-translation-manager
   npm install
   ```

2. **Development commands:**
   ```bash
   npm run dev          # Run CLI with auto-reload
   npm run server:dev   # Run web server with auto-reload
   npm test             # Run tests
   npm run test:watch   # Run tests in watch mode
   ```

## Project Structure

```
i18n-translation-manager/
├── bin/cli.js           # Main CLI entry point
├── lib/server.js        # Web server implementation
├── web/index.html       # Web GUI
├── index.js             # Main module exports
├── test/                # Test files
├── examples/            # Example projects for testing
└── docs/                # Documentation
```

## Development Workflow

1. **Make changes** to your code
2. **Test locally** using the examples folder
3. **Run tests** to ensure nothing breaks
4. **Test CLI commands** on sample data
5. **Test web interface** at http://localhost:3000

## Adding New Features

### 1. CLI Commands
- Edit `bin/cli.js` to add new commands
- Follow the existing pattern for argument parsing

### 2. Translation Services
- Add new translation providers in the main logic
- Test with different APIs

### 3. File Format Support
- Extend file reading/writing capabilities
- Add support for YAML, XML, etc.

### 4. Web Interface
- Modify `web/index.html` for UI changes
- Update `lib/server.js` for new API endpoints

## Testing

Run your changes against the sample project:

```bash
cd examples/sample-project
node ../../bin/cli.js sync
node ../../bin/cli.js server 3001
```

## Debugging

Use Node.js debugging:
```bash
node --inspect bin/cli.js [command]
```

Then connect with Chrome DevTools or VS Code debugger.
