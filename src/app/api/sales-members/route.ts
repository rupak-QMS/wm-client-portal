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

  const members = await prisma.user.findMany({
    where: { role: 'sales_team' },
    select: { id:true, full_name:true, email:true, created_at:true },
    orderBy: { full_name: 'asc' },
  });

  return NextResponse.json({ data: serialize(members) });
}