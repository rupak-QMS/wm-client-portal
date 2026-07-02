import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'team_leader') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));

  if (!month || !year) {
    return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
  }

  const amTarget = await prisma.accountManagerTeamLeaderTarget.findFirst({
    where: { team_leader_id: currentUser.id, month, year },
    include: { account_manager: { select: { id: true, full_name: true } } },
  });

  const allocations = await prisma.teamTargetAllocation.findMany({
    where: { team_leader_id: currentUser.id, month, year },
  });
  const allocated_to_team = allocations.reduce((sum, a) => sum + Number(a.allocated_target), 0);
  const assigned_target = Number(amTarget?.allocated_amount ?? 0);

  return NextResponse.json({
    assigned_target,
    achieved: Number(amTarget?.achieved_amount ?? 0),
    from_account_manager: amTarget?.account_manager ?? null,
    allocated_to_team,
    remaining_to_allocate: assigned_target - allocated_to_team,
  });
}