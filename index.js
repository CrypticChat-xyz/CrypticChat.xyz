const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('new user', (username) => {
        socket.username = username;
        io.emit('chat message', `${username} has joined the chat`);
    });

    socket.on('chat message', (msg) => {
        if (msg.trim() !== '') {
            console.log(`[${socket.handshake.address}] ${socket.username}: ${msg}`);
            socket.emit('chat message', `${socket.username}: ${msg}`);
            socket.broadcast.emit('chat message', `${socket.username}: ${msg}`);
        }
    });
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
