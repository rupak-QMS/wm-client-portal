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
  const team = searchParams.get('team'); // team UUID
  const role = searchParams.get('role'); // team_leader | sales_team

  const where: any = { role: role ?? 'sales_team' };
  if (team) where.team_id = team;

  // Sales team members and team leaders only see their own team
  if (user.role === 'sales_team' || user.role === 'team_leader') {
    where.team_id = (user as any).team_id ?? undefined;
  }

  const members = await prisma.user.findMany({
    where,
    select: {
      id: true, full_name: true, email: true,
      team_id: true, team: { select: { id: true, name: true } },
      created_at: true, status: true,
    },
    orderBy: { full_name: 'asc' },
  });

  if (role === 'team_leader') {
    return NextResponse.json({ data: serialize(members) });
  }

  const memberIds = members.map((m: any) => m.id);
  const leads = await prisma.salesLead.findMany({
    where: {
      created_by: { in: memberIds },
      status: { in: ['approved', 'assigned'] },
    },
    select: { created_by: true, collected_amount: true },
  });

  const achievedMap: Record<string, number> = {};
  leads.forEach((l: any) => {
    achievedMap[l.created_by] = (achievedMap[l.created_by] ?? 0) + parseFloat(l.collected_amount || 0);
  });

  const data = members.map((m: any) => ({ ...m, achieved: achievedMap[m.id] ?? 0 }));
  return NextResponse.json({ data: serialize(data) });
}
