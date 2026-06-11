import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Matchmaker } from './Matchmaker.js';
import { GameEngine } from './GameEngine.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameEngine = new GameEngine(io);
const matchmaker = new Matchmaker(io, gameEngine);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Matchmaking events
  socket.on('join_matchmaking', () => {
    matchmaker.addPlayer(socket);
  });

  socket.on('leave_matchmaking', () => {
    matchmaker.removePlayer(socket);
  });

  // Game events
  socket.on('request_roll', (data) => {
    gameEngine.handleRoll(socket.id, data.roomId);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    matchmaker.removePlayer(socket);
    gameEngine.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
