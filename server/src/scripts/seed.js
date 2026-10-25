require('dotenv').config();
const crypto = require('crypto');
const { sequelize, User, Location, MembershipPlan, PTPlan } = require('../models');
const { ensureDefaults } = require('../services/settingService');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@apexfitness.ng';

const resolveSeedPassword = (envVar) => {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 8) return { password: fromEnv, generated: false };
  const generated = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  return { password: generated, generated: true };
};

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const generatedCreds = [];

    await ensureDefaults();
    console.log('App settings ready');

    const existingLocations = await Location.findAll({ order: [['createdAt', 'ASC']] });
    const seenLocationNames = new Set();
    for (const loc of existingLocations) {
      if (seenLocationNames.has(loc.name)) {
        await loc.destroy();
      } else {
        seenLocationNames.add(loc.name);
      }
    }

    const locationDefs = [
      {
        name: 'Lekki Phase 1',
        address: '45 Admiralty Way',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+234 801 000 0002',
        email: 'lekki@apexfitness.ng',
        openingHours: 'Mon–Sat: 5am–11pm · Sun: 7am–9pm',
        amenities: ['Spin Studio', 'Parking', 'Lockers', 'Showers'],
        isActive: true,
        capacity: 150,
      },
    ];

    let locationCount = 0;
    for (const def of locationDefs) {
      const [, wasCreated] = await Location.findOrCreate({ where: { name: def.name }, defaults: def });
      if (wasCreated) locationCount++;
    }

    console.log(`Locations ready (${locationCount} created, rest already existed)`);

    const existingPlans = await MembershipPlan.findAll({ order: [['createdAt', 'ASC']] });
    const seenPlanNames = new Set();
    for (const p of existingPlans) {
      if (seenPlanNames.has(p.name)) {
        await p.destroy();
      } else {
        seenPlanNames.add(p.name);
      }
    }

    const planDefs = [
      {
        name: 'Monthly Plan',
        description: 'Flexible month-to-month membership with full gym access.',
        price: 30750,
        billingCycle: 'monthly',
        classLimit: null,
        locationAccess: 'all',
        features: ['Unlimited classes', 'All locations access', 'Locker room access', 'Priority booking'],
        isActive: true,
        isDailyPass: false,
        joiningFee: 15100,
        sortOrder: 1,
      },
      {
        name: 'Quarterly Plan',
        description: 'Commit for three months and save on your membership.',
        price: 80450,
        billingCycle: 'monthly',
        classLimit: null,
        locationAccess: 'all',
        features: ['Unlimited classes', 'All locations access', 'Locker room access', 'Guest pass (1/month)', 'Priority booking'],
        isActive: true,
        isDailyPass: false,
        joiningFee: 15100,
        sortOrder: 2,
      },
      {
        name: 'Annual Plan',
        description: 'Best value for serious athletes - one year, maximum savings.',
        price: 305800,
        billingCycle: 'annual',
        classLimit: null,
        locationAccess: 'all',
        features: ['Unlimited classes', 'All locations access', 'Personal trainer session (monthly)', 'Guest passes (4/month)', 'Towel service', 'Locker included', 'Priority booking'],
        isActive: true,
        isDailyPass: false,
        joiningFee: 15100,
        sortOrder: 3,
      },
    ];

    let planCount = 0;
    for (const def of planDefs) {

      const [, wasCreated] = await MembershipPlan.findOrCreate({ where: { name: def.name }, defaults: def });
      if (wasCreated) planCount++;
    }

    console.log(`Membership plans ready (${planCount} created, rest already existed)`);

    const ptPlanDefs = [
      { name: 'Generic 12',   sessions: 12, price: 18900, description: '12 sessions with an available certified trainer.', sortOrder: 1 },
      { name: 'Generic 16',   sessions: 16, price: 25200, description: '16 sessions with an available certified trainer.', sortOrder: 2 },
      { name: 'Generic 20',   sessions: 20, price: 31500, description: '20 sessions with an available certified trainer.', sortOrder: 3 },
      { name: 'Exclusive 12', sessions: 12, price: 50885, description: '12 sessions with your own dedicated trainer.', sortOrder: 4 },
      { name: 'Exclusive 16', sessions: 16, price: 71180, description: '16 sessions with your own dedicated trainer.', sortOrder: 5 },
      { name: 'Exclusive 20', sessions: 20, price: 91475, description: '20 sessions with your own dedicated trainer.', sortOrder: 6 },
    ];
    let ptPlanCount = 0;
    for (const def of ptPlanDefs) {
      const [, wasCreated] = await PTPlan.findOrCreate({ where: { name: def.name }, defaults: def });
      if (wasCreated) ptPlanCount++;
    }
    console.log(`PT plans ready (${ptPlanCount} created, rest already existed)`);

    const adminCred = resolveSeedPassword('SEED_ADMIN_PASSWORD');
    const [, adminCreated] = await User.findOrCreate({
      where: { email: ADMIN_EMAIL },
      defaults: {
        firstName:    'Apex',
        lastName:     'Admin',
        email:        ADMIN_EMAIL,
        passwordHash: adminCred.password,
        role:         'admin',
        isActive:     true,
        phone:        null,
      },
    });
    if (adminCreated && adminCred.generated) generatedCreds.push(`  ${ADMIN_EMAIL}: ${adminCred.password}`);
    console.log(adminCreated
      ? `Admin user created: ${ADMIN_EMAIL}`
      : 'Admin user already exists');

    const managerCred = resolveSeedPassword('SEED_MANAGER_PASSWORD');
    const [, managerCreated] = await User.findOrCreate({
      where: { email: 'manager@apexfitness.ng' },
      defaults: {
        firstName:    'Apex',
        lastName:     'Manager',
        email:        'manager@apexfitness.ng',
        passwordHash: managerCred.password,
        role:         'manager',
        isActive:     true,
        phone:        null,
      },
    });
    if (managerCreated && managerCred.generated) generatedCreds.push(`  manager@apexfitness.ng: ${managerCred.password}`);
    console.log(managerCreated
      ? 'Manager user created: manager@apexfitness.ng'
      : 'Manager user already exists');

    const receptionistCred = resolveSeedPassword('SEED_RECEPTIONIST_PASSWORD');
    const [, receptionistCreated] = await User.findOrCreate({
      where: { email: 'receptionist@apexfitness.ng' },
      defaults: {
        firstName:    'Desk',
        lastName:     'Staff',
        email:        'receptionist@apexfitness.ng',
        passwordHash: receptionistCred.password,
        role:         'receptionist',
        isActive:     true,
        phone:        null,
      },
    });
    if (receptionistCreated && receptionistCred.generated) generatedCreds.push(`  receptionist@apexfitness.ng: ${receptionistCred.password}`);
    console.log(receptionistCreated
      ? 'Receptionist created: receptionist@apexfitness.ng'
      : 'Receptionist already exists');

    const staffDefs = [
      {
        firstName: 'Micheal',
        lastName:  'Focus',
        email:     'michealfocus13@gmail.com',
        phone:     '+2349096636284',
        role:      'manager',
        passwordEnv: 'SEED_MICHEAL_PASSWORD',
      },
      {
        firstName: 'Victory',
        lastName:  'Godson',
        email:     'victorygodson47@gmail.com',
        phone:     '+2348068612122',
        role:      'receptionist',
        passwordEnv: 'SEED_VICTORY_PASSWORD',
      },
    ];

    for (const def of staffDefs) {
      const cred = resolveSeedPassword(def.passwordEnv);
      const [, created] = await User.findOrCreate({
        where: { email: def.email },
        defaults: {
          firstName:    def.firstName,
          lastName:     def.lastName,
          email:        def.email,
          phone:        def.phone,
          passwordHash: cred.password,
          role:         def.role,
          isActive:     true,
        },
      });
      if (created && cred.generated) generatedCreds.push(`  ${def.email} (${def.role}): ${cred.password}`);
      console.log(created
        ? `${def.role} created: ${def.email}`
        : `${def.role} already exists: ${def.email}`);
    }

    if (generatedCreds.length > 0) {
      console.log('\n---------------------------------------------');
      console.log('Generated seed credentials (shown once - save now):');
      console.log(generatedCreds.join('\n'));
      console.log('Set SEED_ADMIN_PASSWORD / SEED_RECEPTIONIST_PASSWORD to choose your own.');
      console.log('---------------------------------------------\n');
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
