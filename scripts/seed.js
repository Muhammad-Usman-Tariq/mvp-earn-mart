const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // ── 1. System Settings ───────────────────────────────────────────
  const settings = [
    { key: 'withdrawal_fee_percent',  value: '5',                              description: 'Withdrawal processing fee (%)' },
    { key: 'min_withdrawal_paisa',    value: '50000',                           description: 'Min withdrawal amount in paisa (PKR 500)' },
    { key: 'max_withdrawal_paisa',    value: '10000000',                        description: 'Max withdrawal amount in paisa (PKR 100,000)' },
    { key: 'return_window_days',      value: '14',                              description: 'Return/dispute window in days' },
    { key: 'jazzcash_account_no',     value: '0300-1234567',                    description: 'Company JazzCash number' },
    { key: 'easypaisa_account_no',    value: '0311-1234567',                    description: 'Company EasyPaisa number' },
    { key: 'bank_name',               value: 'Meezan Bank',                     description: 'Company bank name' },
    { key: 'bank_iban',               value: 'PK36MEZN0001234567890123',         description: 'Company IBAN' },
    { key: 'crypto_wallet_address',   value: 'TN3W4T4DGvNuvMnK...USDT-TRC20',  description: 'Company USDT wallet address' },
    { key: 'partner_weekly_rate',     value: '0.02',                            description: 'Partner program weekly profit rate (2%)' },
    { key: 'commission_l1',           value: '0.10',                            description: 'Level 1 commission rate (10%)' },
    { key: 'commission_l2',           value: '0.05',                            description: 'Level 2 commission rate (5%)' },
    { key: 'commission_l3',           value: '0.03',                            description: 'Level 3 commission rate (3%)' },
    { key: 'commission_l4',           value: '0.02',                            description: 'Level 4 commission rate (2%)' },
    { key: 'commission_l5',           value: '0.01',                            description: 'Level 5 commission rate (1%)' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log('✅ System settings seeded');

  // ── 2. Categories & Subcategories ───────────────────────────────
  const categoriesData = [
    { name: 'Gents Cloth',        slug: 'gents-cloth',        description: 'Premium menswear apparel',         subcategories: ['Shirts', 'Kurtas', 'Trousers', 'Jackets'] },
    { name: 'Ladies Cloth',       slug: 'ladies-cloth',       description: 'Trendy womenswear apparel',        subcategories: ['Kameez', 'Dupatta', 'Lawn', 'Formal'] },
    { name: 'Mobile Accessories', slug: 'mobile-accessories', description: 'Chargers, earbuds, covers & more', subcategories: ['Chargers', 'Earbuds', 'Cases', 'Screen Guards'] },
    { name: 'Herbal Products',    slug: 'herbal-products',    description: 'Natural skincare & supplements',   subcategories: ['Skincare', 'Supplements', 'Hair Care'] },
    { name: 'Watches',            slug: 'watches',            description: 'Gents & ladies timepieces',       subcategories: ['Gents', 'Ladies', 'Smart Watches'] },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    categoryMap[cat.slug] = { id: category.id, subcats: {} };

    for (const subName of cat.subcategories) {
      const subSlug = `${cat.slug}-${subName.toLowerCase().replace(/\s+/g, '-')}`;
      const sub = await prisma.subcategory.upsert({
        where: { category_id_name: { category_id: category.id, name: subName } },
        update: { slug: subSlug },
        create: { category_id: category.id, name: subName, slug: subSlug },
      });
      categoryMap[cat.slug].subcats[subName] = sub.id;
    }
  }
  console.log('✅ Categories & subcategories seeded');

  // ── 3. Admin User ────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: { role: 'admin', admin_role: 'super_admin', is_verified: true, profile_completed: true, name: 'Super Admin', password_hash: adminPasswordHash },
    create: {
      email: 'admin@platform.com',
      phone: '03000000001',
      password_hash: adminPasswordHash,
      role: 'admin',
      admin_role: 'super_admin',
      referral_code: 'ADMIN1',
      is_verified: true,
      profile_completed: true,
      name: 'Super Admin',
      city: 'Lahore',
    },
  });
  await prisma.referralClosure.upsert({
    where: { ancestor_id_descendant_id: { ancestor_id: adminUser.id, descendant_id: adminUser.id } },
    update: {},
    create: { ancestor_id: adminUser.id, descendant_id: adminUser.id, depth: 0 },
  });

  // ── 4. Test Affiliate User ────────────────────────────────────────
  const userPasswordHash = await bcrypt.hash('Test@1234', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: { is_verified: true, profile_completed: true, name: 'Ahmed Ali', password_hash: userPasswordHash },
    create: {
      email: 'user@test.com',
      phone: '03001234567',
      password_hash: userPasswordHash,
      role: 'affiliate',
      referral_code: 'TESTCODE',
      is_verified: true,
      profile_completed: true,
      name: 'Ahmed Ali',
      city: 'Karachi',
      sponsor_id: adminUser.id,
    },
  });
  // Closure entries for testUser
  await prisma.referralClosure.upsert({
    where: { ancestor_id_descendant_id: { ancestor_id: testUser.id, descendant_id: testUser.id } },
    update: {},
    create: { ancestor_id: testUser.id, descendant_id: testUser.id, depth: 0 },
  });
  await prisma.referralClosure.upsert({
    where: { ancestor_id_descendant_id: { ancestor_id: adminUser.id, descendant_id: testUser.id } },
    update: {},
    create: { ancestor_id: adminUser.id, descendant_id: testUser.id, depth: 1 },
  });

  console.log('✅ Users seeded:');
  console.log('   Admin:  admin@platform.com / Admin@1234');
  console.log('   User:   user@test.com / Test@1234  (referral: TESTCODE)');

  // ── 5. Products ──────────────────────────────────────────────────
  const products = [
    // Gents Cloth
    {
      title: 'Premium Cotton Kurta — Navy Blue',
      slug: 'premium-cotton-kurta-navy',
      description: 'Breathable high-thread-count cotton kurta with embroidered collar. Perfect for casual and semi-formal occasions.',
      price_paisa: 349900,         // PKR 3,499
      net_commissionable_paisa: 349900,
      stock_count: 85,
      category_slug: 'gents-cloth',
      subcategory_name: 'Kurtas',
      image_url: 'https://images.unsplash.com/photo-1543322748-33df6d3db806?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'Classic Oxford Button-Down Shirt',
      slug: 'classic-oxford-shirt',
      description: 'Versatile Oxford weave shirt in white, ideal for office or casual wear. Available in S–XXL.',
      price_paisa: 249900,         // PKR 2,499
      net_commissionable_paisa: 249900,
      stock_count: 120,
      category_slug: 'gents-cloth',
      subcategory_name: 'Shirts',
      image_url: 'https://images.unsplash.com/photo-1543322748-33df6d3db806?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'Slim-Fit Chino Trousers — Khaki',
      slug: 'slim-fit-chino-khaki',
      description: 'Modern slim-fit chino trousers in premium khaki fabric with stretch for comfort.',
      price_paisa: 299900,         // PKR 2,999
      net_commissionable_paisa: 299900,
      stock_count: 60,
      category_slug: 'gents-cloth',
      subcategory_name: 'Trousers',
      image_url: 'https://images.unsplash.com/photo-1543322748-33df6d3db806?w=1000&auto=format&fit=crop&q=80',
    },
    // Ladies Cloth
    {
      title: 'Lawn Printed 3-Piece Suit — Summer Collection',
      slug: 'lawn-3piece-summer',
      description: 'Soft lawn fabric with vibrant floral print. Includes kameez, shalwar, and dupatta.',
      price_paisa: 399900,         // PKR 3,999
      net_commissionable_paisa: 399900,
      stock_count: 75,
      category_slug: 'ladies-cloth',
      subcategory_name: 'Lawn',
      image_url: 'https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'Formal Embroidered Kameez — Maroon',
      slug: 'formal-embroidered-kameez-maroon',
      description: 'Elegant maroon kameez with intricate thread embroidery on neckline and sleeves. Ideal for weddings.',
      price_paisa: 599900,         // PKR 5,999
      net_commissionable_paisa: 599900,
      stock_count: 40,
      category_slug: 'ladies-cloth',
      subcategory_name: 'Formal',
      image_url: 'https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?w=1000&auto=format&fit=crop&q=80',
    },
    // Mobile Accessories
    {
      title: '65W GaN Fast Charger — Type-C',
      slug: '65w-gan-fast-charger',
      description: 'Compact GaN fast charger with dual USB-C and one USB-A port. Charges laptops, phones, and tablets.',
      price_paisa: 189900,         // PKR 1,899
      net_commissionable_paisa: 189900,
      stock_count: 200,
      category_slug: 'mobile-accessories',
      subcategory_name: 'Chargers',
      image_url: 'https://images.unsplash.com/photo-1617875084318-c40d37b04c21?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'Wireless Earbuds — Active Noise Cancellation',
      slug: 'wireless-earbuds-anc',
      description: 'True wireless earbuds with 30hr battery life, ANC, and IPX5 water resistance.',
      price_paisa: 449900,         // PKR 4,499
      net_commissionable_paisa: 449900,
      stock_count: 55,
      category_slug: 'mobile-accessories',
      subcategory_name: 'Earbuds',
      image_url: 'https://images.unsplash.com/photo-1756902368926-eb9e5e9d2a69?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'MagSafe Compatible Phone Case — iPhone 15',
      slug: 'magsafe-case-iphone15',
      description: 'Ultra-slim MagSafe compatible case with military-grade drop protection.',
      price_paisa: 99900,          // PKR 999
      net_commissionable_paisa: 99900,
      stock_count: 300,
      category_slug: 'mobile-accessories',
      subcategory_name: 'Cases',
      image_url: 'https://images.unsplash.com/photo-1617875084318-c40d37b04c21?w=1000&auto=format&fit=crop&q=80',
    },
    // Herbal Products
    {
      title: 'Multani Mitti Facial Mask — 500g',
      slug: 'multani-mitti-facial-mask',
      description: 'Pure Fuller\'s Earth clay for deep pore cleansing, oil control, and skin brightening.',
      price_paisa: 59900,          // PKR 599
      net_commissionable_paisa: 59900,
      stock_count: 150,
      category_slug: 'herbal-products',
      subcategory_name: 'Skincare',
      image_url: 'https://images.unsplash.com/photo-1773700596401-61bc77e0b436?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'Black Seed (Kalonji) Oil Capsules — 60 Count',
      slug: 'kalonji-oil-capsules-60',
      description: 'Cold-pressed Nigella Sativa oil capsules. Immune support, anti-inflammatory benefits.',
      price_paisa: 149900,         // PKR 1,499
      net_commissionable_paisa: 149900,
      stock_count: 90,
      category_slug: 'herbal-products',
      subcategory_name: 'Supplements',
      image_url: 'https://images.unsplash.com/photo-1773700596401-61bc77e0b436?w=1000&auto=format&fit=crop&q=80',
    },
    // Watches
    {
      title: 'Citizen Eco-Drive Stainless Steel Watch',
      slug: 'citizen-ecodrive-stainless',
      description: 'Solar-powered analog watch with sapphire crystal glass. Water resistant to 100m.',
      price_paisa: 2499900,        // PKR 24,999
      net_commissionable_paisa: 2499900,
      stock_count: 25,
      category_slug: 'watches',
      subcategory_name: 'Gents',
      image_url: 'https://images.unsplash.com/photo-1769240186303-d7fb5cf4a8be?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title: 'Elegance Ladies Rose Gold Watch',
      slug: 'elegance-ladies-rose-gold',
      description: 'Slim ladies watch with Japanese movement, rose gold case, and genuine leather strap.',
      price_paisa: 1799900,        // PKR 17,999
      net_commissionable_paisa: 1799900,
      stock_count: 30,
      category_slug: 'watches',
      subcategory_name: 'Ladies',
      image_url: 'https://images.unsplash.com/photo-1631729670375-7b9bc6ba6c07?w=1000&auto=format&fit=crop&q=80',
    },
  ];

  for (const p of products) {
    const catId = categoryMap[p.category_slug]?.id;
    const subCatId = categoryMap[p.category_slug]?.subcats?.[p.subcategory_name];
    if (!catId) { console.warn(`⚠️  Category not found for: ${p.title}`); continue; }

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        price_paisa: p.price_paisa,
        net_commissionable_paisa: p.net_commissionable_paisa,
        stock_count: p.stock_count,
        category_id: catId,
        subcategory_id: subCatId || null,
        image_url: p.image_url || null,
      },
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        price_paisa: p.price_paisa,
        net_commissionable_paisa: p.net_commissionable_paisa,
        stock_count: p.stock_count,
        category_id: catId,
        subcategory_id: subCatId || null,
        image_url: p.image_url || null,
      },
    });
  }
  console.log(`✅ ${products.length} products seeded with catalog images`);

  console.log('\n🎉 Seed complete! You can now log in with:');
  console.log('   Admin:  admin@platform.com / Admin@1234');
  console.log('   User:   user@test.com / Test@1234');
  console.log('   Referral URL: http://localhost:3000/?ref=TESTCODE\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
