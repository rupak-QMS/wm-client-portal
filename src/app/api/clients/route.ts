export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createClientSchema } from '@/lib/validations/client.schema';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clients = await prisma.client.findMany({
    where:
      user.role === 'manager'         ? {} :
      user.role === 'account_manager' ? { assigned_account_manager: user.id } :
      { email: user.email },
    include: {
      assignedManager: { select: { id: true, full_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: clients });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['manager', 'account_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const client = await prisma.client.create({
    data: { ...parsed.data, created_by: user.id },
  });

  return NextResponse.json({ data: client }, { status: 201 });
}