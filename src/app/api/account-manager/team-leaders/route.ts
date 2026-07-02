// src/app/api/account-manager/team-leaders/route.ts
// Account Manager fetches the Team Leaders assigned to them

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'account_manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamLeaders = await prisma.user.findMany({
    where: {
      role: 'team_leader',
      assigned_account_manager_id: currentUser.id,
      status: 'active',
    },
    select: { id: true, full_name: true, email: true },
    orderBy: { full_name: 'asc' },
  });

  return NextResponse.json(teamLeaders);
}