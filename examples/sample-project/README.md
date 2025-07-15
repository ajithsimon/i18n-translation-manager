# Sample Project for i18n Translation Manager

This is a sample project that demonstrates the i18n Translation Manager in action. It includes a comprehensive set of translation keys covering various application scenarios.

## Project Structure

```
sample-project/
├── src/
│   └── i18n/
│       └── locales/
│           ├── en.json     # English (source language)
│           ├── ar.json     # Arabic (generated example)
│           ├── zh.json     # Chinese (generated example)
│           └── ...         # Other language files (generated)
├── README.md               # This file
├── package.json            # Project configuration
├── i18n.config.json        # Translation configuration
└── quick-start.sh          # Quick start script
```

## Features Demonstrated

- **Comprehensive Translation Keys**: Over 500+ real-world translation keys
- **Nested JSON Structure**: Complex nested objects for organized translations
- **Various Content Types**: UI labels, messages, forms, tables, and more
- **Real-world Scenarios**: Data management, user interface, notifications, etc.
- **Example Translations**: Pre-generated Arabic and Chinese translations for demonstration

> **Note**: This sample project keeps generated translation files (unlike typical projects) to demonstrate the tool's output and provide immediate examples.

## Testing the Translation Manager

### 1. Start the Server
From the main project directory:
```bash
cd examples/sample-project
node ../../dist/cli.js server
```

### 2. Access the Web Interface
Open your browser to: http://localhost:3001

### 3. Test Translation Features
- **Add New Language**: Use the "Add Language" tab to translate to a new language
- **View Real-time Progress**: Watch the progress bar and live logs during translation
- **Check Translation Status**: See completion statistics and missing keys
- **Sync Translations**: Keep all languages up to date

## Translation Keys Overview

The English locale file includes translations for:

### Application Structure
- **Top Menu**: Main navigation and user controls
- **Side Menu**: Application sections and features
- **Breadcrumbs**: Navigation aids

### User Interface
- **Forms**: Input labels, validation, buttons
- **Tables**: Headers, actions, pagination
- **Modals**: Dialogs, confirmations, alerts
- **Messages**: Success, error, warning notifications

### Business Features
- **Data Management**: Models, mapping, conversion
- **Asset Management**: Upload, download, publishing
- **Policy Management**: Creation, templates, governance
- **Monitoring**: Jobs, logs, connections

### Functional Areas
- **Authentication**: Login, logout, user management
- **File Operations**: Upload, download, processing
- **Search & Filter**: Data discovery and filtering
- **Notifications**: Status updates and alerts

## Usage Examples

### CLI Commands
```bash
# Check translation status
node ../../dist/cli.js status

# Add a new language (Spanish)
node ../../dist/cli.js add-language en es

# Sync translations
node ../../dist/cli.js sync

# Add a new translation key
node ../../dist/cli.js add-key "new.feature.title" "New Feature"
```

### Web Interface
1. **Language Addition**: Select source language (English) and target language
2. **Real-time Progress**: Watch live translation progress with detailed logs
3. **Status Monitoring**: View translation completion percentages
4. **Key Management**: Add and sync translation keys

## Configuration

The project uses default configuration:
- **Locales Path**: `./src/i18n/locales`
- **Source Language**: `en` (English)
- **Translation Service**: `google-free`
- **Batch Size**: 25 translations per batch
- **Rate Limiting**: 1 second delay between batches

## Testing Scenarios

This sample project is perfect for testing:
- **Large-scale Translation**: 500+ keys to test performance
- **Real-time Progress**: Monitor translation progress in real-time
- **Error Handling**: Test various edge cases and errors
- **UI Responsiveness**: Verify web interface during long operations
- **API Endpoints**: Test all REST API functionality

## Contributing

When adding new features to the i18n Translation Manager, use this sample project to:
1. Test new functionality
2. Verify real-world scenarios
3. Document usage examples
4. Validate performance with large datasets

The sample project should remain as a comprehensive testing environment for ongoing development.
