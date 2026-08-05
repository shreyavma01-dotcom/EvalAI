/**
 * Seed script — creates the admin account directly in the database.
 * Usage: npm run seed:admin  (or: node scripts/seed-admin.js)
 * Admin accounts are intentionally NOT creatable through the public API.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const { MONGO_URI } = require('../src/config/env');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@evalai.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Admin';

async function seedAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing user ${ADMIN_EMAIL} to admin.`);
    } else {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Admin created: ${ADMIN_EMAIL} (password is the ADMIN_PASSWORD env or Admin@123456).`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedAdmin().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});