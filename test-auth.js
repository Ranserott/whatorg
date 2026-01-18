// Test script to verify authentication
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const hash = process.env.ADMIN_PASSWORD_HASH;
const password = 'admin123';

console.log('Testing authentication...');
console.log('Hash from .env:', hash);
console.log('Testing password:', password);

bcrypt.compare(password, hash).then(result => {
  console.log('Password match:', result);
  if (result) {
    console.log('✅ Authentication should work!');
  } else {
    console.log('❌ Authentication will fail!');
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
