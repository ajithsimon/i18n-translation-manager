#!/bin/bash
# Helper script for committing TypeScript changes

echo "🔨 Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful, staging files..."
    git add .
    echo "📝 Ready to commit. Run: git commit -m 'your message'"
else
    echo "❌ Build failed. Please fix TypeScript errors first."
    exit 1
fi
