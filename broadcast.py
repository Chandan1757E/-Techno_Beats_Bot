import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BOT_TOKEN = os.getenv('BOT_TOKEN', '6990761692:AAFoy2zj2Q-jnt_SD9LIimjSXBh7jXyrW3M')
CHAT_IDS = [
    '@your_channel_username',   # Channel username
    '-1001234567890',           # Group ID
    '-100ABCDEFGHIJ'            # Channel ID
]

def send_message(chat_id, text, parse_mode='Markdown'):
    """Send message to a Telegram chat"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Error sending to {chat_id}: {str(e)}")
        return False

def broadcast(text):
    """Broadcast message to all configured chats"""
    success_count = 0
    for chat_id in CHAT_IDS:
        if send_message(chat_id, text):
            success_count += 1
        time.sleep(0.5)  # Prevent rate limiting
    
    print(f"Broadcast completed. Success: {success_count}/{len(CHAT_IDS)}")

def send_media(chat_id, file_path, caption='', media_type='photo'):
    """Send media file to a chat"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/send{media_type.capitalize()}"
    
    with open(file_path, 'rb') as file:
        files = {media_type: file}
        data = {'chat_id': chat_id, 'caption': caption}
        
        try:
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Media error ({chat_id}): {str(e)}")
            return False

if __name__ == "__main__":
    # Example text broadcast
    message = """
    *🔔 Important Update*
    
    New features added:
    - Automated approvals
    - User management
    - Broadcast system
    
    Visit our channel: @your_channel
    """
    
    broadcast(message)
    
    # Example media broadcast (uncomment to use)
    # for chat_id in CHAT_IDS:
    #     send_media(chat_id, 'announcement.jpg', 'New Feature Screenshot')
