#!/bin/bash

# Quick start script for the i18n Translation Manager sample project
# This script sets up and starts the sample project for testing

echo "🌍 i18n Translation Manager - Sample Project Quick Start"
echo "======================================================="

# Check if we're in the right directory
if [ ! -f "../../package.json" ]; then
    echo "❌ Error: Please run this script from examples/sample-project directory"
    echo "   cd examples/sample-project && ./quick-start.sh"
    exit 1
fi

# Check if the main project is built
if [ ! -d "../../dist" ]; then
    echo "📦 Building main project..."
    cd ../..
    npm run build
    cd examples/sample-project
fi

echo ""
echo "🚀 Starting i18n Translation Manager Sample Project..."
echo ""
echo "✅ Features available:"
echo "   • 500+ realistic translation keys"
echo "   • Real-time progress tracking"
echo "   • Web interface for translation management"
echo "   • Multiple language support"
echo ""
echo "🌐 Web Interface will be available at: http://localhost:3001"
echo "📊 Try adding a new language to see real-time translation progress!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node ../../dist/cli.js server
