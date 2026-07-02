import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  // TODO: replace with your actual auth check if this shape differs
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { team_leader_id, account_manager_id } = await req.json();

  if (!team_leader_id || !account_manager_id) {
    return NextResponse.json(
      { error: 'team_leader_id and account_manager_id are required' },
      { status: 400 }
    );
  }

  const [teamLeader, accountManager] = await Promise.all([
    prisma.user.findUnique({ where: { id: team_leader_id } }),
    prisma.user.findUnique({ where: { id: account_manager_id } }),
  ]);

  if (!teamLeader || teamLeader.role !== 'team_leader') {
    return NextResponse.json({ error: 'Invalid team_leader_id' }, { status: 400 });
  }
  if (!accountManager || accountManager.role !== 'account_manager') {
    return NextResponse.json({ error: 'Invalid account_manager_id' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: team_leader_id },
    data: { assigned_account_manager_id: account_manager_id },
  });

  return NextResponse.json(updated);
}

export async function GET(req: NextRequest) {
  // List all TLs with their currently assigned AM (for the Manager's assignment screen)
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamLeaders = await prisma.user.findMany({
    where: { role: 'team_leader' },
    select: {
      id: true,
      full_name: true,
      email: true,
      assigned_account_manager_id: true,
      assigned_account_manager: {
        select: { id: true, full_name: true },
      },
    },
    orderBy: { full_name: 'asc' },
  });

  return NextResponse.json(teamLeaders);
}