// Test script to check what the credits API returns
const userId = '9ed23ff1-ec6f-4295-a973-24420523fb2f'; // From console log

// Simulate the database query
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function checkCredits() {
  try {
    const result = await pool.query(
      'SELECT * FROM user_credits WHERE user_id = $1',
      [userId]
    );
    
    console.log('Database result:', JSON.stringify(result.rows, null, 2));
    
    if (result.rows.length > 1) {
      console.error('⚠️ MULTIPLE CREDIT RECORDS FOUND FOR SAME USER!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkCredits();
