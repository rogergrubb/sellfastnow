const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sellfastnow';

async function checkSchema() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('🔍 Checking if location columns exist in listings table...\n');
    
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'listings' 
      AND column_name LIKE 'location_%'
      ORDER BY column_name;
    `;
    
    console.log(`Found ${columns.length} location columns:\n`);
    
    const expectedColumns = [
      'location_city',
      'location_country',
      'location_formatted_address',
      'location_geocoded',
      'location_geocoded_at',
      'location_geocoding_accuracy',
      'location_geocoding_service',
      'location_latitude',
      'location_longitude',
      'location_metadata',
      'location_neighborhood',
      'location_place_id',
      'location_postal_code',
      'location_precision_level',
      'location_privacy_radius',
      'location_region',
      'location_street_address',
      'location_timezone'
    ];
    
    columns.forEach(col => {
      console.log(`✓ ${col.column_name} (${col.data_type})`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`Expected: ${expectedColumns.length} columns`);
    console.log(`Found: ${columns.length} columns`);
    
    const missing = expectedColumns.filter(
      expected => !columns.find(col => col.column_name === expected)
    );
    
    if (missing.length > 0) {
      console.log(`\n❌ Missing columns:`);
      missing.forEach(col => console.log(`  - ${col}`));
      process.exit(1);
    } else {
      console.log(`\n✅ All location columns are present!`);
    }
    
    // Also check availability columns
    const availabilityColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'listings' 
      AND column_name LIKE '%_available'
      ORDER BY column_name;
    `;
    
    console.log(`\n📦 Availability columns (${availabilityColumns.length}):`);
    availabilityColumns.forEach(col => {
      console.log(`✓ ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkSchema();
