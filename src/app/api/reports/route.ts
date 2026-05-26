import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

function serializeBigInt(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? Number(v) : v
  ));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');

  const where: any = {};
  if (clientId) where.client_id = clientId;
  if (user.role === 'account_manager') {
    where.client = { assigned_account_manager: user.id };
  }
  if (user.role === 'client') {
    where.client = { email: user.email };
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      client:   { select: { id: true, company_name: true } },
      uploader: { select: { id: true, full_name: true } },
      comments: {
        include: {
          user: { select: { id: true, full_name: true, avatar_url: true } },
        },
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data: serializeBigInt(reports) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();

  if (!body.client_id || !body.report_type || !body.title || !body.file_url || !body.file_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
  }

  const report = await prisma.report.create({
    data: {
      client_id:   body.client_id,
      report_type: body.report_type,
      title:       body.title,
      description: body.description ?? null,
      file_url:    body.file_url,
      file_name:   body.file_name,
      file_size:   body.file_size ?? null,
      mime_type:   body.mime_type ?? null,
      uploaded_by: user.id,
    },
    include: { client: true },
  });

  return NextResponse.json({ data: serializeBigInt(report) }, { status: 201 });
}
