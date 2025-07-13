const pool = require('./config/db.config');

async function verifyCMData() {
  try {
    console.log('Connecting to database...');
    
    // Test the connection first
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully!');
    
    // Query the sdp_cm table
    const result = await pool.query('SELECT id, cm_code, cm_description FROM public.sdp_cm ORDER BY id');
    
    console.log('\n=== CM Data in sdp_cm table ===');
    console.log(`Total records: ${result.rows.length}`);
    console.log('\nFirst 10 records:');
    
    result.rows.slice(0, 10).forEach(row => {
      console.log(`ID: ${row.id}, Code: ${row.cm_code}, Description: ${row.cm_description}`);
    });
    
    if (result.rows.length > 10) {
      console.log(`... and ${result.rows.length - 10} more records`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyCMData(); 