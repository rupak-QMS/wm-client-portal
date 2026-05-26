export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

function serialize(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? Number(v) :
    v instanceof Date ? v.toISOString() : v
  ));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const amId  = searchParams.get('am_id');
  const month = searchParams.get('month');
  const year  = searchParams.get('year');

  const where: any = {};
  if (amId)  where.account_manager_id = amId;
  if (month) where.month = parseInt(month);
  if (year)  where.year  = parseInt(year);
  if (user.role === 'account_manager') {
    where.account_manager_id = user.id;
  }

  const targets = await prisma.revenueTarget.findMany({
    where,
    include: {
      accountManager: { select: { id: true, full_name: true, email: true } },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  return NextResponse.json({ data: serialize(targets) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager') {
    return NextResponse.json({ error: 'Only managers can set targets' }, { status: 403 });
  }

  const { account_manager_id, month, year, target_amount, currency } = await req.json();

  if (!account_manager_id || !month || !year || !target_amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
  }

  const target = await prisma.revenueTarget.upsert({
    where: {
      account_manager_id_month_year: {
        account_manager_id,
        month: parseInt(month),
        year:  parseInt(year),
      },
    },
    update: {
      target_amount: parseFloat(target_amount),
      currency:      currency || 'USD',
    },
    create: {
      account_manager_id,
      month:         parseInt(month),
      year:          parseInt(year),
      target_amount: parseFloat(target_amount),
      currency:      currency || 'USD',
      created_by:    user.id,
    },
    include: {
      accountManager: { select: { id: true, full_name: true } },
    },
  });

  return NextResponse.json({ data: serialize(target) }, { status: 201 });
}
