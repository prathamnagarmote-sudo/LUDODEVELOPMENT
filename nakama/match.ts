/// <reference types="nakama-runtime" />

function matchInit(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: {[key: string]: string}
): {state: nkruntime.MatchState, tickRate: number, label: string} {
  try {
    logger.info("Match Init with params: %v", params);
    
    const players = JSON.parse(params.players || '[]');
    
    const state: any = {
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
      tickRate: 60, // 60Hz for ultra-low processing latency (16.6ms ticks)
      label: ""
    };
  } catch (e: any) {
    const errMsg = e?.message || e?.error || String(e);
    logger.error("Error in matchInit: %v", errMsg);
    try {
      nk.storageWrite([{
        collection: "debug",
        key: "matchinit_error",
        userId: "00000000-0000-0000-0000-000000000000",
        value: { error: errMsg, timestamp: Date.now() },
        permissionRead: 2,
        permissionWrite: 0
      }]);
    } catch (writeErr) {}
    throw e;
  }
}

function matchJoinAttempt(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presence: nkruntime.Presence,
  metadata: {[key: string]: any}
): {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string} | null {
  logger.info("matchJoinAttempt: userId=%v sessionId=%v", presence.userId, presence.sessionId);
  logger.info("matchJoinAttempt: known players=%v", JSON.stringify(state.players.map((p: any) => ({ userId: p.userId, id: p.id, name: p.name }))));

  const player = state.players.find((p: any) => p.userId === presence.userId);
  if (player) {
    logger.info("matchJoinAttempt: ACCEPTED player %v", presence.userId);
    return { state, accept: true };
  }

  logger.warn("matchJoinAttempt: REJECTED userId=%v not in player list", presence.userId);
  return { state, accept: false, rejectMessage: "Not part of this match" };
}

function matchJoin(
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
      player.id = presence.sessionId;
      player.isBot = false;
      if (player.name.includes(' (Bot)')) {
        player.name = player.name.replace(' (Bot)', '');
      }
      if (state.botTakeoverTicks[presence.userId]) {
        delete state.botTakeoverTicks[presence.userId];
      }
      
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
}

function matchLeave(
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
      state.botTakeoverTicks[presence.userId] = tick + 240; // 4 seconds at 60Hz
    }
  });
  return { state };
}

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
    roll,
    colour: player ? player.color : undefined
  }));
}

function matchLoop(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  messages: nkruntime.MatchMessage[]
): {state: nkruntime.MatchState} | null {
  state.tickCount = tick;

  for (const userId in state.botTakeoverTicks) {
    if (tick >= state.botTakeoverTicks[userId]) {
      const playerIndex = state.players.findIndex((p: any) => p.userId === userId);
      if (playerIndex !== -1) {
        const player = state.players[playerIndex];
        
        if (state.players.length === 2) {
          const opponent = state.players.find((p: any) => p.userId !== userId);
          if (opponent) {
            dispatcher.broadcastMessage(10, JSON.stringify({ winnerColor: opponent.color, loserColor: player.color }));
            return null;
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

  messages.forEach(function(message) {
    try {
      const opCode = message.opCode;
      let data: any = {};
      try {
        data = JSON.parse(nk.binaryToString(message.data));
      } catch (e) {
        // Handle non-JSON or empty message bodies
      }
      
      const currentPlayer = state.players[state.currentTurnIndex];

      if (opCode === 3) {
        if (currentPlayer.id !== message.sender.sessionId && !currentPlayer.isBot) {
          return;
        }
        executeRoll(state, dispatcher, currentPlayer.id);
      } 
      else if (opCode === 6) {
        const nextIndex = state.players.findIndex((p: any) => p.color === data.nextTurnColour);
        if (nextIndex !== -1) {
          state.currentTurnIndex = nextIndex;
          processTurn(state, dispatcher);
        }
      }
      else if (opCode === 8) {
        state.diceValue = data.roll;
      }
      else if (opCode === 7) {
        const playerIndex = state.players.findIndex((p: any) => p.id === message.sender.sessionId);
        if (playerIndex !== -1) {
          const player = state.players[playerIndex];
          if (state.players.length === 2) {
            const opponent = state.players.find((p: any) => p.id !== message.sender.sessionId);
            if (opponent) {
              dispatcher.broadcastMessage(10, JSON.stringify({ winnerColor: opponent.color, loserColor: player.color }));
              return;
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

      // ─── TRANSPARENT RELAY FOR CLIENT-BROADCAST MESSAGES ───────────────────
      // Relay the client message to all other active human players in the match.
      // OpCode 3 does not need client-side relay since it is server-driven,
      // but relaying other OpCodes (e.g. 1, 5, 6, 8, 9, 11, 98, 101, 102, 103)
      // is critical for the client's host-authoritative relay architecture.
      if (opCode !== 3) {
        const otherPlayers = state.players.filter((p: any) => p.id && p.id !== message.sender.sessionId && !p.isBot);
        const relayPresences: nkruntime.Presence[] = otherPlayers.map((p: any) => ({
          sessionId: p.id,
          userId: p.userId,
          username: p.name,
          node: ""
        }));
        if (relayPresences.length > 0) {
          dispatcher.broadcastMessage(opCode, message.data, relayPresences);
        }
      }
    } catch (e) {
      logger.error("Error processing message in matchLoop: %v", e);
    }
  });

  const currentPlayer = state.players[state.currentTurnIndex];
  if (currentPlayer.isBot) {
    if (!state.botRollTick) {
      state.botRollTick = tick + 90; // 1.5 seconds at 60Hz
    } else if (tick >= state.botRollTick) {
      executeRoll(state, dispatcher, currentPlayer.id);
      state.botRollTick = null;
    }
  } else {
    state.botRollTick = null;
  }

  let isMatchEmpty = true;
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (!p.isBot && !(p.userId in state.botTakeoverTicks)) {
      isMatchEmpty = false;
      break;
    }
  }

  if (isMatchEmpty) {
    state.emptyTicks++;
    if (state.emptyTicks > 600) { // 10 seconds at 60Hz
      return null;
    }
  } else {
    state.emptyTicks = 0;
  }

  return { state };
}

function matchTerminate(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  graceSeconds: number
): {state: nkruntime.MatchState} | null {
  return { state };
}

function matchSignal(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  data: string
): {state: nkruntime.MatchState, data?: string} | null {
  return { state };
}
