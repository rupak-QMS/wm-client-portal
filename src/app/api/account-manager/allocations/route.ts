import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/account-manager/allocations?month=&year=
// Returns: { total_target, self_allocation, tl_allocations[], allocated_total, remaining }
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'account_manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));

  if (!month || !year) {
    return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
  }

  const [revenueTarget, selfAllocation, tlAllocations] = await Promise.all([
    prisma.revenueTarget.findFirst({
      where: { account_manager_id: currentUser.id, month, year },
    }),
    prisma.accountManagerSelfTarget.findFirst({
      where: { account_manager_id: currentUser.id, month, year },
    }),
    prisma.accountManagerTeamLeaderTarget.findMany({
      where: { account_manager_id: currentUser.id, month, year },
      include: { team_leader: { select: { id: true, full_name: true } } },
    }),
  ]);

  const total_target = Number(revenueTarget?.target_amount ?? 0);
  const self_allocated = Number(selfAllocation?.allocated_amount ?? 0);
  const tl_allocated = tlAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);
  const allocated_total = self_allocated + tl_allocated;

  return NextResponse.json({
    total_target,
    self_allocation: selfAllocation ?? { allocated_amount: 0, achieved_amount: 0 },
    tl_allocations: tlAllocations,
    allocated_total,
    remaining: total_target - allocated_total,
  });
}

// POST /api/account-manager/allocations
// Body: { month, year, type: 'self' | 'team_leader', team_leader_id?, allocated_amount }
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'account_manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { month, year, type, team_leader_id, allocated_amount } = await req.json();

  if (!month || !year || !type || allocated_amount == null || allocated_amount < 0) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }
  if (type === 'team_leader' && !team_leader_id) {
    return NextResponse.json(
      { error: 'team_leader_id is required when type is team_leader' },
      { status: 400 }
    );
  }

  const revenueTarget = await prisma.revenueTarget.findFirst({
    where: { account_manager_id: currentUser.id, month, year },
  });
  const total_target = Number(revenueTarget?.target_amount ?? 0);

  // Sum everything else already allocated this month/year, excluding the row being updated
  const [selfAllocation, tlAllocations] = await Promise.all([
    prisma.accountManagerSelfTarget.findFirst({
      where: { account_manager_id: currentUser.id, month, year },
    }),
    prisma.accountManagerTeamLeaderTarget.findMany({
      where: { account_manager_id: currentUser.id, month, year },
    }),
  ]);

  let otherAllocatedTotal = 0;
  if (type === 'self') {
    otherAllocatedTotal = tlAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);
  } else {
    otherAllocatedTotal =
      Number(selfAllocation?.allocated_amount ?? 0) +
      tlAllocations
        .filter((a) => a.team_leader_id !== team_leader_id)
        .reduce((sum, a) => sum + Number(a.allocated_amount), 0);
  }

  if (otherAllocatedTotal + Number(allocated_amount) > total_target) {
    return NextResponse.json(
      {
        error: `Allocation exceeds available target. Total: ${total_target}, already allocated elsewhere: ${otherAllocatedTotal}, max for this entry: ${total_target - otherAllocatedTotal}`,
      },
      { status: 400 }
    );
  }

  if (type === 'self') {
    const result = await prisma.accountManagerSelfTarget.upsert({
      where: {
        account_manager_id_month_year: {
          account_manager_id: currentUser.id,
          month,
          year,
        },
      },
      update: { allocated_amount },
      create: {
        account_manager_id: currentUser.id,
        month,
        year,
        allocated_amount,
      },
    });
    return NextResponse.json(result);
  }

  // type === 'team_leader'
  const teamLeader = await prisma.user.findUnique({ where: { id: team_leader_id } });
  if (
    !teamLeader ||
    teamLeader.role !== 'team_leader' ||
    teamLeader.assigned_account_manager_id !== currentUser.id
  ) {
    return NextResponse.json(
      { error: 'This Team Leader is not assigned to you' },
      { status: 400 }
    );
  }

  const result = await prisma.accountManagerTeamLeaderTarget.upsert({
    where: {
      account_manager_id_team_leader_id_month_year: {
        account_manager_id: currentUser.id,
        team_leader_id,
        month,
        year,
      },
    },
    update: { allocated_amount },
    create: {
      account_manager_id: currentUser.id,
      team_leader_id,
      month,
      year,
      allocated_amount,
      created_by: currentUser.id,
    },
  });

  return NextResponse.json(result);
}