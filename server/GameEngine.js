export class GameEngine {
  constructor(io) {
    this.io = io;
    this.games = new Map(); // roomId -> gameState
  }

  startMatch(roomId, players) {
    const initialState = {
      roomId,
      players,
      currentTurnIndex: 0,
      diceValue: null,
      status: 'playing',
      // We would expand this to hold the full board state
      // positions: { red: [0,0,0,0], green: [...], ... }
    };
    
    this.games.set(roomId, initialState);
    
    // Notify players the game is starting
    this.io.to(roomId).emit('match_started', initialState);
    this.processTurn(roomId);
  }

  processTurn(roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    const currentPlayer = game.players[game.currentTurnIndex];
    this.io.to(roomId).emit('turn_update', { currentPlayer: currentPlayer.id });

    if (currentPlayer.isBot) {
      // Bot logic
      setTimeout(() => {
        this.executeRoll(roomId, currentPlayer.id);
      }, 1500); // Wait 1.5 seconds so it feels human
    }
  }

  handleRoll(socketId, roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    const currentPlayer = game.players[game.currentTurnIndex];
    if (currentPlayer.id !== socketId && !currentPlayer.isBot) {
      console.log(`Player ${socketId} tried to roll out of turn!`);
      return;
    }

    this.executeRoll(roomId, currentPlayer.id);
  }

  executeRoll(roomId, playerId) {
    const game = this.games.get(roomId);
    if (!game) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    game.diceValue = roll;
    
    this.io.to(roomId).emit('dice_rolled', { playerId, roll });

    // In a full implementation, we'd calculate valid moves here.
    // For now, just pass the turn.
    setTimeout(() => {
      game.currentTurnIndex = (game.currentTurnIndex + 1) % 4;
      this.processTurn(roomId);
    }, 2000); // Wait for animations to finish before next turn
  }

  handleDisconnect(socketId) {
    // If a human player disconnects, find their game and turn them into a bot
    for (const [roomId, game] of this.games.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socketId);
      if (playerIndex !== -1) {
        console.log(`Player ${socketId} disconnected from match ${roomId}. Converting to Bot.`);
        game.players[playerIndex].isBot = true;
        game.players[playerIndex].name += ' (Bot)';
        
        this.io.to(roomId).emit('player_disconnected', { 
          playerId: socketId, 
          message: 'Player disconnected. Bot taking over.' 
        });

        // If it was their turn, let the bot roll
        if (game.currentTurnIndex === playerIndex) {
          this.processTurn(roomId);
        }
      }
    }
  }
}
