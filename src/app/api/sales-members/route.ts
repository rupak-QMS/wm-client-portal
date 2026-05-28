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
  const team = searchParams.get('team'); // aus_nz | uk | us_canada

  const where: any = { role: 'sales_team' };
  if (team) where.sales_team_group = team;

  // Sales team members can only see their own team
  if (user.role === 'sales_team') {
    where.sales_team_group = user.sales_team_group ?? undefined;
  }

  const members = await prisma.user.findMany({
    where,
    select: {
      id: true, full_name: true, email: true,
      sales_team_group: true, created_at: true,
    },
    orderBy: { full_name: 'asc' },
  });

  // For each member, calculate their total collected (achieved) from approved leads
  const memberIds = members.map((m: any) => m.id);
  const leads = await prisma.salesLead.findMany({
    where: {
      created_by: { in: memberIds },
      status: { in: ['approved', 'assigned'] },
    },
    select: { created_by: true, collected_amount: true, currency: true },
  });

  const achievedMap: Record<string, number> = {};
  leads.forEach((l: any) => {
    achievedMap[l.created_by] = (achievedMap[l.created_by] ?? 0) + parseFloat(l.collected_amount || 0);
  });

  const data = members.map((m: any) => ({
    ...m,
    achieved: achievedMap[m.id] ?? 0,
  }));

  return NextResponse.json({ data: serialize(data) });
}