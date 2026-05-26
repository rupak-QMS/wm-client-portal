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
  const clientId = searchParams.get('client_id');
  const amId     = searchParams.get('am_id');
  const month    = searchParams.get('month');
  const year     = searchParams.get('year');

  const where: any = {};
  if (clientId) where.client_id = clientId;
  if (amId)     where.account_manager_id = amId;
  if (user.role === 'account_manager') {
    where.account_manager_id = user.id;
  }
  if (month && year) {
    where.date = {
      gte: new Date(`${year}-${month.padStart(2, '0')}-01`),
      lt:  new Date(parseInt(year), parseInt(month), 1),
    };
  }

  const upsells = await prisma.upsell.findMany({
    where,
    include: {
      client:         { select: { id: true, company_name: true } },
      accountManager: { select: { id: true, full_name: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ data: serialize(upsells) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const {
    client_id, date, product_sold,
    total_cost, upfront_amount,
    project_status, currency, notes,
  } = body;

  if (!client_id || !date || !product_sold || !total_cost) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
  }

  const upsell = await prisma.upsell.create({
    data: {
      client_id,
      account_manager_id: user.id,
      date:               new Date(date),
      product_sold,
      total_cost:         parseFloat(total_cost),
      upfront_amount:     parseFloat(upfront_amount || 0),
      project_status:     project_status || 'pending',
      currency:           currency || 'USD',
      notes,
    },
    include: {
      client:         { select: { id: true, company_name: true } },
      accountManager: { select: { id: true, full_name: true } },
    },
  });

  return NextResponse.json({ data: serialize(upsell) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 422 });

  const upsell = await prisma.upsell.update({
    where: { id },
    data: {
      ...data,
      total_cost:     data.total_cost     ? parseFloat(data.total_cost)     : undefined,
      upfront_amount: data.upfront_amount ? parseFloat(data.upfront_amount) : undefined,
      date:           data.date           ? new Date(data.date)             : undefined,
    },
    include: {
      client:         { select: { id: true, company_name: true } },
      accountManager: { select: { id: true, full_name: true } },
    },
  });

  return NextResponse.json({ data: serialize(upsell) });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 422 });

  await prisma.upsell.delete({ where: { id } });
  return NextResponse.json({ message: 'Deleted' });
}
