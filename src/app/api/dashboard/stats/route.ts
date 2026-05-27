import { NextResponse } from 'next/server';
import prisma           from '@/lib/prisma';

export async function GET() {
  try {
    const [clientCount, amCount, pendingApprovals, reportCount] = await Promise.all([
      prisma.client.count(),
      prisma.user.count({ where: { role: 'account_manager' } }),
      prisma.deleteRequest.count({ where: { status: 'pending' } }),
      prisma.report.count(),
    ]);

    return NextResponse.json({
      data: { clientCount, amCount, pendingApprovals, reportCount },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}