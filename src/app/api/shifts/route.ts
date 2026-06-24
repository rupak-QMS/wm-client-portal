import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { created_at: 'asc' },
    });
    return NextResponse.json({ data: shifts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, start_time, end_time, description } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const shift = await prisma.shift.create({
      data: { name, start_time: start_time || null, end_time: end_time || null, description: description || null },
    });
    return NextResponse.json({ data: shift });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
