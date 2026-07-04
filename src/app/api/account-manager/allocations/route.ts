import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/account-manager/allocations?month=&year=
export async function GET(req: NextRequest) {
  try {
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
    const rt: any = revenueTarget;
    const total_target_currency = rt?.currency ?? rt?.target_currency ?? rt?.currency_code ?? 'USD';

    return NextResponse.json({
      total_target,
      total_target_currency,
      self_allocation: selfAllocation ?? { allocated_amount: 0, achieved_amount: 0 },
      tl_allocations: tlAllocations,
      allocated_total,
      remaining: total_target - allocated_total,
    });
  } catch (err: any) {
    console.error('GET /api/account-manager/allocations error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error', stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined },
      { status: 500 }
    );
  }
}

// POST /api/account-manager/allocations
// Body: { month, year, type: 'self' | 'team_leader', team_leader_id?, allocated_amount }
// Note: `currency` is intentionally NOT read from the body — see below.
export async function POST(req: NextRequest) {
  try {
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
    // Currency is NOT a per-allocation choice — it's inherited from the
    // Manager-set RevenueTarget for this AM/month. Every allocation (self
    // and every Team Leader) must use the same currency, so any `currency`
    // sent in the request body is ignored on purpose.
    const resolvedCurrency = (revenueTarget as any)?.currency ?? (revenueTarget as any)?.target_currency ?? (revenueTarget as any)?.currency_code ?? 'USD';

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
        update: { allocated_amount, currency: resolvedCurrency },
        create: {
          account_manager_id: currentUser.id,
          month,
          year,
          allocated_amount,
          currency: resolvedCurrency,
        },
      });
      return NextResponse.json(result);
    }

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
      update: { allocated_amount, currency: resolvedCurrency },
      create: {
        account_manager_id: currentUser.id,
        team_leader_id,
        month,
        year,
        allocated_amount,
        currency: resolvedCurrency,
        created_by: currentUser.id,
      },
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST /api/account-manager/allocations error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error', stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined },
      { status: 500 }
    );
  }
}