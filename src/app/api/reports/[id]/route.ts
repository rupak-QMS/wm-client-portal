import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      client:   { select: { id: true, company_name: true } },
      uploader: { select: { id: true, full_name: true } },
      comments: {
        include: { user: { select: { id: true, full_name: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: report });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ message: 'Report deleted' });
}
