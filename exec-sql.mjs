import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.tlrhwwyctiyxcvezdpms.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '/hzn-#pkKgL3evQ',
  ssl: { rejectUnauthorized: false },
  family: 4  // 强制使用 IPv4
});

async function execSQL() {
  try {
    await client.connect();
    console.log('✅ Connected!');
    
    console.log('📝 Dropping old constraint...');
    await client.query(`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_domain_check`);
    console.log('✅ Old constraint dropped!');
    
    console.log('📝 Creating new constraint...');
    await client.query(`
      ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_domain_check 
      CHECK (domain IN (
        'AI', 'FullStack', 'ChinaPolicy', 'WorldPolitics', 
        'Investment', 'Crypto', 'Product', 'Design', 
        'Productivity', 'Hot', 'Entertainment'
      ))
    `);
    console.log('✅ New constraint created!');
    
    const result = await client.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'subscriptions')
      AND contype = 'c'
    `);
    
    console.log('\n📊 Current constraints:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

execSQL();
