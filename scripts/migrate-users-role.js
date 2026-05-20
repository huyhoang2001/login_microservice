import fs from 'fs/promises';
import path from 'path';

const usersPath = path.resolve('./backend/data/users.json');

async function migrateUsersRole() {
  try {
    console.log('Reading users.json...');
    const raw = await fs.readFile(usersPath, 'utf-8');
    const users = JSON.parse(raw);

    console.log(`Found ${users.length} users`);

    let updated = 0;
    const migratedUsers = users.map(user => {
      if (!user.role) {
        console.log(`Adding role to ${user.email}...`);
        updated++;
        return { ...user, role: 'user' };
      }
      return user;
    });

    if (updated > 0) {
      await fs.writeFile(usersPath, JSON.stringify(migratedUsers, null, 2) + '\n', 'utf-8');
      console.log(`✅ Migration complete! Updated ${updated} users.`);
    } else {
      console.log('✅ All users already have role field.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUsersRole();
