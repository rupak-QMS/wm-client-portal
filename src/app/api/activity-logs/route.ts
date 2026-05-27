import { NextResponse } from 'next/server';
import prisma           from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      take:     10,
      orderBy:  { created_at: 'desc' },
      include:  { user: { select: { full_name: true, avatar_url: true } } },
    });

    const serialized = logs.map(log => ({
      ...log,
      created_at: log.created_at.toISOString(),
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}