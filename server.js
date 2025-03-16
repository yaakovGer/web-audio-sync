// Серверная часть (Node.js + WebSocket)
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', ws => {
    console.log('Клиент подключился');
    ws.on('message', message => {
        if (message === 'sync') {
            console.log('Синхронизация воспроизведения');
            server.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('play');
                }
            });
        } else if (message === 'pause') {
            console.log('Пауза воспроизведения');
            server.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('pause');
                }
            });
        }
    });
});

console.log('WebSocket сервер запущен на порту 8080');

