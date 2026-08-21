const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

// Load .env file manually if process.env vars aren't already set
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ TURSO_DATABASE_URL environment variable is required in .env');
  process.exit(1);
}

const libsql = createClient({ url, authToken: authToken || undefined });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting data import into Turso (libSQL)...');

  const exportPath = path.join(__dirname, '..', 'exported-data.json');
  if (!fs.existsSync(exportPath)) {
    console.error('❌ exported-data.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  const counts = {};

  // Helper for safe row insert with duplicate skip
  async function insertTable(tableName, modelDelegate, items, primaryKey = 'id') {
    let inserted = 0;
    if (!items || items.length === 0) {
      counts[tableName] = 0;
      return;
    }

    for (const item of items) {
      // Format DateTime strings back into Date objects for Prisma
      const parsedItem = { ...item };
      for (const [key, value] of Object.entries(parsedItem)) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          parsedItem[key] = new Date(value);
        }
      }

      try {
        if (primaryKey === 'composite_closure') {
          await modelDelegate.upsert({
            where: {
              ancestor_id_descendant_id: {
                ancestor_id: parsedItem.ancestor_id,
                descendant_id: parsedItem.descendant_id,
              },
            },
            update: parsedItem,
            create: parsedItem,
          });
        } else if (primaryKey === 'key') {
          await modelDelegate.upsert({
            where: { key: parsedItem.key },
            update: parsedItem,
            create: parsedItem,
          });
        } else {
          await modelDelegate.upsert({
            where: { [primaryKey]: parsedItem[primaryKey] },
            update: parsedItem,
            create: parsedItem,
          });
        }
        inserted++;
      } catch (err) {
        console.warn(`⚠️ Skipped or failed row in ${tableName}:`, err.message);
      }
    }
    counts[tableName] = inserted;
  }

  // Import in dependency-safe order
  await insertTable('SystemSetting', prisma.systemSetting, data.SystemSetting, 'key');
  await insertTable('Category', prisma.category, data.Category, 'id');
  await insertTable('Subcategory', prisma.subcategory, data.Subcategory, 'id');
  await insertTable('User', prisma.user, data.User, 'id');
  await insertTable('ReferralClosure', prisma.referralClosure, data.ReferralClosure, 'composite_closure');
  await insertTable('WalletTransaction', prisma.walletTransaction, data.WalletTransaction, 'id');
  await insertTable('Product', prisma.product, data.Product, 'id');
  await insertTable('Order', prisma.order, data.Order, 'id');
  await insertTable('OrderItem', prisma.orderItem, data.OrderItem, 'id');
  await insertTable('PaymentProof', prisma.paymentProof, data.PaymentProof, 'id');
  await insertTable('WithdrawalRequest', prisma.withdrawalRequest, data.WithdrawalRequest, 'id');
  await insertTable('PartnerInvestment', prisma.partnerInvestment, data.PartnerInvestment, 'id');
  await insertTable('PartnerProfitLog', prisma.partnerProfitLog, data.PartnerProfitLog, 'id');
  await insertTable('AuditLog', prisma.auditLog, data.AuditLog, 'id');

  console.log('✅ Data import into Turso completed successfully! Summary:');
  for (const [key, num] of Object.entries(counts)) {
    console.log(`   - ${key}: ${num} inserted / verified`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
