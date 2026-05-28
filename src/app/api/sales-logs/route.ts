export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const serialize = (d: any) =>
  JSON.parse(
    JSON.stringify(d, (_, v) =>
      typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString() : v
    )
  );

// GET: fetch CRM activity logs for a lead
// Manager/AM can query by lead_id; sales sees logs on their own leads
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('lead_id');

  if (!leadId)
    return NextResponse.json({ error: 'lead_id required' }, { status: 422 });

  // Verify the user has access to this lead
  const lead = await prisma.salesLead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Sales can only view logs on leads they created
  if (user.role === 'sales_team' && lead.created_by !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const logs = await prisma.salesLog.findMany({
    where: { lead_id: leadId },
    include: { author: { select: { id: true, full_name: true } } },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: serialize(logs) });
}

// POST: add a CRM activity log entry to a lead
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { lead_id, log_type, title, content, next_action, closing_pct } = await req.json();

  if (!lead_id || !title || !content)
    return NextResponse.json({ error: 'lead_id, title, and content are required' }, { status: 422 });

  const lead = await prisma.salesLead.findUnique({ where: { id: lead_id } });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  if (user.role === 'sales_team' && lead.created_by !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const log = await prisma.salesLog.create({
    data: {
      lead_id,
      created_by: user.id,
      log_type: log_type ?? 'other',
      title,
      content,
      next_action: next_action ?? null,
      closing_pct: closing_pct ? parseInt(closing_pct) : null,
    },
    include: { author: { select: { id: true, full_name: true } } },
  });

  return NextResponse.json({ data: serialize(log) }, { status: 201 });
}