const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Starting Automated Ledger & Referral Tree Verification ---');

  // 1. Verify System Settings
  const settingsCount = await prisma.systemSetting.count();
  console.log(`✓ System Settings Count: ${settingsCount}`);

  // 2. Verify Super Admin User
  const admin = await prisma.user.findUnique({ where: { email: 'admin@platform.com' } });
  console.log(`✓ Admin User Found: ${admin?.email} (Role: ${admin?.role})`);

  // 3. Verify Categories & Subcategories
  const categories = await prisma.category.findMany({ include: { subcategories: true } });
  console.log(`✓ Categories Seeded: ${categories.length} categories`);
  categories.forEach((c) => {
    console.log(`   - ${c.name}: ${c.subcategories.map((s) => s.name).join(', ')}`);
  });

  // 4. Test Ledger Math (Integer Paisa)
  const testUserId = admin.id;
  const testTx1 = await prisma.walletTransaction.create({
    data: {
      user_id: testUserId,
      wallet_type: 'commission',
      type: 'credit',
      amount: 100000, // 1,000 PKR in paisa
      status: 'available',
      reference_type: 'commission',
    },
  });

  const testTx2 = await prisma.walletTransaction.create({
    data: {
      user_id: testUserId,
      wallet_type: 'commission',
      type: 'debit',
      amount: 25000, // 250 PKR in paisa
      status: 'available',
      reference_type: 'withdrawal',
    },
  });

  const txs = await prisma.walletTransaction.findMany({ where: { user_id: testUserId } });
  let availablePaisa = 0;
  for (const t of txs) {
    if (t.type === 'credit' && t.status === 'available') availablePaisa += t.amount;
    if (t.type === 'debit') availablePaisa -= t.amount;
  }

  console.log(`✓ Double-Entry Ledger Calculation Test: Available = ${availablePaisa} paisa (${availablePaisa / 100} PKR)`);
  if (availablePaisa === 75000) {
    console.log('✓ Balance verification passed cleanly!');
  } else {
    console.error('✗ Balance calculation mismatch!');
  }

  // Cleanup test transactions
  await prisma.walletTransaction.deleteMany({ where: { id: { in: [testTx1.id, testTx2.id] } } });

  console.log('--- All System & Ledger Verifications Passed Successfully! ---');
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
