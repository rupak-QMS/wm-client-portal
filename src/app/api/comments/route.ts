import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('report_id');

  const comments = await prisma.comment.findMany({
    where:   reportId ? { report_id: reportId } : {},
    include: {
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
    orderBy: { created_at: 'asc' },
  });

  const serialized = comments.map(c => ({
    ...c,
    created_at: c.created_at.toISOString(),
  }));

  return NextResponse.json({ data: serialized });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { report_id, comment } = await req.json();

  if (!report_id || !comment?.trim()) {
    return NextResponse.json({ error: 'report_id and comment required' }, { status: 422 });
  }

  const newComment = await prisma.comment.create({
    data: { report_id, user_id: user.id, comment: comment.trim() },
    include: {
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
  });

  return NextResponse.json({
    data: {
      ...newComment,
      created_at: newComment.created_at.toISOString(),
    }
  }, { status: 201 });
}
