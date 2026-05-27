export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const serialize = (d: any) => JSON.parse(JSON.stringify(d, (_, v) =>
  typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString() : v
));

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('lead_id');
  if (!leadId) return NextResponse.json({ error: 'lead_id required' }, { status: 422 });

  const logs = await prisma.salesLog.findMany({
    where: { lead_id: leadId },
    include: { author: { select: { id:true, full_name:true, avatar_url:true } } },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: serialize(logs) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['sales_team','manager'].includes(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { lead_id, log_type, title, content, next_action, closing_pct } = await req.json();
  if (!lead_id || !title || !content)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });

  const log = await prisma.salesLog.create({
    data: {
      lead_id, created_by: user.id,
      log_type: log_type || 'other',
      title, content, next_action,
      closing_pct: closing_pct ? parseInt(closing_pct) : null,
    },
    include: { author: { select: { id:true, full_name:true } } },
  });

  return NextResponse.json({ data: serialize(log) }, { status: 201 });
}