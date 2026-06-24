import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team_leader_id = searchParams.get('team_leader_id');
    const month = searchParams.get('month');
    const year  = searchParams.get('year');
    if (!team_leader_id) return NextResponse.json({ error: 'team_leader_id required' }, { status: 400 });

    const allocations = await prisma.teamTargetAllocation.findMany({
      where: {
        team_leader_id,
        ...(month ? { month: parseInt(month) } : {}),
        ...(year  ? { year:  parseInt(year)  } : {}),
      },
      include: { teamMember: { select: { id: true, full_name: true, email: true } } },
      orderBy: { created_at: 'asc' },
    });

    // Also return TL target and remaining
    const tlTarget = month && year ? await prisma.teamLeaderTarget.findUnique({
      where: { team_leader_id_month_year: { team_leader_id, month: parseInt(month), year: parseInt(year) } },
    }) : null;

    const allocated = allocations.reduce((s, a) => s + Number(a.allocated_target), 0);
    const remaining = tlTarget ? Number(tlTarget.target_amount) - allocated : null;

    return NextResponse.json({ data: allocations, tl_target: tlTarget, allocated, remaining });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { team_leader_id, team_member_id, month, year, allocated_target, currency, created_by } = await req.json();
    if (!team_leader_id || !team_member_id || !month || !year || allocated_target == null || !created_by)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    // Validation: check TL target exists and won't be exceeded
    const tlTarget = await prisma.teamLeaderTarget.findUnique({
      where: { team_leader_id_month_year: { team_leader_id, month: parseInt(month), year: parseInt(year) } },
    });
    if (!tlTarget) return NextResponse.json({ error: 'No target assigned to this team leader for this month' }, { status: 400 });

    const existing = await prisma.teamTargetAllocation.findMany({
      where: { team_leader_id, month: parseInt(month), year: parseInt(year),
        NOT: { team_member_id } }, // exclude current member in case of update
    });
    const alreadyAllocated = existing.reduce((s, a) => s + Number(a.allocated_target), 0);
    const remaining = Number(tlTarget.target_amount) - alreadyAllocated;

    if (Number(allocated_target) > remaining) {
      return NextResponse.json({
        error: `Allocated target exceeds available budget. Remaining: $${remaining.toFixed(2)}`,
      }, { status: 400 });
    }

    const allocation = await prisma.teamTargetAllocation.upsert({
      where: { team_leader_id_team_member_id_month_year: { team_leader_id, team_member_id, month: parseInt(month), year: parseInt(year) } },
      update: { allocated_target, currency: currency || 'USD' },
      create: { team_leader_id, team_member_id, month: parseInt(month), year: parseInt(year), allocated_target, currency: currency || 'USD', created_by },
    });
    return NextResponse.json({ data: allocation });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
