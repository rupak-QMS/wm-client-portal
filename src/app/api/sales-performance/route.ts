export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const serialize = (d: any) => JSON.parse(JSON.stringify(d, (_, v) =>
  typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString() : v
));

// Award a badge
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager')
    return NextResponse.json({ error: 'Only managers can award badges' }, { status: 403 });

  const { sales_member_id, month, year, badge_type, note } = await req.json();
  if (!sales_member_id || !month || !year || !badge_type)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });

  const badge = await prisma.salesPerformanceBadge.create({
    data: {
      sales_member_id, month: parseInt(month), year: parseInt(year),
      badge_type, note, awarded_by: user.id,
    },
    include: { salesMember: { select: { id:true, full_name:true } } },
  });

  return NextResponse.json({ data: serialize(badge) }, { status: 201 });
}

// Add performance note / bonus
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager')
    return NextResponse.json({ error: 'Only managers can add notes' }, { status: 403 });

  const { target_user_id, month, year, note, bonus_amount, currency } = await req.json();
  if (!target_user_id || !month || !year || !note)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });

  const perfNote = await prisma.salesPerformanceNote.create({
    data: {
      target_user_id, author_id: user.id,
      month: parseInt(month), year: parseInt(year),
      note,
      bonus_amount: bonus_amount ? parseFloat(bonus_amount) : null,
      currency: currency || 'USD',
    },
    include: {
      targetUser: { select: { id:true, full_name:true } },
      author:     { select: { id:true, full_name:true } },
    },
  });

  return NextResponse.json({ data: serialize(perfNote) }, { status: 201 });
}