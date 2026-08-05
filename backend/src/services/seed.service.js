const User = require('../models/User.model');
const logger = require('../utils/logger');

/**
 * Demo accounts for local development and testing. Passwords are hashed by
 * the User model's bcrypt pre-save hook — plain text is never persisted.
 */
const DEMO_USERS = [
  { name: 'Demo Teacher', email: 'teacher@evalai.com', password: 'Teacher@123', role: 'teacher' },
  { name: 'Demo Student', email: 'student@evalai.com', password: 'Student@123', role: 'student' },
];

/**
 * Creates the demo accounts if they do not exist yet. Idempotent — users that
 * already exist (matched by email) are left untouched, so running the server
 * repeatedly never produces duplicates.
 */
async function seedDemoUsers() {
  let created = 0;
  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    if (existing) continue;
    await User.create({
      name: demo.name,
      email: demo.email,
      password: demo.password,
      role: demo.role,
    });
    created += 1;
    logger.info(`Seeded demo ${demo.role} account: ${demo.email}`);
  }
  if (created === 0) logger.info('Demo users already exist — seeding skipped.');
  return created;
}

module.exports = { seedDemoUsers, DEMO_USERS };