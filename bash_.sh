#!/bin/bash
echo "Stopping all Telegram bot instances..."

# Stop Docker containers
docker stop telegram-bot 2>/dev/null || true
docker rm telegram-bot 2>/dev/null || true

# Stop any node processes
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "node.*telegram" 2>/dev/null || true

# Wait for processes to stop
sleep 3

# Check if any instances are still running
if pgrep -f "node.*index.js" > /dev/null; then
    echo "Force killing remaining processes..."
    pkill -9 -f "node.*index.js"
fi

echo "Cleanup complete. Starting fresh instance..."

# Start fresh
docker build -t telegram-bot-app .
docker run -d -p 22222:22222 --name telegram-bot telegram-bot-app

echo "Bot started successfully!"