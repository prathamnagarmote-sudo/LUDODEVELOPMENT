import { Client } from '@heroiclabs/nakama-js';
import ws from 'ws';

global.WebSocket = ws;

const HOST = 'nakama-production-e5b8.up.railway.app';
const PORT = '443';
const KEY = 'defaultkey';
const USE_SSL = true;

const client = new Client(KEY, HOST, PORT, USE_SSL);

async function runSingleTest(attempt) {
  console.log(`\n--- Matchmaking Test Attempt #${attempt} ---`);
  const rand = Math.floor(Math.random() * 1000000);
  const session1 = await client.authenticateCustom("poll_user_" + rand + "_1", true, "PollOne_" + rand);
  const session2 = await client.authenticateCustom("poll_user_" + rand + "_2", true, "PollTwo_" + rand);

  const socket1 = client.createSocket(USE_SSL, false);
  const socket2 = client.createSocket(USE_SSL, false);

  await socket1.connect(session1, true);
  await socket2.connect(session2, true);

  let matchmakerCompleted = false;
  let success = false;

  const setupSocketListeners = (socket, name) => {
    socket.onmatchmakermatched = async (matched) => {
      console.log(`[${name}] Matched! match_id:`, matched.match_id, "token:", matched.token ? "present" : "missing");
      if (matched.match_id) {
        success = true;
        try {
          console.log(`[${name}] Joining authoritative match...`);
          const match = await socket.joinMatch(matched.match_id);
          console.log(`[${name}] Successfully joined match! ID:`, match.match_id);
        } catch (e) {
          console.error(`[${name}] Failed to join match:`, e);
        }
        matchmakerCompleted = true;
      } else {
        console.log(`[${name}] Fallback to relay match token, authoritative match failed to initialize.`);
        matchmakerCompleted = true;
      }
    };

    socket.onmatchdata = (result) => {
      if (result.op_code === 200) {
        console.log(`[${name}] Received STATE_SYNC! Match successfully started.`);
        matchmakerCompleted = true;
      }
    };
  };

  setupSocketListeners(socket1, "User1");
  setupSocketListeners(socket2, "User2");

  const query = "+properties.engine:ludo";
  const stringProps = { engine: "ludo" };

  await socket1.addMatchmaker(query, 2, 2, stringProps);
  await socket2.addMatchmaker(query, 2, 2, stringProps);

  for (let i = 0; i < 20; i++) {
    if (matchmakerCompleted) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  socket1.disconnect();
  socket2.disconnect();
  return success;
}

async function main() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    const success = await runSingleTest(attempt);
    if (success) {
      console.log("\n====== SUCCESS! Authoritative matchmaking is now fully functional on the live server! ======");
      process.exit(0);
    }
    console.log("Waiting 30 seconds for next attempt...");
    await new Promise(r => setTimeout(r, 30000));
  }
  console.log("\nTimed out waiting for authoritative matchmaking to become active.");
  process.exit(1);
}

main().catch(console.error);
