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

export async function GET() {
  const me = await getCurrentUser();
  if (me?.role !== 'team_leader') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const agents = await prisma.user.findMany({
    where: { team_id: (me as any).team_id ?? undefined, role: 'sales_team' },
    select: { id: true, full_name: true, email: true, status: true, team_id: true, team: { select: { name: true } } },
    orderBy: { full_name: 'asc' },
  });

  const leads = await prisma.salesLead.findMany({
    where: { team_id: (me as any).team_id ?? undefined, status: { in: ['approved', 'assigned'] } },
    select: { created_by: true, collected_amount: true },
  });

  const achieved: Record<string, number> = {};
  for (const l of leads) {
    achieved[l.created_by] = (achieved[l.created_by] ?? 0) + Number(l.collected_amount ?? 0);
  }

  return NextResponse.json({
    data: agents.map(a => ({ ...a, achieved: achieved[a.id] ?? 0 })),
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (me?.role !== 'team_leader') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { full_name, email, password } = await req.json();
  if (!full_name || !email || !password)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: `A user with email ${email} already exists.` }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, role: 'sales_team' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data.user) return NextResponse.json({ error: 'User creation failed' }, { status: 500 });

  await prisma.user.upsert({
    where:  { id: data.user.id },
    update: { full_name, role: 'sales_team', team_id: (me as any).team_id ?? null, status: 'pending', created_by_leader: me.id },
    create: { id: data.user.id, email, full_name, role: 'sales_team', team_id: (me as any).team_id ?? null, status: 'pending', created_by_leader: me.id },
  });

  return NextResponse.json({ success: true });
}
