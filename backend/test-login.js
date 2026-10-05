const User = require('./models/User');

async function testLogin(email, password) {
  const user = await User.findByEmail(email);
  if (!user) {
    console.log(`❌ User NOT found: ${email}`);
    return;
  }
  const valid = await User.verifyPassword(password, user.password);
  if (valid) {
    console.log(`✅ SUCCESS login for ${email} (${user.role}) - ID: ${user.id}, Name: ${user.name}`);
  } else {
    console.log(`❌ INVALID password for ${email}`);
  }
}

async function testAll() {
  console.log('--- Testing requested logins ---');
  await testLogin('admin@academic.com', 'admin123');
  await testLogin('faculty@academic.com', 'faculty123');
  await testLogin('student@academic.com', 'student123');
  await testLogin('alice@student.com', 'student123');
  await testLogin('bob@student.com', 'student123');
  await testLogin('charlie@student.com', 'student123');
  await testLogin('diana@student.com', 'student123');
  await testLogin('edward@student.com', 'student123');
  await testLogin('fiona@student.com', 'student123');
  await testLogin('john@student.com', 'student123');
  await testLogin('jane@student.com', 'student123');
}

testAll();
