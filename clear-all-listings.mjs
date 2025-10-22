import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:PFBReUdvWVYAzKWptvxtoNaEodyiMKqh@postgres.railway.internal:5432/railway';

async function clearAllListings() {
  console.log('🔌 Connecting to database...');
  
  const sql = postgres(DATABASE_URL);

  try {
    console.log('🗑️  Deleting all listings...');
    
    const result = await sql`DELETE FROM listings`;
    
    console.log(`✅ Deleted ${result.count} listings successfully!`);
    console.log('📊 Database is now clean and ready for fresh listings');
    
  } catch (error) {
    console.error('❌ Error deleting listings:', error);
    throw error;
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

clearAllListings()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

