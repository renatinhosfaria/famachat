#!/bin/bash

# Quick test script to verify Docker build works
set -e

echo "Testing Docker build..."

# Build only the famachat service to test
docker-compose -f docker-compose.production.yml build famachat

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for deployment."
    echo ""
    echo "To deploy:"
    echo "./deploy.sh www.famachat.com.br"
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi