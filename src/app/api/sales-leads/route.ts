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
  const status = searchParams.get('status');
  const month  = searchParams.get('month');
  const year   = searchParams.get('year');

  const where: any = {};
  if (status) where.status = status;
  if (month && year) {
    where.created_at = {
      gte: new Date(`${year}-${String(month).padStart(2,'0')}-01`),
      lt:  new Date(parseInt(year), parseInt(month), 1),
    };
  }
  // Sales team only sees their own leads
  if (user.role === 'sales_team') where.created_by = user.id;

  const leads = await prisma.salesLead.findMany({
    where,
    include: {
      creator:    { select: { id:true, full_name:true, email:true } },
      approver:   { select: { id:true, full_name:true } },
      assignedAM: { select: { id:true, full_name:true } },
      logs:       { orderBy: { created_at:'desc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: serialize(leads) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['sales_team','manager'].includes(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const { company_name, contact_person, email, phone, website,
    service_required, expected_value, currency, sales_stage, notes } = body;

  if (!company_name || !contact_person || !email)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });

  const lead = await prisma.salesLead.create({
    data: {
      created_by: user.id,
      company_name, contact_person, email,
      phone, website, service_required,
      expected_value: expected_value ? parseFloat(expected_value) : null,
      currency: currency || 'USD',
      sales_stage: sales_stage || 'prospecting',
      notes,
      status: 'draft',
    },
    include: { creator: { select: { id:true, full_name:true } } },
  });

  return NextResponse.json({ data: serialize(lead) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, status, rejection_reason, manager_notes, assigned_am, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 422 });

  const lead = await prisma.salesLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Sales team can only edit their own draft leads
  if (user.role === 'sales_team') {
    if (lead.created_by !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!['draft','pending_approval'].includes(lead.status))
      return NextResponse.json({ error: 'Cannot edit approved leads' }, { status: 403 });
  }

  const updateData: any = { ...rest, updated_at: new Date() };
  if (status) updateData.status = status;
  if (rejection_reason) updateData.rejection_reason = rejection_reason;
  if (manager_notes !== undefined) updateData.manager_notes = manager_notes;
  if (assigned_am) { updateData.assigned_am = assigned_am; updateData.status = 'assigned'; }
  if (['approved','rejected','assigned'].includes(status)) {
    updateData.approved_by  = user.id;
    updateData.reviewed_at  = new Date();
  }

  const updated = await prisma.salesLead.update({
    where: { id },
    data:  updateData,
    include: {
      creator:    { select: { id:true, full_name:true } },
      approver:   { select: { id:true, full_name:true } },
      assignedAM: { select: { id:true, full_name:true } },
    },
  });

  return NextResponse.json({ data: serialize(updated) });
}