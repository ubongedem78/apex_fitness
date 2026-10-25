require('dotenv').config();
const { sequelize } = require('../models');

const DIALS = [
  '+234', '+233', '+254', '+27', '+20', '+251', '+255', '+256', '+250', '+221',
  '+225', '+237', '+244', '+258', '+260', '+263', '+229', '+226', '+243', '+242',
  '+241', '+224', '+223', '+222', '+265', '+264', '+227', '+249', '+232', '+252',
  '+211', '+228', '+212', '+216', '+213', '+218', '+230', '+44', '+353', '+49',
  '+33', '+39', '+34', '+351', '+31', '+32', '+41', '+43', '+46', '+47', '+45',
  '+358', '+48', '+420', '+40', '+36', '+30', '+1876', '+1868', '+1', '+55', '+52',
  '+54', '+57', '+56', '+971', '+966', '+974', '+965', '+973', '+968', '+972',
  '+91', '+86', '+81', '+82', '+65', '+60', '+63', '+62', '+92', '+880', '+61', '+64',
];
const SORTED_DIALS = [...new Set(DIALS)].sort((a, b) => b.length - a.length);

function normalizePhone(raw) {
  if (!raw) return raw;
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return raw;
  let e164 = '+' + digits;
  const dial = SORTED_DIALS.find((d) => e164.startsWith(d));
  if (dial) {
    const rest = e164.slice(dial.length).replace(/^0+/, '');
    e164 = dial + rest;
  }
  return e164;
}

async function normalizePhones() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const [rows] = await sequelize.query(
      "SELECT id, phone FROM users WHERE phone IS NOT NULL AND phone <> ''"
    );

    const targets = rows
      .map((r) => ({ id: r.id, phone: r.phone, next: normalizePhone(r.phone) }))
      .filter((r) => r.next && r.next !== r.phone);

    if (targets.length === 0) {
      console.log('All phone numbers are already normalized. Nothing to do.');
      process.exit(0);
    }

    console.log(`Found ${targets.length} phone number(s) to normalize.`);

    const ownersByPhone = new Map();
    for (const r of rows) {
      const n = normalizePhone(r.phone);
      if (!ownersByPhone.has(n)) ownersByPhone.set(n, []);
      ownersByPhone.get(n).push(r.id);
    }

    let updated = 0;
    const collisions = [];
    for (const t of targets) {
      const owners = ownersByPhone.get(t.next) || [];
      if (owners.some((id) => id !== t.id)) {
        collisions.push(`${t.phone} -> ${t.next}`);
        continue;
      }
      await sequelize.query('UPDATE users SET phone = :next WHERE id = :id', {
        replacements: { next: t.next, id: t.id },
      });
      console.log(`  ${t.phone}  ->  ${t.next}`);
      updated++;
    }

    console.log(`Updated ${updated} phone number(s).`);

    if (collisions.length > 0) {
      console.log('\nSKIPPED - a different account already uses the normalized number:');
      collisions.forEach((c) => console.log(`  ${c}`));
      console.log('Resolve these duplicates manually, then re-run.');
    }

    console.log('Phone normalization complete');
    process.exit(0);
  } catch (err) {
    console.error('Phone normalization failed:', err.message);
    process.exit(1);
  }
}

normalizePhones();
