# Stop and remove all containers
docker stop telegram-bot
docker rm telegram-bot

# Kill any node processes that might be running
pkill -f "node index.js"
pkill -f "node-telegram-bot-api"

# Check for any remaining node processes
ps aux | grep node