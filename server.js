// === Серверная часть (Node.js + Express + WebSocket) ===
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const audioFilePath = path.join(__dirname, 'audio.mp3');

// Раздача аудиофайла клиентам
app.get('/audio', (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    const readStream = fs.createReadStream(audioFilePath);
    readStream.pipe(res);
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
