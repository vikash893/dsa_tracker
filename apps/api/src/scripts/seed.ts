// ============================================================
// DSATracker API — Seed Script
// Creates the initial Super Admin user if not exists.
// ============================================================

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { Role } from '@dsa-tracker/types';

async function seed(): Promise<void> {
  console.log('🌱 Starting seed...\n');

  await connectDatabase();

  // Check if Super Admin already exists
  const existingSuperAdmin = await User.findOne({ role: Role.SUPER_ADMIN });

  if (existingSuperAdmin) {
    console.log(`ℹ️  Super Admin already exists: ${existingSuperAdmin.email}`);
    console.log('   Skipping seed.\n');
  } else {
    const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

    const superAdmin = await User.create({
      email: env.SUPER_ADMIN_EMAIL,
      passwordHash,
      firstName: env.SUPER_ADMIN_FIRST_NAME,
      lastName: env.SUPER_ADMIN_LAST_NAME,
      displayName: `${env.SUPER_ADMIN_FIRST_NAME} ${env.SUPER_ADMIN_LAST_NAME}`,
      role: Role.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✅ Super Admin created successfully:');
    console.log(`   Email:    ${superAdmin.email}`);
    console.log(`   Name:     ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`   Role:     ${superAdmin.role}`);
    console.log(`   Password: (as configured in .env)\n`);
  }

  // Log database stats
  const userCount = await User.countDocuments();
  console.log(`📊 Database stats:`);
  console.log(`   Users: ${userCount}`);

  await disconnectDatabase();
  console.log('\n🌱 Seed complete.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
