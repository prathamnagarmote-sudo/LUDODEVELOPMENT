import { Client } from '@heroiclabs/nakama-js';
import ws from 'ws';
import pg from 'pg';

global.WebSocket = ws;

const HOST = 'nakama-production-e5b8.up.railway.app';
const PORT = '443';
const KEY = 'defaultkey';
const USE_SSL = true;

const DB_CONN = 'postgresql://postgres:BuViTqBXxhEsxoeFAGclAMYwgBzHDYRM@thomas.proxy.rlwy.net:42968/railway';

async function queryDB() {
  const pgClient = new pg.Client({
    connectionString: DB_CONN,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await pgClient.connect();
    const res = await pgClient.query("SELECT collection, key, value, update_time FROM storage WHERE collection = 'debug' ORDER BY update_time DESC LIMIT 10;");
    console.log('\n--- DB Debug Errors ---');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('-----------------------\n');
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pgClient.end();
  }
}

async function simulate() {
  console.log('Clearing old debug storage errors in DB first...');
  const pgClient = new pg.Client({
    connectionString: DB_CONN,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await pgClient.connect();
    await pgClient.query("DELETE FROM storage WHERE collection = 'debug';");
    console.log('Deleted old debug errors.');
  } catch(e) {
    console.error('Failed to clear old debug storage:', e);
  } finally {
    await pgClient.end();
  }

  const client1 = new Client(KEY, HOST, PORT, USE_SSL);
  const client2 = new Client(KEY, HOST, PORT, USE_SSL);

  console.log('Authenticating users...');
  const session1 = await client1.authenticateCustom('sim_user_1', true, 'SimUser1');
  const session2 = await client2.authenticateCustom('sim_user_2', true, 'SimUser2');
  console.log('Authenticated successfully!');

  const socket1 = client1.createSocket(USE_SSL, false);
  const socket2 = client2.createSocket(USE_SSL, false);

  console.log('Connecting sockets...');
  await socket1.connect(session1, true);
  await socket2.connect(session2, true);
  console.log('Sockets connected!');

  let matchedCount = 0;

  const onMatched = async (matched) => {
    matchedCount++;
    console.log(`Socket matched callback triggered! MatchID: ${matched.match_id}, Token: ${matched.token}`);
    
    if (matchedCount === 2) {
      console.log('Both matched. Waiting 5 seconds for backend execution/logging...');
      setTimeout(async () => {
        // Disconnect sockets
        socket1.disconnect();
        socket2.disconnect();
        console.log('Sockets disconnected.');
        
        // Query DB for errors
        await queryDB();
        process.exit(0);
      }, 5000);
    }
  };

  socket1.onmatchmakermatched = onMatched;
  socket2.onmatchmakermatched = onMatched;

  console.log('Adding users to matchmaker...');
  const query = '*';
  const minPlayers = 2;
  const maxPlayers = 2;
  const stringProps = {
    matchSize: '2',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
    level: '1'
  };

  const ticket1 = await socket1.addMatchmaker(query, minPlayers, maxPlayers, stringProps);
  const ticket2 = await socket2.addMatchmaker(query, minPlayers, maxPlayers, stringProps);
  console.log(`Matchmaker tickets: User1=${ticket1.ticket}, User2=${ticket2.ticket}`);
  console.log('Waiting for matchmaker matched...');
}

simulate().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
