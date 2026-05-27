export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const serialize = (d: any) => JSON.parse(JSON.stringify(d, (_, v) =>
  typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString() : v
));

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month    = parseInt(searchParams.get('month')    || String(new Date().getMonth() + 1));
  const year     = parseInt(searchParams.get('year')     || String(new Date().getFullYear()));
  const memberId = searchParams.get('member_id');

  const dateFrom = new Date(`${year}-${String(month).padStart(2,'0')}-01`);
  const dateTo   = new Date(year, month, 1);

  const where: any = { created_at: { gte: dateFrom, lt: dateTo } };
  if (user.role === 'sales_team') where.created_by = user.id;
  if (memberId) where.created_by = memberId;

  const [
    totalLeads, approvedLeads, rejectedLeads, pendingLeads,
    allMembers, badges, performanceNotes,
  ] = await Promise.all([
    prisma.salesLead.count({ where }),
    prisma.salesLead.count({ where: { ...where, status: { in: ['approved','assigned'] } } }),
    prisma.salesLead.count({ where: { ...where, status: 'rejected' } }),
    prisma.salesLead.count({ where: { ...where, status: 'pending_approval' } }),
    user.role === 'manager' ? prisma.user.findMany({
      where: { role: 'sales_team' },
      select: { id:true, full_name:true, email:true },
    }) : [],
    prisma.salesPerformanceBadge.findMany({
      where: { month, year, ...(user.role === 'sales_team' ? { sales_member_id: user.id } : {}) },
      include: { salesMember: { select: { id:true, full_name:true } } },
    }),
    prisma.salesPerformanceNote.findMany({
      where: { month, year, ...(user.role === 'sales_team' ? { target_user_id: user.id } : {}) },
      include: {
        targetUser: { select: { id:true, full_name:true } },
        author:     { select: { id:true, full_name:true } },
      },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  // Per-member leaderboard (manager only)
  let leaderboard: any[] = [];
  if (user.role === 'manager' && allMembers.length > 0) {
    leaderboard = await Promise.all(allMembers.map(async (m) => {
      const mWhere = { created_at: { gte: dateFrom, lt: dateTo }, created_by: m.id };
      const [total, approved, revenue] = await Promise.all([
        prisma.salesLead.count({ where: mWhere }),
        prisma.salesLead.count({ where: { ...mWhere, status: { in: ['approved','assigned'] } } }),
        prisma.salesLead.aggregate({
          where: { ...mWhere, status: { in: ['approved','assigned'] } },
          _sum: { expected_value: true },
        }),
      ]);
      const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      return {
        member: m,
        total_leads:     total,
        approved_leads:  approved,
        revenue:         Number(revenue._sum.expected_value ?? 0),
        conversion_rate: conversionRate,
      };
    }));
    leaderboard.sort((a, b) => b.approved_leads - a.approved_leads);
  }

  // Revenue from approved leads this month
  const revenueAgg = await prisma.salesLead.aggregate({
    where: { ...where, status: { in: ['approved','assigned'] } },
    _sum: { expected_value: true },
  });

  const conversionRate = totalLeads > 0 ? Math.round((approvedLeads / totalLeads) * 100) : 0;

  return NextResponse.json({
    data: serialize({
      month, year,
      total_leads:     totalLeads,
      approved_leads:  approvedLeads,
      rejected_leads:  rejectedLeads,
      pending_leads:   pendingLeads,
      revenue:         Number(revenueAgg._sum.expected_value ?? 0),
      conversion_rate: conversionRate,
      leaderboard,
      badges,
      performance_notes: performanceNotes,
    }),
  });
}