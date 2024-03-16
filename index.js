const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const filter = new Filter();

app.use(express.static(path.join(__dirname, 'public')));

function containsSwearWords(message) {
    return filter.isProfane(message);
}

function filterSwearWords(message) {
    return filter.clean(message);
}

async function getCryptoPrices() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=usd');
        return response.data;
    } catch (error) {
        console.error('Error fetching cryptocurrency prices:', error);
        return null;
    }
}

io.on('connection', async (socket) => {
    const prices = await getCryptoPrices();
    if (prices) {
        io.to(socket.id).emit('crypto prices', prices);
    }

    setInterval(async () => {
        const updatedPrices = await getCryptoPrices();
        if (updatedPrices) {
            io.emit('crypto prices', updatedPrices);
        }
    }, 30000);

    socket.on('new user', (username) => {
        socket.username = username;
        io.emit('chat message', `${username} has joined the chat`);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('chat message', `${socket.username} has left the chat`);
        }
    });

    socket.on('chat message', (msg) => {
        if (msg.trim() !== '') {
            const timestamp = new Date().toLocaleTimeString();
            const messageWithTimestamp = `[${timestamp}] ${socket.username}: ${msg}`;
            
            if (containsSwearWords(msg)) {
                const filteredMessage = filterSwearWords(msg);
                io.emit('chat message', `[Filtered] ${socket.username}: ${filteredMessage}`);
            } else {
                io.emit('chat message', messageWithTimestamp);
            }
            
            console.log(`[${socket.handshake.address}] ${messageWithTimestamp}`);
        }
    });
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(3000, () => {
    console.log(`
    #####  ######  #     # ######  ####### ###  #####  
    #     # #     #  #   #  #     #    #     #  #     # 
    #       #     #   # #   #     #    #     #  #       
    #       ######     #    ######     #     #  #       
    #       #   #      #    #          #     #  #       
    #     # #    #     #    #          #     #  #     # 
     #####  #     #    #    #          #    ###  #####  
    `);
    console.log('listening on *:3000');
});
