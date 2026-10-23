/**
 * Seed admin invite codes into MongoDB.
 * Usage: node scripts/seedAdminCodes.js SCDP-0001 SCDP-0042 SCDP-0099
 * Or without args to seed the default list below.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdminCode = require('../models/AdminCode');

const DEFAULT_CODES = [
  'SCDP-0001',
  'SCDP-0002',
  'SCDP-0003',
  'SCDP-0010',
  'SCDP-0042',
  'SCDP-0099',
  'SCDP-1000',
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const codes = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_CODES;

  let created = 0, skipped = 0;
  for (const raw of codes) {
    const code = raw.toUpperCase().trim();
    if (!/^SCDP-\d{4}$/.test(code)) {
      console.log(`  SKIP  ${code} — invalid format`);
      skipped++;
      continue;
    }
    try {
      await AdminCode.create({ code });
      console.log(`  ✓  Created ${code}`);
      created++;
    } catch (e) {
      if (e.code === 11000) {
        console.log(`  –  ${code} already exists`);
        skipped++;
      } else {
        console.error(`  ✗  ${code} — ${e.message}`);
      }
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
};

run().catch(err => { console.error(err); process.exit(1); });
