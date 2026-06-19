import { Client } from '@heroiclabs/nakama-js';
import ws from 'ws';

global.WebSocket = ws;

const HOST = 'nakama-production-e5b8.up.railway.app';
const PORT = '443';
const KEY = 'defaultkey';
const USE_SSL = true;

const client = new Client(KEY, HOST, PORT, USE_SSL);

async function test() {
  console.log("Creating sessions on live Railway Nakama...");
  const rand = Math.floor(Math.random() * 1000000);
  const session1 = await client.authenticateCustom("live_test_user_" + rand + "_1", true, "LiveOne_" + rand);
  const session2 = await client.authenticateCustom("live_test_user_" + rand + "_2", true, "LiveTwo_" + rand);

  console.log("Connecting sockets...");
  const socket1 = client.createSocket(USE_SSL, false);
  const socket2 = client.createSocket(USE_SSL, false);

  await socket1.connect(session1, true);
  await socket2.connect(session2, true);

  let matchmakerCompleted = false;

  const setupSocketListeners = (socket, name) => {
    socket.onmatchmakermatched = async (matched) => {
      console.log(`[${name}] Matched! match_id:`, matched.match_id, "token:", matched.token ? "present" : "missing");
      console.log(`[${name}] Full matched object:`, JSON.stringify(matched));
      try {
        console.log(`[${name}] Joining match...`);
        let match;
        if (matched.match_id) {
          match = await socket.joinMatch(matched.match_id);
        } else {
          match = await socket.joinMatch(undefined, matched.token);
        }
        console.log(`[${name}] Successfully joined match! ID:`, match.match_id);
      } catch (e) {
        console.error(`[${name}] Failed to join match:`, e);
      } finally {
        matchmakerCompleted = true;
      }
    };

    socket.onmatchdata = (result) => {
      const data = new TextDecoder().decode(result.data);
      console.log(`[${name}] RECEIVED OP_CODE ${result.op_code}:`, data);
      if (result.op_code === 200) {
        console.log(`[${name}] Received STATE_SYNC! Match successfully started.`);
      }
    };
  };

  setupSocketListeners(socket1, "User1");
  setupSocketListeners(socket2, "User2");

  console.log("Adding users to matchmaking using exact client properties...");
  const query = "*";
  const stringProps = {
    matchSize: "2",
    name: "TestUser",
    userName: "TestUser",
    avatarUrl: "",
    avatar_url: "",
    level: "1"
  };

  const ticket1 = await socket1.addMatchmaker(query, 2, 2, stringProps);
  const ticket2 = await socket2.addMatchmaker(query, 2, 2, stringProps);
  console.log("Tickets added:", ticket1.ticket, ticket2.ticket);

  // Poll wait for 40 seconds
  for (let i = 0; i < 40; i++) {
    if (matchmakerCompleted) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Disconnecting sockets...");
  socket1.disconnect();
  socket2.disconnect();
}

test().catch(console.error);
