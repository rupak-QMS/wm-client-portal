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

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const requests = await prisma.deleteRequest.findMany({
    include: {
      client:    { select: { id: true, company_name: true, email: true } },
      requester: { select: { id: true, full_name: true } },
      approver:  { select: { id: true, full_name: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ data: serialize(requests) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['account_manager', 'manager'].includes(user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { client_id, reason } = await req.json();
  if (!client_id)
    return NextResponse.json({ error: 'client_id required' }, { status: 422 });

  const request = await prisma.deleteRequest.create({
    data: { client_id, requested_by: user.id, reason, status: 'pending' },
    include: {
      client:    { select: { id: true, company_name: true } },
      requester: { select: { id: true, full_name: true } },
    },
  });
  return NextResponse.json({ data: serialize(request) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager')
    return NextResponse.json({ error: 'Only managers can review requests' }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !action)
    return NextResponse.json({ error: 'id and action required' }, { status: 422 });

  const request = await prisma.deleteRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.deleteRequest.update({
    where: { id },
    data: {
      status:      action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      reviewed_at: new Date(),
    },
  });

  if (action === 'approve') {
    await prisma.client.delete({ where: { id: request.client_id } });
  }
  return NextResponse.json({ data: serialize(updated) });
}