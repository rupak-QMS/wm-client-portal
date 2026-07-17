import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !['manager', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? '30'));
    const userId = searchParams.get('userId') ?? undefined;
    const action = searchParams.get('action') ?? undefined;
    const entity = searchParams.get('entity') ?? undefined;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const where: any = {};
    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to) where.created_at.lte = new Date(to);
    }
    if (search) {
      // description lives inside the metadata JSON column, not a real column
      where.metadata = { path: ['description'], string_contains: search };
    }

    const [entries, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, full_name: true, email: true, role: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err: any) {
    console.error('GET /api/activity-log error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}