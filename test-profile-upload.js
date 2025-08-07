import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'daryannabo16@gmail.com';
const TEST_PASSWORD = '123321Dn';

async function testProfilePictureFlow() {
  console.log('🚀 Starting profile picture upload test...\n');

  try {
    // Step 1: Login to get access token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.error);
    }

    const accessToken = loginData.data.tokens.accessToken;
    const userId = loginData.data.user.id;
    console.log('✅ Login successful. User ID:', userId);
    console.log('📄 Current profile picture:', loginData.data.user.profilePicture || 'None');

    // Step 2: Create a test image file
    console.log('\n2️⃣ Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Create a simple test image (1x1 pixel JPEG)
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x28,
      0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('✅ Test image created:', testImagePath);

    // Step 3: Upload profile picture
    console.log('\n3️⃣ Uploading profile picture...');
    const formData = new FormData();
    formData.append('name', 'Darian Test');
    formData.append('username', 'daryannabo16');
    formData.append('bio', 'Test bio');
    formData.append('phone', '123456789');
    formData.append('street', 'Test Street');
    formData.append('city', 'Test City');
    formData.append('profilePicture', fs.createReadStream(testImagePath), {
      filename: 'test-profile.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

    const uploadData = await uploadResponse.text();
    console.log('Upload response body:', uploadData);

    let parsedUploadData;
    try {
      parsedUploadData = JSON.parse(uploadData);
      console.log('✅ Upload response parsed:', parsedUploadData);
    } catch (e) {
      console.log('❌ Failed to parse upload response as JSON');
      throw new Error('Invalid JSON response from upload');
    }

    // Step 4: Fetch updated profile to verify
    console.log('\n4️⃣ Fetching updated profile...');
    const profileResponse = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const profileData = await profileResponse.json();
    console.log('Profile fetch response:', profileData);

    if (profileData.success && profileData.data.profilePicture) {
      console.log('✅ Profile picture URL found:', profileData.data.profilePicture);
      
      // Step 5: Test if the image URL is accessible
      console.log('\n5️⃣ Testing image URL accessibility...');
      try {
        const imageResponse = await fetch(profileData.data.profilePicture);
        console.log('Image URL status:', imageResponse.status);
        console.log('Image URL headers:', Object.fromEntries(imageResponse.headers.entries()));
        
        if (imageResponse.status === 200) {
          console.log('✅ Image is accessible from the URL!');
        } else {
          console.log('❌ Image URL returned status:', imageResponse.status);
        }
      } catch (imageError) {
        console.log('❌ Error accessing image URL:', imageError.message);
      }
    } else {
      console.log('❌ No profile picture found in updated profile');
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 Cleaned up test image file');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testProfilePictureFlow();
