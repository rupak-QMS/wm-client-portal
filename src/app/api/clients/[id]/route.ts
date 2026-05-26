import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { assignedManager: true },
  });

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: client });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !['manager', 'account_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body   = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
    data:  body,
  });

  return NextResponse.json({ data: client });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager') {
    return NextResponse.json({ error: 'Only managers can delete clients' }, { status: 403 });
  }

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ message: 'Client deleted' });
}