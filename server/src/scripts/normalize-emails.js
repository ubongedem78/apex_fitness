require('dotenv').config();
const { sequelize } = require('../models');

async function normalizeEmails() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const [rows] = await sequelize.query(
      'SELECT id, email FROM users WHERE email <> lower(email)'
    );

    if (rows.length === 0) {
      console.log('All emails are already lowercase. Nothing to do.');
      process.exit(0);
    }

    console.log(`Found ${rows.length} email(s) with uppercase characters.`);

    const [allRows] = await sequelize.query('SELECT id, lower(email) AS le FROM users');
    const ownersByLower = new Map();
    for (const r of allRows) {
      if (!ownersByLower.has(r.le)) ownersByLower.set(r.le, []);
      ownersByLower.get(r.le).push(r.id);
    }

    let updated = 0;
    const collisions = [];
    for (const row of rows) {
      const lower = row.email.toLowerCase();
      const owners = ownersByLower.get(lower) || [];
      const conflictsWithAnotherRow = owners.some((id) => id !== row.id);

      if (conflictsWithAnotherRow) {
        collisions.push(row.email);
        continue;
      }

      await sequelize.query('UPDATE users SET email = :lower WHERE id = :id', {
        replacements: { lower, id: row.id },
      });
      updated++;
    }

    console.log(`Updated ${updated} email(s) to lowercase.`);

    if (collisions.length > 0) {
      console.log('\nSKIPPED - a different account already uses the lowercase form:');
      collisions.forEach((e) => console.log(`  ${e}`));
      console.log('Resolve these duplicates manually (merge or delete one), then re-run.');
    }

    console.log('Email normalization complete');
    process.exit(0);
  } catch (err) {
    console.error('Email normalization failed:', err.message);
    process.exit(1);
  }
}

normalizeEmails();
