import { Client } from '@heroiclabs/nakama-js';
import ws from 'ws';

global.WebSocket = ws;

const HOST = 'nakama-production-e5b8.up.railway.app';
const PORT = '443';
const KEY = 'defaultkey';
const USE_SSL = true;

const client = new Client(KEY, HOST, PORT, USE_SSL);

async function test() {
  console.log("Authenticating user on live server...");
  const rand = Math.floor(Math.random() * 1000000);
  const session = await client.authenticateCustom("test_creator_" + rand, true, "Creator_" + rand);
  
  console.log("Connecting socket...");
  const socket = client.createSocket(USE_SSL, false);
  await socket.connect(session, true);

  console.log("Attempting to create match 'ludo_match'...");
  try {
    // Send players param as matchInit expects it
    const playersParam = JSON.stringify([
      { name: "Creator", userId: session.user_id, color: "blue" }
    ]);
    const response = await socket.createMatch(); // wait, does createMatch accept a custom module?
    console.log("Standard socket.createMatch() returned match ID:", response.match_id);
  } catch (err) {
    console.error("Standard socket.createMatch() failed:", err);
  }

  // Also try RPC or create via server RPC if possible? No, we didn't register an RPC.
  // Wait, let's see how nk.matchCreate is called by the server. 
  // Client can join an authoritative match if it exists. 
  // Let's disconnect.
  socket.disconnect();
}

test().catch(console.error);
