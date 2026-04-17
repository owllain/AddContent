import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      const { email, name, password, cedula } = body;

      if (!email || !name || !password || !cedula) {
        return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }

      // Check if user exists
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 });
      }
      const existingCedula = await db.user.findUnique({ where: { cedula } });
      if (existingCedula) {
        return NextResponse.json({ error: 'Esta cédula ya está registrada' }, { status: 409 });
      }

      const hashedPassword = await hashPassword(password);
      const user = await db.user.create({
        data: { email, name, password: hashedPassword, role: 'VIEWER', cedula },
        select: { id: true, email: true, name: true, role: true, cedula: true },
      });

      const token = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        cedula: user.cedula,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })).toString('base64');

      return NextResponse.json({ success: true, user, token }, { status: 201 });
    }

    if (action === 'login') {
      const { email: identifier, password } = body;

      if (!identifier || !password) {
        return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
      }

      // Buscar por email O por cédula
      const user = await db.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { cedula: identifier }
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
      }

      // Create session token (simple JWT-like approach for AddContent)
      const token = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        cedula: user.cedula,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
      })).toString('base64');

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, cedula: user.cedula },
        token,
      });
    }

  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: error?.message || 'Error del servidor' }, { status: 500 });
  }
}

// GET /api/auth/session?token=xxx
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decoded.exp < Date.now()) {
        return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
      }
      return NextResponse.json({ user: decoded });
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
