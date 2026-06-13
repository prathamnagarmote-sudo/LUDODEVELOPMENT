/// <reference types="nakama-runtime" />
export const matchInit = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: {[key: string]: string}
): {state: nkruntime.MatchState, tickRate: number, label: string} {
  logger.info("Match Init with params: %v", params);
  
  const players = JSON.parse(params.players || '[]');
  
  const state = {
    roomId: ctx.matchId,
    players: players,
    currentTurnIndex: 0,
    diceValue: null,
    status: 'playing',
    emptyTicks: 0,
    tickCount: 0,
    botTakeoverTicks: {} as {[userId: string]: number}
  };

  return {
    state,
    tickRate: 10, // 10 ticks per second
    label: ""
  };
};

export const matchJoinAttempt = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presence: nkruntime.Presence,
  metadata: {[key: string]: any}
): {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string} | null {
  // Allow players to join if they are part of the state
  const player = state.players.find((p: any) => p.userId === presence.userId);
  if (player) {
    return { state, accept: true };
  }
  return { state, accept: false, rejectMessage: "Not part of this match" };
};

export const matchJoin = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): {state: nkruntime.MatchState} | null {
  presences.forEach(presence => {
    const player = state.players.find((p: any) => p.userId === presence.userId);
    if (player) {
      player.id = presence.sessionId; // update session id
      player.isBot = false;
      if (player.name.includes(' (Bot)')) {
        player.name = player.name.replace(' (Bot)', '');
      }
      if (state.botTakeoverTicks[presence.userId]) {
        delete state.botTakeoverTicks[presence.userId];
      }
      
      // Send current state to the joining player
      dispatcher.broadcastMessage(1, JSON.stringify({
        roomId: state.roomId,
        players: state.players,
        currentTurnIndex: state.currentTurnIndex,
        diceValue: state.diceValue,
        status: state.status
      }), [presence]);
      
      const currentPlayer = state.players[state.currentTurnIndex];
      dispatcher.broadcastMessage(2, JSON.stringify({
        currentTurnIndex: state.currentTurnIndex,
        currentPlayerId: currentPlayer.id,
        currentPlayerColour: currentPlayer.color
      }), [presence]);
    }
  });

  return { state };
};

export const matchLeave = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): {state: nkruntime.MatchState} | null {
  presences.forEach(presence => {
    const playerIndex = state.players.findIndex((p: any) => p.userId === presence.userId);
    if (playerIndex !== -1) {
      const player = state.players[playerIndex];
      // Set to convert to bot after 40 ticks (4 seconds at 10 ticks/s)
      state.botTakeoverTicks[presence.userId] = tick + 40;
    }
  });

  return { state };
};

export const matchLoop = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  messages: nkruntime.MatchMessage[]
): {state: nkruntime.MatchState} | null {
  state.tickCount = tick;

  // Check bot takeovers
  for (const userId in state.botTakeoverTicks) {
    if (tick >= state.botTakeoverTicks[userId]) {
      const playerIndex = state.players.findIndex((p: any) => p.userId === userId);
      if (playerIndex !== -1) {
        const player = state.players[playerIndex];
        
        if (state.players.length === 2) {
          const opponent = state.players.find((p: any) => p.userId !== userId);
          if (opponent) {
            dispatcher.broadcastMessage(10, JSON.stringify({ winnerColor: opponent.color, loserColor: player.color }));
            return null; // end match
          }
        }
        
        player.isBot = true;
        if (!player.name.includes(' (Bot)')) {
          player.name += ' (Bot)';
        }
        
        dispatcher.broadcastMessage(9, JSON.stringify({ 
          colour: player.color,
          playerId: player.id,
          userId: player.userId
        }));
        
        if (state.currentTurnIndex === playerIndex) {
          processTurn(state, dispatcher);
        }
      }
      delete state.botTakeoverTicks[userId];
    }
  }

  // Handle messages
  messages.forEach(message => {
    try {
      const data = JSON.parse(nk.binaryToString(message.data));
      const opCode = message.opCode;
      
      const currentPlayer = state.players[state.currentTurnIndex];

      if (opCode === 3) { // request_roll
        if (currentPlayer.id !== message.sender.sessionId && !currentPlayer.isBot) {
          return;
        }
        executeRoll(state, dispatcher, currentPlayer.id);
      } 
      else if (opCode === 4) { // submit_move
        dispatcher.broadcastMessage(5, JSON.stringify({
          colour: currentPlayer.color,
          id: data.tokenId,
          isUnlock: data.isUnlock
        }));
      }
      else if (opCode === 6) { // finish_turn
        const nextIndex = state.players.findIndex((p: any) => p.color === data.nextTurnColour);
        if (nextIndex !== -1) {
          state.currentTurnIndex = nextIndex;
          processTurn(state, dispatcher);
        }
      }
      else if (opCode === 7) { // exit_match
        const playerIndex = state.players.findIndex((p: any) => p.id === message.sender.sessionId);
        if (playerIndex !== -1) {
          const player = state.players[playerIndex];
          if (state.players.length === 2) {
            const opponent = state.players.find((p: any) => p.id !== message.sender.sessionId);
            if (opponent) {
              dispatcher.broadcastMessage(10, JSON.stringify({ winnerColor: opponent.color, loserColor: player.color }));
              return null; // Stop match
            }
          }
          player.isBot = true;
          if (!player.name.includes(' (Bot)')) {
            player.name += ' (Bot)';
          }
          dispatcher.broadcastMessage(9, JSON.stringify({
            colour: player.color,
            playerId: player.id,
            userId: player.userId
          }));
          if (state.currentTurnIndex === playerIndex) {
            processTurn(state, dispatcher);
          }
        }
      }
    } catch (e) {
      logger.error("Error processing message: %v", e);
    }
  });

  // Bot logic
  const currentPlayer = state.players[state.currentTurnIndex];
  if (currentPlayer.isBot) {
    if (!state.botRollTick) {
      state.botRollTick = tick + 15; // 1.5 seconds at 10 ticks/s
    } else if (tick >= state.botRollTick) {
      executeRoll(state, dispatcher, currentPlayer.id);
      state.botRollTick = null; // Clear so it only rolls once
    }
  } else {
    state.botRollTick = null;
  }

  // Check if match is empty
  let isMatchEmpty = true;
  for (const player of state.players) {
    if (!player.isBot && Object.keys(state.botTakeoverTicks).indexOf(player.userId) === -1) {
      isMatchEmpty = false;
      break;
    }
  }

  if (isMatchEmpty) {
    state.emptyTicks++;
    if (state.emptyTicks > 100) { // End match if empty for 10 seconds
      return null;
    }
  } else {
    state.emptyTicks = 0;
  }

  return { state };
};

export const matchTerminate = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  graceSeconds: number
): {state: nkruntime.MatchState} | null {
  return { state };
};

export const matchSignal = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  data: string
): {state: nkruntime.MatchState, data?: string} | null {
  return { state };
};

function processTurn(state: any, dispatcher: nkruntime.MatchDispatcher) {
  const currentPlayer = state.players[state.currentTurnIndex];
  dispatcher.broadcastMessage(2, JSON.stringify({
    currentTurnIndex: state.currentTurnIndex,
    currentPlayerId: currentPlayer.id,
    currentPlayerColour: currentPlayer.color
  }));
}

function executeRoll(state: any, dispatcher: nkruntime.MatchDispatcher, playerId: string) {
  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceValue = roll;
  const player = state.players.find((p: any) => p.id === playerId);
  dispatcher.broadcastMessage(8, JSON.stringify({
    playerId,
    playerUserId: player ? player.userId : undefined,
    roll
  }));
}
