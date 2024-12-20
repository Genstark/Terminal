const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const request = require('request');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 20e6
});


app.use(express.static(path.resolve(__dirname, 'public'), { 'extensions': ['html', 'css', 'js'] }));

app.get('/', (req, res) => {
    res.status(200).sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// const img = base64_encode('./public/resource/Arc_Reactor_baseColor.png');

let connections = [];
let users = [];

io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
    // users.push(socket.id);
    // console.table(connections);

    socket.on('user_info', (data) => {
        const userObject = {
            username: data.username,
            socketId: socket.id
        };
        connections.push(userObject);
        console.table(connections);
        io.to(connections[0].socketId).emit('server_info', JSON.stringify({ servername: 'mainserver' }));
    });

    socket.on('number', (data) => {
        console.log(data);
    });

    socket.on('message', (msg) => {
        console.log('Message received: ', msg);
        io.emit('message', JSON.stringify({ message: Math.floor(Math.random() * 10000000) }));
    });

    socket.on('reply', (data) => {
        console.log('data:', data);
        io.emit('reply', JSON.stringify({ message: Math.floor(Math.random() * 10000000) }));
    });

    socket.on('replyback', (data) => {
        console.log('data:', data);
        io.to(connections[0]).emit('replyback', JSON.stringify({ message: Math.floor(Math.random() * 10000000) }));
    });

    socket.on('file-upload', async (data) => {
        console.log(connections.length);
        if (connections.length > 0) {
            try {
                console.log(data);
                await io.to(connections[0].socketId).emit('imageReceive', { image: data });
                await io.to(data.socketid).emit('receive-file', { msg: 'data is received' });
                console.log('task complete');
                console.log('wait...');
            }
            catch (error) {
                console.log(error);
            }
        }
        else {
            console.log('no connections');
        }
    });

    socket.on('imageResponse', (data) => {
        try {
            console.log(data);
            if (data.userSocketId) {
                io.to(data.userSocketId).emit('AI', {
                    message: data.response
                });
                console.log('send');
            }
            else {
                console.error("Invalid or non-existing userSocketId:", data.userSocketId);
            }
        }
        catch (error) {
            console.log(error);
        }
    });

    socket.on('send_to_user', (data) => {
        const targetUser = connections.find((conn) => conn.username === data.targetUsername);

        if (targetUser) {
            io.to(targetUser.socketId).emit('receive_message', {
                sender: data.senderUsername,
                message: data.message
            });
            console.log(`Message sent to ${data.targetUsername}`);
        } else {
            console.log(`User ${data.targetUsername} not found.`);
        }
    });

    socket.on('term', (data) => {
        console.log(data);
        // io.to(data.id).emit('get', { message: 'message got', id: data.id, number: Math.floor(Math.random() * (100000 - 1) - 1) });

        request('https://cmpmarketplacebackend.onrender.com/items', function (error, response, body) {
            if (error) {
                console.error('Error:', error);
                return;
            }

            if (response.statusCode === 200) {
                console.log('Response Body:', body);
                const items = JSON.parse(body);
                io.to(data.id).emit('get', { message: 'message got', id: data.id, number: Math.floor(Math.random() * (100000 - 1) - 1), items: items });
            } else {
                console.log('Status Code:', response.statusCode);
            }
        });

    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        const findindex = connections.findIndex((conn) => conn.socketId === socket.id);
        if (findindex !== -1) {
            connections.splice(findindex, 1);
        }
        else {
            console.log('No matching socket ID found for disconnect');
        }
    });
});

const PORT = process.env.PORT || 5173;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});