import pg from 'pg';

const connectionString = 'postgresql://postgres:BuViTqBXxhEsxoeFAGclAMYwgBzHDYRM@thomas.proxy.rlwy.net:42968/railway';

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log("Listing tables in the database:");
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(tablesRes.rows.map(r => r.table_name));

    // Look for migration or schema version tables
    console.log("\nChecking schema migration info:");
    const migrationRes = await client.query("SELECT * FROM migration_info LIMIT 20;").catch(e => e.message);
    if (typeof migrationRes === 'string') {
      console.log("Failed to query migration_info:", migrationRes);
    } else {
      console.log(migrationRes.rows);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
