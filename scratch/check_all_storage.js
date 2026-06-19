import pg from 'pg';

const connectionString = 'postgresql://postgres:BuViTqBXxhEsxoeFAGclAMYwgBzHDYRM@thomas.proxy.rlwy.net:42968/railway';

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected!');
    
    const res = await client.query("SELECT collection, key, value, update_time FROM storage LIMIT 100;");
    console.log('Storage rows:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
