export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const serialize = (d: any) => JSON.parse(JSON.stringify(d, (_, v) =>
  typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString() : v
));

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month         = searchParams.get('month');
  const year          = searchParams.get('year');
  const memberId      = searchParams.get('member_id');

  const where: any = {};
  if (month)    where.month = parseInt(month);
  if (year)     where.year  = parseInt(year);
  if (memberId) where.sales_member_id = memberId;
  if (user.role === 'sales_team') where.sales_member_id = user.id;

  const targets = await prisma.salesTarget.findMany({
    where,
    include: { salesMember: { select: { id:true, full_name:true, email:true } } },
    orderBy: [{ year:'desc' }, { month:'desc' }],
  });

  return NextResponse.json({ data: serialize(targets) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager')
    return NextResponse.json({ error: 'Only managers can set targets' }, { status: 403 });

  const { sales_member_id, month, year, target_clients, target_revenue, target_deals, currency } = await req.json();
  if (!sales_member_id || !month || !year)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });

  const target = await prisma.salesTarget.upsert({
    where: { sales_member_id_month_year: { sales_member_id, month: parseInt(month), year: parseInt(year) } },
    update: {
      target_clients: parseInt(target_clients || 0),
      target_revenue: parseFloat(target_revenue || 0),
      target_deals:   parseInt(target_deals   || 0),
      currency:       currency || 'USD',
    },
    create: {
      sales_member_id, month: parseInt(month), year: parseInt(year),
      target_clients: parseInt(target_clients || 0),
      target_revenue: parseFloat(target_revenue || 0),
      target_deals:   parseInt(target_deals   || 0),
      currency:       currency || 'USD',
      created_by:     user.id,
    },
    include: { salesMember: { select: { id:true, full_name:true } } },
  });

  return NextResponse.json({ data: serialize(target) }, { status: 201 });
}