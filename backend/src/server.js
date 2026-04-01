const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const engine = require('./gameEngine');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow angular frontend to connect
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Client -> Server: joinRoom
  socket.on('joinRoom', ({ name, roomId }) => {
    socket.join(roomId);
    socket.roomId = roomId;

    const result = engine.joinRoom(socket.id, name, roomId);
    
    // playerJoined: { players }
    io.to(roomId).emit('playerJoined', { players: result.players });
  });

  // Client -> Server: startGame
  socket.on('startGame', ({ roomId }) => {
    // Only host can start
    const hostId = engine.getHost(roomId);
    if (hostId !== socket.id) return;

    const qPayload = engine.startGame(roomId);
    if (!qPayload) return;

    // gameStarted: {}
    io.to(roomId).emit('gameStarted', {});
    
    // newQuestion: { question, options, time }
    io.to(roomId).emit('newQuestion', qPayload);
    
    // Start strict game timer lifecycle
    engine.startQuestionLifecycle(io, roomId);
  });

  // Client -> Server: submitAnswer
  socket.on('submitAnswer', ({ roomId, answer }) => {
    // Attempt answer submission
    engine.submitAnswer(roomId, socket.id, answer);
    // Ignore if player already answered or wrong state
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    const result = engine.handleDisconnect(socket.id);
    
    if (result.action === 'updated') {
      io.to(result.roomId).emit('playerJoined', { players: result.players });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
