/* TEMPORARY validation fixture — creates a default-theme (no custom
   branding) restaurant with sample data, prints its id, and can remove
   everything again with --cleanup <ownerId>. Deleted after validation. */
require('dotenv').config();
const mongoose = require('mongoose');

const mode = process.argv[2]; // 'create' | 'cleanup'
const argId = process.argv[3];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  if (mode === 'cleanup') {
    const oid = new mongoose.Types.ObjectId(argId);
    await db.collection('users').deleteMany({ email: 'tmp-theme-test@example.com' });
    await db.collection('categories').deleteMany({ owner: oid });
    await db.collection('menuitems').deleteMany({ owner: oid });
    console.log('cleaned', argId);
    process.exit(0);
    return;
  }

  const { insertedId } = await db.collection('users').insertOne({
    email: 'tmp-theme-test@example.com',
    password: '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin',
    restaurantName: 'TMP Default Theme Test',
    role: 'restaurant_admin',
    isActive: true
    /* no branding on purpose — getEffectiveBranding serves the platform defaults */
  });
  const owner = insertedId;

  const catA = (await db.collection('categories').insertOne({
    name: 'Mains', description: 'Test mains', owner, isActive: true
  })).insertedId;
  const catB = (await db.collection('categories').insertOne({
    name: 'Drinks', description: '', owner, isActive: true
  })).insertedId;

  await db.collection('menuitems').insertMany([
    { name: 'Test Kebab', description: 'Grilled dish', price: 120000, category: catA, owner, isAvailable: true, isPopular: true, isSpicy: true, preparationTime: 15, allergens: [] },
    { name: 'Test Salad', description: 'Fresh greens', price: 45000, category: catA, owner, isAvailable: true, isVegetarian: true, preparationTime: 5, allergens: [] },
    { name: 'Doogh', description: 'Yoghurt drink', price: 20000, category: catB, owner, isAvailable: true, preparationTime: 2, allergens: ['milk'] }
  ]);

  console.log('OWNER_ID=' + owner.toString());
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
