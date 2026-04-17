import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, cedula: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, cedula, password, role } = body;

    if (!name || !email || !cedula || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const existingEmail = await db.user.findUnique({ where: { email }});
    if (existingEmail) return NextResponse.json({ error: 'El correo electrónico ya existe' }, { status: 409 });

    const existingCedula = await db.user.findUnique({ where: { cedula }});
    if (existingCedula) return NextResponse.json({ error: 'La cédula ya está registrada' }, { status: 409 });

    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: { name, email, cedula, password: hashedPassword, role: role || 'VIEWER' },
      select: { id: true, name: true, email: true, role: true, cedula: true }
    });
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, cedula, role, password } = body;

    if (!id) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });

    const updateData: any = { name, email, cedula, role };
    if (password && password.trim().length > 0) {
      updateData.password = await hashPassword(password);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, cedula: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
