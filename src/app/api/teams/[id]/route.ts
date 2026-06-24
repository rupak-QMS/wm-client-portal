import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description, is_active } = await req.json();
    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(name        !== undefined ? { name }        : {}),
        ...(description !== undefined ? { description } : {}),
        ...(is_active   !== undefined ? { is_active }   : {}),
      },
    });
    return NextResponse.json({ data: team });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
