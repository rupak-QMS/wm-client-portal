import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      where:   { is_active: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ data: teams });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, created_by } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const team = await prisma.team.create({
      data: { name, description: description || null, created_by: created_by || null },
    });
    return NextResponse.json({ data: team });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
