const fs = require('fs');
const path = require('path');

const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8')
);

const rooms = {};

// Helper: Format players list for broadcast
function getPlayersBaseList(roomId) {
  if (!rooms[roomId]) return [];
  const room = rooms[roomId];
  return Object.keys(room.players).map((socketId) => ({
    socketId,
    name: room.players[socketId].name,
    score: room.players[socketId].score,
    answered: room.players[socketId].answered,
    isHost: room.hostId === socketId
  }));
}

// 1. Room Join
function joinRoom(socketId, name, roomId) {
  if (!rooms[roomId]) {
    // Create new room if it doesn't exist
    rooms[roomId] = {
      hostId: socketId,
      gameState: "waiting",
      currentQuestionIndex: 0,
      timer: null,
      players: {}
    };
  }
  
  // Add player to room
  rooms[roomId].players[socketId] = {
    name: name,
    score: 0,
    answered: false
  };

  return { room: rooms[roomId], players: getPlayersBaseList(roomId) };
}

// 7. Disconnect Handling
function handleDisconnect(socketId) {
  let modifiedRoomId = null;
  
  for (const roomId in rooms) {
    if (rooms[roomId].players[socketId]) {
      modifiedRoomId = roomId;
      delete rooms[roomId].players[socketId];

      const remainingPlayers = Object.keys(rooms[roomId].players);
      
      // If room is empty, delete it
      if (remainingPlayers.length === 0) {
        if (rooms[roomId].timer) clearTimeout(rooms[roomId].timer);
        delete rooms[roomId];
        return { action: 'deleted', roomId };
      }
      
      // If host leaves, assign new host
      if (rooms[roomId].hostId === socketId) {
        rooms[roomId].hostId = remainingPlayers[0];
      }
      return { action: 'updated', roomId, players: getPlayersBaseList(roomId) };
    }
  }
  return { action: 'none' };
}

// 2. Start Game
function startGame(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameState !== "waiting") return null;

  room.gameState = "playing";
  room.currentQuestionIndex = 0;
  
  return prepareQuestionPayload(roomId);
}

function prepareQuestionPayload(roomId) {
  const room = rooms[roomId];
  const qContext = questions[room.currentQuestionIndex];
  
  // Reset answered flag for all players
  for (const pid in room.players) {
    room.players[pid].answered = false;
  }

  return {
    question: qContext.question,
    options: [...qContext.options], // Shallow copy
    time: 10
  };
}

// 4. Answer Submission
function submitAnswer(roomId, socketId, answer) {
  const room = rooms[roomId];
  if (!room || room.gameState !== "playing") return null;

  const player = room.players[socketId];
  if (!player || player.answered) return null;

  player.answered = true;

  const qContext = questions[room.currentQuestionIndex];
  if (qContext.answer === answer) {
    player.score += 10;
  }
  
  return true;
}

// Setup Timer Flow
function handleTimerEnd(io, roomId) {
  const room = rooms[roomId];
  if (!room || room.gameState !== "playing") return;

  const qContext = questions[room.currentQuestionIndex];
  const correctAnswer = qContext.answer;

  // Reveal correct answer
  io.to(roomId).emit('answerResult', { correctAnswer });
  
  // Send scoreUpdated
  io.to(roomId).emit('scoreUpdated', { leaderboard: getPlayersBaseList(roomId) });

  // Move to next question after 2 seconds
  setTimeout(() => {
    nextQuestion(io, roomId);
  }, 2000);
}

// 6. Next Question
function nextQuestion(io, roomId) {
  const room = rooms[roomId];
  if (!room || room.gameState !== "playing") return;

  room.currentQuestionIndex++;

  if (room.currentQuestionIndex >= questions.length) {
    // If questions finished
    room.gameState = "finished";
    io.to(roomId).emit('gameOver', { leaderboard: getPlayersBaseList(roomId) });
  } else {
    // Else send next question
    io.to(roomId).emit('nextQuestion', {});
    const qPayload = prepareQuestionPayload(roomId);
    io.to(roomId).emit('newQuestion', qPayload);
    
    // Start 10 second timer
    room.timer = setTimeout(() => {
      handleTimerEnd(io, roomId);
    }, 10000);
  }
}

// Used to start the very first timer right after the initial 'gameStarted' + 'newQuestion' broadcasts
function startQuestionLifecycle(io, roomId) {
  const room = rooms[roomId];
  if (!room || room.gameState !== "playing") return;
  
  if (room.timer) clearTimeout(room.timer);
  room.timer = setTimeout(() => {
    handleTimerEnd(io, roomId);
  }, 10000);
}

function getHost(roomId) {
  return rooms[roomId] ? rooms[roomId].hostId : null;
}

module.exports = {
  joinRoom,
  handleDisconnect,
  startGame,
  submitAnswer,
  startQuestionLifecycle,
  getHost,
  rooms
};
