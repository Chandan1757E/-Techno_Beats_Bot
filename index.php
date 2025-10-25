<?php
// Security headers
header("Strict-Transport-Security: max-age=31536000");
header("Content-Security-Policy: default-src 'self'");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

$botToken = '8280138743:AAH2Ay6agC-SksUkfgc3yocjJYnDM09O_60';
$apiUrl = "https://api.telegram.org/bot{$botToken}/";

// File paths
$usersFile = __DIR__ . '/users.json';
$adminsFile = __DIR__ . '/admins.json';

// Initialize data files
if (!file_exists($usersFile)) file_put_contents($usersFile, '[]');
if (!file_exists($adminsFile)) file_put_contents($adminsFile, '[1614927658]');

// Load data
$users = json_decode(file_get_contents($usersFile), true) ?: [];
$admins = json_decode(file_get_contents($adminsFile), true) ?: [1614927658];

$content = file_get_contents("php://input");
$update = json_decode($content, true);

function botRequest($method, $params) {
    global $apiUrl;
    $url = $apiUrl . $method . '?' . http_build_query($params);
    return file_get_contents($url);
}

// Admin functions
function isAdmin($userId) {
    global $admins;
    return in_array($userId, $admins);
}

function saveAdmins() {
    global $admins, $adminsFile;
    file_put_contents($adminsFile, json_encode($admins));
}

// Handle chat join requests
if (isset($update['chat_join_request'])) {
    $request = $update['chat_join_request'];
    $chatId = $request['chat']['id'];
    $userId = $request['from']['id'];

    // Approve request
    botRequest('approveChatJoinRequest', [
        'chat_id' => $chatId,
        'user_id' => $userId
    ]);

    // Add to users
    if (!in_array($userId, $users)) {
        $users[] = $userId;
        file_put_contents($usersFile, json_encode($users));
    }

    // Send welcome
    botRequest('sendMessage', [
        'chat_id' => $userId,
        'text' => "🎉 Aap Hamari Family Mein Jood Chuke Ho Thank You Joining Our Family.",
        'parse_mode' => 'Markdown'
    ]);
}

// Handle leaving members
if (isset($update['message']['left_chat_member'])) {
    $userId = $update['message']['left_chat_member']['id'];
    
    botRequest('sendMessage', [
        'chat_id' => $userId,
        'text' => "😔 Aap Hamari family ko chod kar jaa rahe ho kyu? Kripya feedback dein @Chandan1757E ko, Aur dobara join karen: @https://t.me/+oAdRN8O2O3gyNGJl"
    ]);
}

// Handle messages
if (isset($update['message']['text'])) {
    $text = $update['message']['text'];
    $chatId = $update['message']['chat']['id'];
    $fromId = $update['message']['from']['id'];
    $isAdmin = isAdmin($fromId);

    // Admin commands
    if ($isAdmin) {
        // Add admin
        if (preg_match('/^\/addadmin (\d+)$/', $text, $matches)) {
            $newAdmin = (int)$matches[1];
            if (!in_array($newAdmin, $admins)) {
                $admins[] = $newAdmin;
                saveAdmins();
                botRequest('sendMessage', [
                    'chat_id' => $chatId,
                    'text' => "✅ New admin added: $newAdmin"
                ]);
            } else {
                botRequest('sendMessage', [
                    'chat_id' => $chatId,
                    'text' => "⚠️ User is already an admin"
                ]);
            }
            exit;
        }

        // Remove admin
        if (preg_match('/^\/removeadmin (\d+)$/', $text, $matches)) {
            $removeAdmin = (int)$matches[1];
            if (($key = array_search($removeAdmin, $admins)) !== false) {
                unset($admins[$key]);
                saveAdmins();
                botRequest('sendMessage', [
                    'chat_id' => $chatId,
                    'text' => "❌ Admin removed: $removeAdmin"
                ]);
            } else {
                botRequest('sendMessage', [
                    'chat_id' => $chatId,
                    'text' => "⚠️ User is not an admin"
                ]);
            }
            exit;
        }

        // List admins
        if ($text === '/listadmins') {
            $adminList = implode("\n", array_map(fn($a) => "- `$a`", $admins));
            botRequest('sendMessage', [
                'chat_id' => $chatId,
                'text' => "📋 Admin List:\n$adminList",
                'parse_mode' => 'Markdown'
            ]);
            exit;
        }
    }

    // Broadcast command
    if (strpos($text, '/broadcast') === 0 && $isAdmin) {
        $msg = trim(str_replace('/broadcast', '', $text));
        
        if (!empty($msg)) {
            $successCount = 0;
            foreach ($users as $user) {
                $response = botRequest('sendMessage', [
                    'chat_id' => $user,
                    'text' => "📢 Broadcast:\n" . $msg
                ]);
                if ($response !== false) $successCount++;
            }
            
            botRequest('sendMessage', [
                'chat_id' => $chatId,
                'text' => "✅ Message sent to $successCount users."
            ]);
        } else {
            botRequest('sendMessage', [
                'chat_id' => $chatId,
                'text' => "❗ Please provide a message to broadcast.\nUsage: /broadcast your message"
            ]);
        }
        exit;
    }

    // Regular commands
    switch ($text) {
        case '/start':
            $reply = "Namaste!🙏 Ye bot aapki madad ke liye bhi hai. Type /livechat for direct contact to CHANDAN.";
            break;

        case '/help':
            $reply = "Aap ye commands use kar sakte hain:\n"
                   . "/start - Shuru karen\n"
                   . "/help - Madad lein\n"
                   . "/info - Bot ki jankari\n"
                   . "/livechat - Admin se baat karein\n"
                   . "/idinfo - Apna Telegram ID check karein\n";
            
            if ($isAdmin) {
                $reply .= "\nAdmin Commands:\n"
                       . "/addadmin [ID] - Naye admin ko jodein\n"
                       . "/removeadmin [ID] - Admin hataein\n"
                       . "/listadmins - Sabhi admin dikhayein\n"
                       . "/broadcast [MSG] - Sandesh sabhi ko bhejein";
            }
            break;

        case '/info':
            botRequest('sendMessage', [
                'chat_id' => $chatId,
                'text' => "Ye ek Telegram bot hai jo automatic join request ko approve karta hai Jisse @Chandan1757E ne banaya hai.",
                'reply_markup' => json_encode([
                    'inline_keyboard' => [
                        [['text' => 'Join Channel', 'url' => 'https://t.me/+oAdRN8O2O3gyNGJl']]
                    ]
                ])
            ]);
            exit;

        case '/livechat':
            $reply = "Aap Direct Hamare Owner Se Bhi Baat Kar Sakte Hai @Chandan1757E";
            break;

        case '/idinfo':
            botRequest('sendMessage', [
                'chat_id' => $chatId,
                'text' => "🆔 Aapka Telegram Chat ID: *$chatId*\n👤 User ID: *$fromId*",
                'parse_mode' => 'Markdown'
            ]);
            exit;

        default:
            $reply = "Aapne Kuch Galat Type Kiya Hai Aap Esko Check Kar Sakte Hai /help for options.";
    }

    botRequest('sendMessage', [
        'chat_id' => $chatId,
        'text' => $reply
    ]);
}

http_response_code(200);
?>
