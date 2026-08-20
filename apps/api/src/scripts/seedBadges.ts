// ============================================================
// DSATracker API — Badge Seed Script
// Populates default badges for the gamification system.
// ============================================================

import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { Badge } from '../models/RemainingModels.js';

const DEFAULT_BADGES = [
  { name: 'First Blood', slug: 'first-blood', description: 'Solve your first problem', icon: '🩸', category: 'milestone', criteria: { type: 'solved_count', value: 1 }, xpReward: 10 },
  { name: 'Tenacious Ten', slug: 'tenacious-ten', description: 'Solve 10 problems', icon: '🔟', category: 'milestone', criteria: { type: 'solved_count', value: 10 }, xpReward: 25 },
  { name: 'Half Century', slug: 'half-century', description: 'Solve 50 problems', icon: '🏅', category: 'milestone', criteria: { type: 'solved_count', value: 50 }, xpReward: 50 },
  { name: 'Century Club', slug: 'century-club', description: 'Solve 100 problems', icon: '💯', category: 'milestone', criteria: { type: 'solved_count', value: 100 }, xpReward: 100 },
  { name: 'Streak Starter', slug: 'streak-starter', description: 'Maintain a 3-day streak', icon: '🔥', category: 'streak', criteria: { type: 'streak', value: 3 }, xpReward: 15 },
  { name: 'Streak Master', slug: 'streak-master', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', criteria: { type: 'streak', value: 7 }, xpReward: 30 },
  { name: 'Streak Legend', slug: 'streak-legend', description: 'Maintain a 30-day streak', icon: '⚡', category: 'streak', criteria: { type: 'streak', value: 30 }, xpReward: 100 },
  { name: 'Speed Demon', slug: 'speed-demon', description: 'Solve a medium problem in under 10 minutes', icon: '⚡', category: 'speed', criteria: { type: 'speed', difficulty: 'MEDIUM', maxMinutes: 10 }, xpReward: 20 },
  { name: 'Easy Peasy', slug: 'easy-peasy', description: 'Solve 25 easy problems', icon: '🟢', category: 'difficulty', criteria: { type: 'difficulty_count', difficulty: 'EASY', value: 25 }, xpReward: 20 },
  { name: 'Medium Rare', slug: 'medium-rare', description: 'Solve 25 medium problems', icon: '🟡', category: 'difficulty', criteria: { type: 'difficulty_count', difficulty: 'MEDIUM', value: 25 }, xpReward: 40 },
  { name: 'Hard Core', slug: 'hard-core', description: 'Solve 10 hard problems', icon: '🔴', category: 'difficulty', criteria: { type: 'difficulty_count', difficulty: 'HARD', value: 10 }, xpReward: 60 },
  { name: 'Topic Explorer', slug: 'topic-explorer', description: 'Solve problems in 5 different topics', icon: '🗺️', category: 'exploration', criteria: { type: 'topic_count', value: 5 }, xpReward: 25 },
  { name: 'Sharp Shooter', slug: 'sharp-shooter', description: 'Maintain 90%+ accuracy over 20 submissions', icon: '🎯', category: 'accuracy', criteria: { type: 'accuracy', minPercent: 90, minSubmissions: 20 }, xpReward: 30 },
  { name: 'Night Owl', slug: 'night-owl', description: 'Solve a problem between midnight and 5 AM', icon: '🦉', category: 'special', criteria: { type: 'time_of_day', startHour: 0, endHour: 5 }, xpReward: 15 },
  { name: 'Early Bird', slug: 'early-bird', description: 'Solve a problem between 5 AM and 7 AM', icon: '🐦', category: 'special', criteria: { type: 'time_of_day', startHour: 5, endHour: 7 }, xpReward: 15 },
];

async function seedBadges() {
  console.log('🎖️  Seeding badges...\n');

  await connectDatabase();

  let created = 0;
  let existing = 0;

  for (const badge of DEFAULT_BADGES) {
    const exists = await Badge.findOne({ slug: badge.slug });
    if (exists) {
      existing++;
      continue;
    }
    await Badge.create(badge);
    created++;
  }

  console.log(`✅ Badges seeded: ${created} created, ${existing} already existed`);
  console.log(`📊 Total badges: ${await Badge.countDocuments()}`);

  await mongoose.disconnect();
  console.log('\n🎖️  Badge seed complete.');
}

seedBadges().catch((err) => {
  console.error('❌ Badge seed failed:', err);
  process.exit(1);
});
