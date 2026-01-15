// Seed test data for manual testing
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/passwordUtils');

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('\n🌱 Seeding test data...\n');

    // Create admin user
    const adminPassword = await hashPassword('Admin@123');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'System Administrator Test',
        email: 'admin@test.com',
        password: adminPassword,
        address: '123 Admin Street, Admin City, AC 12345',
        role: 'SYSTEM_ADMIN',
      },
    });
    console.log('✓ Created admin user: admin@test.com / Admin@123');

    // Create some stores
    const stores = [
      {
        name: 'Tech Electronics Store',
        email: 'tech@electronics.com',
        address: '456 Tech Avenue, Silicon Valley, CA 94025',
      },
      {
        name: 'Book Haven Library Store',
        email: 'info@bookhaven.com',
        address: '789 Reading Road, Book City, BC 67890',
      },
      {
        name: 'Fashion Boutique Central',
        email: 'contact@fashionboutique.com',
        address: '321 Style Street, Fashion District, FD 11223',
      },
      {
        name: 'Gourmet Food Market Place',
        email: 'hello@gourmetfood.com',
        address: '654 Culinary Lane, Food Town, FT 44556',
      },
      {
        name: 'Sports Equipment Warehouse',
        email: 'sales@sportsequipment.com',
        address: '987 Athletic Avenue, Sports City, SC 77889',
      },
    ];

    for (const storeData of stores) {
      await prisma.store.upsert({
        where: { email: storeData.email },
        update: {},
        create: storeData,
      });
      console.log(`✓ Created store: ${storeData.name}`);
    }

    // Create a store owner
    const ownerPassword = await hashPassword('Owner@123');
    const store = await prisma.store.findFirst();
    const owner = await prisma.user.upsert({
      where: { email: 'owner@test.com' },
      update: {},
      create: {
        name: 'Store Owner Test User',
        email: 'owner@test.com',
        password: ownerPassword,
        address: '111 Owner Lane, Owner City, OC 99887',
        role: 'STORE_OWNER',
        storeId: store.id,
      },
    });
    console.log('✓ Created store owner: owner@test.com / Owner@123');

    // Create additional normal users
    const normalPassword = await hashPassword('User@123');
    const normalUsers = [
      {
        name: 'Alice Johnson Normal User',
        email: 'alice@test.com',
        address: '222 Alice Street, User Town, UT 11111',
      },
      {
        name: 'Bob Smith Regular Customer',
        email: 'bob@test.com',
        address: '333 Bob Boulevard, Customer City, CC 22222',
      },
    ];

    for (const userData of normalUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: normalPassword,
          role: 'NORMAL_USER',
        },
      });
      console.log(`✓ Created normal user: ${userData.email} / User@123`);
    }

    console.log('\n✅ Test data seeded successfully!\n');
    console.log('📝 Test Accounts:');
    console.log('   Admin: admin@test.com / Admin@123');
    console.log('   Owner: owner@test.com / Owner@123');
    console.log('   User 1: alice@test.com / User@123');
    console.log('   User 2: bob@test.com / User@123');
    console.log('   Your account: (your email) / (your password)\n');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
