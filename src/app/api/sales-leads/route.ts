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
  const status   = searchParams.get('status');
  const month    = searchParams.get('month');
  const year     = searchParams.get('year');
  const leadId   = searchParams.get('id');

  const where: any = {};
  if (leadId) where.id = leadId;
  if (status) where.status = status;
  if (month && year) {
    where.created_at = {
      gte: new Date(`${year}-${String(month).padStart(2,'0')}-01`),
      lt:  new Date(parseInt(year), parseInt(month), 1),
    };
  }

  // Sales team only sees their own leads
  if (user.role === 'sales_team') where.created_by = user.id;

  // Account managers only see leads assigned to them
  if (user.role === 'account_manager') where.assigned_am = user.id;

  const leads = await prisma.salesLead.findMany({
    where,
    include: {
      creator:    { select: { id:true, full_name:true, email:true } },
      approver:   { select: { id:true, full_name:true } },
      assignedAM: { select: { id:true, full_name:true } },
      logs: {
        include: { author: { select: { id:true, full_name:true } } },
        orderBy: { created_at: 'desc' },
        // Sales team sees all their own logs
        // AM sees all logs (sales history)
        // After assignment, sales only sees logs they created
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // For sales team: filter logs to only their own after assignment
  const filtered = leads.map(lead => {
    if (user.role === 'sales_team' && ['approved','assigned'].includes(lead.status)) {
      return {
        ...lead,
        logs: lead.logs.filter((l: any) => l.created_by === user.id),
      };
    }
    return lead;
  });

  return NextResponse.json({ data: serialize(filtered) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['sales_team','manager'].includes(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const {
    company_name, contact_person, email, phone, website,
    service_required, expected_value, currency, sales_stage, notes,
    // Sale details fields
    deal_value, upfront_amount, payment_terms, service_agreed,
  } = body;

  if (!company_name || !contact_person || !email)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });

  const lead = await prisma.salesLead.create({
    data: {
      created_by: user.id,
      company_name, contact_person, email,
      phone, website, service_required,
      expected_value: deal_value ? parseFloat(deal_value) : expected_value ? parseFloat(expected_value) : null,
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

  const lead = await prisma.salesLead.findUnique({
    where: { id },
    include: { creator: { select: { id:true, full_name:true } } },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Sales team can only edit their own draft/pending leads
  if (user.role === 'sales_team') {
    if (lead.created_by !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!['draft','pending_approval'].includes(lead.status))
      return NextResponse.json({ error: 'Cannot edit approved leads' }, { status: 403 });
  }

  const updateData: any = { ...rest, updated_at: new Date() };
  if (status)                        updateData.status           = status;
  if (rejection_reason)              updateData.rejection_reason = rejection_reason;
  if (manager_notes !== undefined)   updateData.manager_notes    = manager_notes;
  if (['approved','rejected','assigned'].includes(status)) {
    updateData.approved_by = user.id;
    updateData.reviewed_at = new Date();
  }

  // ── AUTO-CREATE CLIENT when manager assigns AM ──
  if (assigned_am && user.role === 'manager') {
    updateData.assigned_am = assigned_am;
    updateData.status      = 'assigned';
    updateData.approved_by = user.id;
    updateData.reviewed_at = new Date();

    // Check if client already exists for this lead
    const existingClient = await (prisma as any).client.findFirst({
      where: { sales_lead_id: id },
    });

    if (!existingClient) {
      // Create client record automatically
      await (prisma as any).client.create({
        data: {
          company_name:             lead.company_name,
          contact_person:           lead.contact_person,
          email:                    lead.email,
          phone:                    lead.phone,
          website:                  lead.website,
          notes:                    lead.notes,
          assigned_account_manager: assigned_am,
          created_by:               lead.created_by,
          status:                   'active',
          sales_lead_id:            id,
        },
      });
    } else {
      // Update existing client with AM
      await (prisma as any).client.update({
        where: { id: existingClient.id },
        data:  { assigned_account_manager: assigned_am },
      });
    }
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