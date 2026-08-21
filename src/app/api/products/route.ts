import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const subcategorySlug = searchParams.get('subcategory');
    const search = searchParams.get('search');

    const where: any = { is_active: true };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (subcategorySlug) {
      where.subcategory = { slug: subcategorySlug };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const categories = await prisma.category.findMany({
      include: { subcategories: true },
    });

    return NextResponse.json({ products, categories });
  } catch (error: any) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      pricePaisa,
      netCommissionablePaisa,
      stockCount,
      categoryId,
      subcategoryId,
      imageUrl,
    } = body;

    if (!title || !pricePaisa || !categoryId) {
      return NextResponse.json({ error: 'Title, Price, and Category are required' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description: description || '',
        price_paisa: parseInt(pricePaisa, 10),
        net_commissionable_paisa: parseInt(netCommissionablePaisa || pricePaisa, 10),
        stock_count: parseInt(stockCount || '0', 10),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        image_url: imageUrl || null,
      },
    });

    await logAuditEvent({
      actorId: payload.userId,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      afterState: { title, pricePaisa, netCommissionablePaisa },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Product POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
