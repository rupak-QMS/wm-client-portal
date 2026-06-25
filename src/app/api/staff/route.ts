export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const serialize = (d: any) => JSON.parse(JSON.stringify(d, (_, v) =>
  typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString() : v
));

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  const data = await prisma.user.findMany({
    where: {
      role: role ? { equals: role as any } : { in: ['account_manager', 'team_leader', 'sales_team'] },
    },
    select: {
      id: true, full_name: true, email: true, role: true,
      status: true, team_id: true, created_at: true,
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
  });

  return NextResponse.json({ data: serialize(data) });
}
