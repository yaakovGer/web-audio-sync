const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const audioFilePath = path.join(__dirname, 'audio.mp3');

app.use(express.static(__dirname)); // Раздаём index.html

// Потоковая раздача аудиофайла
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

// WebSocket сервер для синхронизации
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

    ws.on('close', () => {
        console.log('Клиент отключился');
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
