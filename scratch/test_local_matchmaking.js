import { Client } from '@heroiclabs/nakama-js';
import ws from 'ws';

global.WebSocket = ws;

const HOST = '127.0.0.1';
const PORT = '7350';
const KEY = 'defaultkey';
const USE_SSL = false;

const client = new Client(KEY, HOST, PORT, USE_SSL);

async function test() {
  console.log("Creating sessions on local Nakama...");
  const session1 = await client.authenticateCustom("local_test_user_1", true, "LocalOne");
  const session2 = await client.authenticateCustom("local_test_user_2", true, "LocalTwo");

  console.log("Connecting sockets...");
  const socket1 = client.createSocket(USE_SSL, false);
  const socket2 = client.createSocket(USE_SSL, false);

  await socket1.connect(session1, true);
  await socket2.connect(session2, true);

  let matchmakerCompleted = false;

  const setupSocketListeners = (socket, name) => {
    socket.onmatchmakermatched = async (matched) => {
      console.log(`[${name}] Matched! match_id:`, matched.match_id, "token:", matched.token);
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
        matchmakerCompleted = true;
      }
    };

    socket.onmatchdata = (result) => {
      const data = new TextDecoder().decode(result.data);
      console.log(`[${name}] RECEIVED OP_CODE ${result.op_code}:`, data);
      if (result.op_code === 200) {
        console.log(`[${name}] Received STATE_SYNC! Match successfully started.`);
        matchmakerCompleted = true;
      }
    };
  };

  setupSocketListeners(socket1, "User1");
  setupSocketListeners(socket2, "User2");

  console.log("Adding users to matchmaking...");
  const query = "+properties.engine:ludo";
  const stringProps = { engine: "ludo" };

  const ticket1 = await socket1.addMatchmaker(query, 2, 2, stringProps);
  const ticket2 = await socket2.addMatchmaker(query, 2, 2, stringProps);
  console.log("Tickets added:", ticket1.ticket, ticket2.ticket);

  // Poll wait for 15 seconds
  for (let i = 0; i < 15; i++) {
    if (matchmakerCompleted) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Disconnecting sockets...");
  socket1.disconnect();
  socket2.disconnect();
}

test().catch(console.error);
