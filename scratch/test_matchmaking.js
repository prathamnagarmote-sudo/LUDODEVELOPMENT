import { Client } from '@heroiclabs/nakama-js';

const client = new Client("defaultkey", "127.0.0.1", "7350", false);

async function test() {
  console.log("Creating sessions...");
  const session1 = await client.authenticateCustom("user_test_1", true, "UserOne");
  const session2 = await client.authenticateCustom("user_test_2", true, "UserTwo");

  console.log("Connecting sockets...");
  const socket1 = client.createSocket(false, false);
  const socket2 = client.createSocket(false, false);

  await socket1.connect(session1, true);
  await socket2.connect(session2, true);

  let matchmakerCompleted = false;

  socket1.onmatchmakermatched = async (matched) => {
    console.log("User 1 Matched! match_id:", matched.match_id, "token:", matched.token);
    try {
      console.log("User 1 joining match...");
      let match;
      if (matched.match_id) {
        console.log("User 1: Joining via match_id:", matched.match_id);
        match = await socket1.joinMatch(matched.match_id);
      } else {
        console.log("User 1: Joining via token:", matched.token);
        match = await socket1.joinMatch(undefined, matched.token);
      }
      console.log("User 1 successfully joined match! ID:", match.match_id);
      matchmakerCompleted = true;
    } catch (e) {
      console.error("User 1 failed to join match:", e);
      matchmakerCompleted = true;
    }
  };

  socket2.onmatchmakermatched = async (matched) => {
    console.log("User 2 Matched! match_id:", matched.match_id, "token:", matched.token);
    try {
      console.log("User 2 joining match...");
      let match;
      if (matched.match_id) {
        console.log("User 2: Joining via match_id:", matched.match_id);
        match = await socket2.joinMatch(matched.match_id);
      } else {
        console.log("User 2: Joining via token:", matched.token);
        match = await socket2.joinMatch(undefined, matched.token);
      }
      console.log("User 2 successfully joined match! ID:", match.match_id);
      matchmakerCompleted = true;
    } catch (e) {
      console.error("User 2 failed to join match:", e);
      matchmakerCompleted = true;
    }
  };

  console.log("Adding to matchmaker...");
  const ticket1 = await socket1.addMatchmaker('*', 2, 2, { matchSize: '2' });
  const ticket2 = await socket2.addMatchmaker('*', 2, 2, { matchSize: '2' });
  console.log("Tickets added:", ticket1.ticket, ticket2.ticket);

  // Poll wait
  for (let i = 0; i < 30; i++) {
    if (matchmakerCompleted) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Disconnecting sockets...");
  socket1.disconnect();
  socket2.disconnect();
}

test().catch(console.error);
