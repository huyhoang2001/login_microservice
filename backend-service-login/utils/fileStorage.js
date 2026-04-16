const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory');
  }
};

// Ensure users.json exists
const ensureUsersFile = async () => {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, '[]', 'utf8');
    console.log('📄 Created users.json file');
  }
};

// Read users from JSON file
const readUsers = async () => {
  try {
    await ensureDataDir();
    await ensureUsersFile();
    
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    console.log(`📖 Loaded ${users.length} users from file`);
    return users;
  } catch (error) {
    console.error('❌ Error reading users:', error.message);
    return [];
  }
};

// Write users to JSON file
const writeUsers = async (users) => {
  try {
    await ensureDataDir();
    
    const data = JSON.stringify(users, null, 2);
    await fs.writeFile(USERS_FILE, data, 'utf8');
    console.log(`💾 Saved ${users.length} users to file`);
    return true;
  } catch (error) {
    console.error('❌ Error writing users:', error.message);
    return false;
  }
};

// Add user to JSON file
const addUser = async (user) => {
  try {
    const users = await readUsers();
    users.push(user);
    await writeUsers(users);
    console.log(`➕ Added user: ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error adding user:', error.message);
    return false;
  }
};

// Find user by email
const findUserByEmail = async (email) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    console.log(`🔍 User search for ${email}: ${user ? 'Found' : 'Not found'}`);
    return user;
  } catch (error) {
    console.error('❌ Error finding user:', error.message);
    return null;
  }
};

// Check if email exists
const emailExists = async (email) => {
  const user = await findUserByEmail(email);
  return !!user;
};

// Get users count
const getUsersCount = async () => {
  try {
    const users = await readUsers();
    return users.length;
  } catch (error) {
    console.error('❌ Error getting users count:', error.message);
    return 0;
  }
};

module.exports = {
  readUsers,
  writeUsers,
  addUser,
  findUserByEmail,
  emailExists,
  getUsersCount
};