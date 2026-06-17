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
    console.log('Connected to database successfully!');
    
    // Check if storage table exists and query it
    // Check tables in public schema
    const tablesRes = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
    console.log('Tables:', tablesRes.rows);
    
    // Check debug errors in storage table
    try {
      const storageRes = await client.query("SELECT collection, key, value, update_time FROM storage WHERE collection = 'debug' ORDER BY update_time DESC;");
      console.log('Debug errors in DB:', storageRes.rows);
    } catch (e) {
      console.log('Error querying storage:', e.message);
    }
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

main();
