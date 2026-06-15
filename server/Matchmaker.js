export class Matchmaker {
  constructor(io, gameEngine) {
    this.io = io;
    this.gameEngine = gameEngine;
    this.queue = [];
    this.timer = null;
    this.countdown = 15;
  }

  addPlayer(socket) {
    if (!this.queue.includes(socket)) {
      this.queue.push(socket);
      console.log(`Player ${socket.id} joined matchmaking. Queue size: ${this.queue.length}`);
      
      if (this.queue.length === 1) {
        this.startTimer();
      }
      
      this.notifyQueueUpdate();

      if (this.queue.length === 4) {
        this.createMatch();
      }
    }
  }

  removePlayer(socket) {
    this.queue = this.queue.filter(p => p.id !== socket.id);
    console.log(`Player ${socket.id} left matchmaking. Queue size: ${this.queue.length}`);
    this.notifyQueueUpdate();
    
    if (this.queue.length === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startTimer() {
    this.countdown = 15;
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.countdown--;
      this.io.to('matchmaking').emit('timer_update', { timeRemaining: this.countdown });
      
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.timer = null;
        if (this.queue.length > 0) {
          this.createMatch(); // Inject bots to fill the rest
        }
      }
    }, 1000);
  }

  notifyQueueUpdate() {
    this.queue.forEach(socket => {
      socket.join('matchmaking');
      socket.emit('queue_update', { players: this.queue.length, max: 4 });
    });
  }

  createMatch() {
    const roomId = `room_${Date.now()}`;
    const players = [];
    const colors = ['red', 'green', 'yellow', 'blue'];

    // Move real players
    while (this.queue.length > 0 && players.length < 4) {
      const p = this.queue.shift();
      p.leave('matchmaking');
      p.join(roomId);
      players.push({
        id: p.id,
        isBot: false,
        color: colors[players.length],
        name: `Player ${players.length + 1}`
      });
    }

    // Inject bots
    while (players.length < 4) {
      players.push({
        id: `bot_${Math.random().toString(36).substring(7)}`,
        isBot: true,
        color: colors[players.length],
        name: `Bot_${Math.floor(Math.random() * 1000)}`
      });
    }

    console.log(`Creating match ${roomId} with ${players.length} players (${players.filter(p=>p.isBot).length} bots)`);
    this.gameEngine.startMatch(roomId, players);
  }
}
