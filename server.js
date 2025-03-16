// === Серверная часть (Node.js + Express + WebSocket) ===
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const audioFilePath = path.join(__dirname, 'audio.mp3');

// Улучшенная потоковая раздача аудиофайла
app.get('/audio', (req, res) => {
    const stat = fs.statSync(audioFilePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(audioFilePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg'
        });
        file.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mpeg'
        });
        fs.createReadStream(audioFilePath).pipe(res);
    }
});

wss.on('connection', ws => {
    console.log('Клиент подключился');
    ws.on('message', message => {
        if (message === 'sync') {
            console.log('Синхронизация воспроизведения');
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('play');
                }
            });
        } else if (message === 'pause') {
            console.log('Пауза воспроизведения');
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('pause');
                }
            });
        }
    });
});

server.listen(8080, () => {
    console.log('Сервер запущен на порту 8080');
});

// === Клиентская часть (HTML + JavaScript) ===
const socket = new WebSocket('wss://web-audio-sync.onrender.com');


