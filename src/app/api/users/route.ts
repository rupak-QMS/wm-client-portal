import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  const users = await prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: users });
}