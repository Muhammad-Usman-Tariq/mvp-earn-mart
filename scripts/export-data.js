const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Starting data export from local SQLite (dev.db)...');

  const data = {};

  // Dependency order
  data.SystemSetting = await prisma.systemSetting.findMany();
  data.Category = await prisma.category.findMany();
  data.Subcategory = await prisma.subcategory.findMany();
  data.User = await prisma.user.findMany();
  data.ReferralClosure = await prisma.referralClosure.findMany();
  data.WalletTransaction = await prisma.walletTransaction.findMany();
  data.Product = await prisma.product.findMany();
  data.Order = await prisma.order.findMany();
  data.OrderItem = await prisma.orderItem.findMany();
  data.PaymentProof = await prisma.paymentProof.findMany();
  data.WithdrawalRequest = await prisma.withdrawalRequest.findMany();
  data.PartnerInvestment = await prisma.partnerInvestment.findMany();
  data.PartnerProfitLog = await prisma.partnerProfitLog.findMany();
  data.AuditLog = await prisma.auditLog.findMany();

  const exportPath = path.join(__dirname, '..', 'exported-data.json');
  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf8');

  console.log('✅ Data export completed. Summary:');
  for (const [key, rows] of Object.entries(data)) {
    console.log(`   - ${key}: ${rows.length} rows`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Export failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
