import { NextResponse }                       from 'next/server';
import prisma                                from '@/lib/prisma';
import { getCurrentUser }                    from '@/lib/auth';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET — manager fetches all pending agents
export async function GET() {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const agents = await prisma.user.findMany({
    where: { status: 'pending' },
    select: {
      id: true, full_name: true, email: true,
      sales_team_group: true, created_by_leader: true, created_at: true,
    },
    orderBy: { created_at: 'desc' },
  });

  // Attach leader names
  const leaderIds = [...new Set(agents.map(a => a.created_by_leader).filter(Boolean))] as string[];
  const leaders   = leaderIds.length
    ? await prisma.user.findMany({ where: { id: { in: leaderIds } }, select: { id: true, full_name: true } })
    : [];
  const leaderMap = Object.fromEntries(leaders.map(l => [l.id, l.full_name]));

  return NextResponse.json({
    data: agents.map(a => ({ ...a, leader_name: leaderMap[a.created_by_leader ?? ''] ?? '—' })),
  });
}

// PATCH — manager approves or rejects a pending agent
export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (me?.role !== 'manager') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id, action } = await req.json();
  const admin = getAdminClient();

  if (action === 'approve') {
    await prisma.user.update({ where: { id }, data: { status: 'active' } });
    return NextResponse.json({ success: true });
  }

  if (action === 'reject') {
    await prisma.user.delete({ where: { id } });
    await admin.auth.admin.deleteUser(id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}