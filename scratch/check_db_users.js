import pg from 'pg';

const connectionString = 'postgresql://postgres:BuViTqBXxhEsxoeFAGclAMYwgBzHDYRM@thomas.proxy.rlwy.net:42968/railway';

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const countRes = await client.query("SELECT COUNT(*) FROM users;");
    console.log('Total users:', countRes.rows[0].count);
    const res = await client.query("SELECT id, username, create_time FROM users ORDER BY create_time DESC LIMIT 10;");
    console.log('Recent Users:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
