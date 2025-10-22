import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { listings } from './shared/schema.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:PFBReUdvWVYAzKWptvxtoNaEodyiMKqh@postgres.railway.internal:5432/railway';

async function clearAllListings() {
  console.log('🔌 Connecting to database...');
  
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    console.log('🗑️  Deleting all listings...');
    
    const result = await db.delete(listings);
    
    console.log('✅ All listings deleted successfully!');
    console.log('📊 Database is now clean and ready for fresh listings');
    
  } catch (error) {
    console.error('❌ Error deleting listings:', error);
    throw error;
  } finally {
    await client.end();
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

