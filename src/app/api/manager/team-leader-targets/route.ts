import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month   = searchParams.get('month');
    const year    = searchParams.get('year');
    const team_id = searchParams.get('team_id');

    const targets = await prisma.teamLeaderTarget.findMany({
      where: {
        ...(month   ? { month:   parseInt(month) } : {}),
        ...(year    ? { year:    parseInt(year)  } : {}),
        ...(team_id ? { team_id }                 : {}),
      },
      include: {
        teamLeader: { select: { id: true, full_name: true, email: true, team_id: true } },
        team:       { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ data: targets });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { team_leader_id, team_id, month, year, target_amount, currency, created_by } = await req.json();
    if (!team_leader_id || !team_id || !month || !year || !target_amount || !created_by)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const target = await prisma.teamLeaderTarget.upsert({
      where: {
        team_leader_id_team_id_month_year: {
          team_leader_id, team_id,
          month: parseInt(month),
          year:  parseInt(year),
        },
      },
      update: { target_amount, currency: currency || 'USD' },
      create: {
        team_leader_id, team_id,
        month:    parseInt(month),
        year:     parseInt(year),
        target_amount,
        currency: currency || 'USD',
        created_by,
      },
    });
    return NextResponse.json({ data: target });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
