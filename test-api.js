/**
 * Test the optimized location API endpoints
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testLocationAPI() {
  console.log('🧪 Testing Optimized Location API\n');

  try {
    // Test 1: Get all cities
    console.log('1️⃣ Testing GET /api/locations/cities');
    const citiesResponse = await axios.get(`${BASE_URL}/api/locations/cities`);
    console.log(`   Status: ${citiesResponse.status}`);
    console.log(`   Cities count: ${citiesResponse.data.data.length}`);
    console.log(`   Sample cities: ${citiesResponse.data.data.slice(0, 3).map(c => c.name).join(', ')}\n`);

    // Test 2: Search for Damascus
    console.log('2️⃣ Testing GET /api/locations/search?q=دمشق');
    const searchResponse = await axios.get(`${BASE_URL}/api/locations/search?q=دمشق&limit=5`);
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Results count: ${searchResponse.data.data.length}`);
    console.log(`   Source: ${searchResponse.data.source}`);
    if (searchResponse.data.stats) {
      console.log(`   Stats: ${JSON.stringify(searchResponse.data.stats)}`);
    }
    searchResponse.data.data.forEach((result, i) => {
      console.log(`   ${i + 1}. ${result.display_name}`);
    });
    console.log();

    // Test 3: Search for neighborhood
    console.log('3️⃣ Testing GET /api/locations/search?q=الميدان');
    const neighborhoodResponse = await axios.get(`${BASE_URL}/api/locations/search?q=الميدان&limit=3`);
    console.log(`   Status: ${neighborhoodResponse.status}`);
    console.log(`   Results count: ${neighborhoodResponse.data.data.length}`);
    neighborhoodResponse.data.data.forEach((result, i) => {
      console.log(`   ${i + 1}. ${result.display_name}`);
    });
    console.log();

    // Test 4: Nearby cities (Damascus center)
    console.log('4️⃣ Testing GET /api/locations/nearby-cities');
    const nearbyResponse = await axios.get(`${BASE_URL}/api/locations/nearby-cities?lat=33.5138&lng=36.2765&radiusKm=20&limit=5`);
    console.log(`   Status: ${nearbyResponse.status}`);
    console.log(`   Nearby cities: ${nearbyResponse.data.data.cities.length}`);
    nearbyResponse.data.data.cities.forEach((city, i) => {
      console.log(`   ${i + 1}. ${city.name} (${city.distance?.toFixed(1)}km)`);
    });

    console.log('\n✅ All API tests completed successfully!');
    console.log('🚀 The optimized location service is working correctly');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
testLocationAPI();
