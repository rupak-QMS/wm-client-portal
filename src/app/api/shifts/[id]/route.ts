import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, start_time, end_time, description, is_active } = await req.json();
    const shift = await prisma.shift.update({
      where: { id },
      data: {
        ...(name !== undefined        ? { name }       : {}),
        ...(start_time !== undefined  ? { start_time } : {}),
        ...(end_time !== undefined    ? { end_time }   : {}),
        ...(description !== undefined ? { description }: {}),
        ...(is_active !== undefined   ? { is_active }  : {}),
      },
    });
    return NextResponse.json({ data: shift });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
