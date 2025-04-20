#!/bin/bash

# Setup PHP bot files
touch users.json admins.json
chmod 666 users.json admins.json

# Setup Python requirements
pip install requests python-dotenv

# Create environment file
echo "BOT_TOKEN=6990761692:AAFoy2zj2Q-jnt_SD9LIimjSXBh7jXyrW3M" > .env

# Run Python broadcast script (after configuration)
echo "Please edit .env with your actual bot token and CHAT_IDS in broadcast.py before running"
python broadcast.py
