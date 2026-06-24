/// <reference types="nakama-runtime" />

const REALISTIC_BOTS = [
  { name: 'ApexPhantom', avatarUrl: 'https://i.pravatar.cc/150?img=11', level: 3 },
  { name: 'GamerValkyrie', avatarUrl: 'https://i.pravatar.cc/150?img=12', level: 2 },
  { name: 'NexusVortex', avatarUrl: 'https://i.pravatar.cc/150?img=13', level: 4 },
  { name: 'FrostBite', avatarUrl: 'https://i.pravatar.cc/150?img=14', level: 1 },
  { name: 'SilentDagger', avatarUrl: 'https://i.pravatar.cc/150?img=15', level: 5 }
];

const matchmakerMatched: nkruntime.MatchmakerMatchedFunction = function(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matches: nkruntime.MatchmakerResult[]
): string | void {
  try {
    logger.info("=== MATCHMAKER MATCHED CALLED === matched count: %v", matches.length);

    const matchPlayers: any[] = [];

    // Dynamically resolve size based on properties from the matchmaker search
    let size = 2;
    if (matches.length > 0) {
      const firstMatch = matches[0];
      const props = firstMatch.properties || {};
      const requestedSize = parseInt((props as any).matchSize || '2');
      if (requestedSize === 4) {
        size = 4;
      }
    }

    logger.info("Building player list from %v real players, target size: %v", matches.length, size);

    if (matches.length < size) {
      logger.warn("Matchmaker matched fewer than %v players (got %v). Rejecting match creation to avoid bots.", size, matches.length);
      return; // Return void so Nakama does not build authoritative match with bots
    }

    matches.forEach(function(m, idx) {
      const props = m.properties || {};
      // Log every field of the presence to debug userId issues
      logger.info("Player[%v]: sessionId=%v, userId=%v, username=%v", 
        idx, m.presence.sessionId, m.presence.userId, m.presence.username);

      const rawAvatarUrl = (props as any).avatarurl || (props as any).avatarUrl || (props as any).avatar_url || '';

      matchPlayers.push({
        id: m.presence.sessionId,
        userId: m.presence.userId,
        isBot: false,
        name: (props as any).name || (props as any).userName || m.presence.username || ('Player ' + (matchPlayers.length + 1)),
        avatarUrl: rawAvatarUrl,
        level: parseInt((props as any).level || '1') || 1
      });
    });

    const colors = ['blue', 'green', 'red', 'yellow'];
    const finalPlayers = matchPlayers.map(function(p, idx) {
      return {
        id: p.id,
        userId: p.userId,
        isBot: p.isBot,
        name: p.name,
        avatarUrl: p.avatarUrl,
        level: p.level,
        color: colors[idx]
      };
    });

    logger.info("Final players for match: %v", JSON.stringify(finalPlayers));

    const matchId = nk.matchCreate('ludo_match', { players: JSON.stringify(finalPlayers) });
    logger.info("=== MATCH CREATED SUCCESSFULLY: %v ===", matchId);
    return matchId;
  } catch (e: any) {
    const errMsg = e?.message || e?.error || JSON.stringify(e) || String(e);
    logger.error("=== ERROR in matchmakerMatched: %v ===", errMsg);
    try {
      const activeUserId = (matches && matches[0] && matches[0].presence && matches[0].presence.userId) || "00000000-0000-0000-0000-000000000000";
      nk.storageWrite([{
        collection: "debug",
        key: "matchmaker_error",
        userId: activeUserId,
        value: { error: errMsg, timestamp: Date.now() },
        permissionRead: 2,
        permissionWrite: 0
      }]);
    } catch (writeErr) {}
    return; // returning void causes Nakama to send relay token to clients — do NOT do this
  }
};

function ludoPing(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  logger.info("ludo_ping called");
  return JSON.stringify({ status: "ok", module: "ludo_match", version: "v6", timestamp: Date.now() });
}

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  logger.info("Nakama Ludo Server Logic Initialized v6");
  
  // Diagnostic RPC — call via: GET /v2/rpc/ludo_ping?http_key=defaultkey
  initializer.registerRpc('ludo_ping', ludoPing);
  logger.info("Diagnostic RPC 'ludo_ping' registered");

  initializer.registerMatch('ludo_match', {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
  });
  logger.info("Match registered successfully");

  initializer.registerMatchmakerMatched(matchmakerMatched);
  logger.info("Matchmaker matched callback registered successfully");
}

// @ts-ignore
if (typeof exports !== 'undefined') {
  // @ts-ignore
  exports.InitModule = InitModule;
}
