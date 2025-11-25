# Stop all Docker containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Kill any node processes
pkill -f node || true

# Wait a few seconds
sleep 5

# Build and start fresh
docker build -t telegram-bot-app .
docker run -d -p 22222:22222 --name telegram-bot telegram-bot-app

# Check logs
docker logs -f telegram-bot