import assert from 'assert';
import http from 'http';

// Light Integration Test runner using Node's native HTTP and assert modules.
// This tests endpoints on a running instance (e.g. localhost:5000)

const runTests = async () => {
  console.log('--- Starting Integration Test Validations ---');

  // Test 1: Healthcheck API
  try {
    http.get('http://localhost:5000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(body.status, 'OK');
        console.log('✅ Test 1: Healthcheck API passed.');
      });
    }).on('error', (err) => {
      console.log('❌ Test 1: Healthcheck API failed (Is the server running on port 5000?)', err.message);
    });
  } catch (err: any) {
    console.log('❌ Test 1: Failed with error:', err.message);
  }

  // Test 2: Categories fetching
  try {
    // We look up for the seeded restaurant first, but since the seed has a dynamic ID, we check the public slug resolver
    http.get('http://localhost:5000/api/restaurants/slug/la-piazza', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(body.restaurant.slug, 'la-piazza');
        console.log('✅ Test 2: Restaurant Slug lookup passed.');
        
        // Chain Category check
        const restId = body.restaurant._id;
        http.get(`http://localhost:5000/api/categories?restaurantId=${restId}`, (resCat) => {
          let catData = '';
          resCat.on('data', chunk => catData += chunk);
          resCat.on('end', () => {
            const catBody = JSON.parse(catData);
            assert.strictEqual(resCat.statusCode, 200);
            assert.ok(catBody.categories.length > 0);
            console.log('✅ Test 3: Restaurant Category listings passed.');
          });
        });
      });
    });
  } catch (err: any) {
    console.log('❌ Test 2/3: Failed with error:', err.message);
  }
};

runTests();
