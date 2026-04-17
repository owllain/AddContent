import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/nodes?parentId=null — Get tree structure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parentId = searchParams.get('parentId');
    const slug = searchParams.get('slug');
    const all = searchParams.get('all') === 'true';

    // Get single node by slug
    if (slug) {
      const node = await db.node.findUnique({
        where: { slug },
        include: {
          author: { select: { id: true, name: true } },
          children: {
            where: { published: true },
            orderBy: { order: 'asc' },
            select: { id: true, title: true, slug: true, icon: true, order: true },
          },
        },
      });
      if (!node) {
        return NextResponse.json({ error: 'Nodo no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ node });
    }

    // Get all nodes as flat list (for admin)
    if (all) {
      const nodes = await db.node.findMany({
        orderBy: [{ order: 'asc' }, { title: 'asc' }],
        include: {
          author: { select: { id: true, name: true } },
          children: {
            orderBy: { order: 'asc' },
            include: {
              author: { select: { id: true, name: true } },
            },
          },
        },
      });
      return NextResponse.json({ nodes });
    }

    // Get root nodes or children of parentId
    const where = parentId === 'null' || !parentId
      ? { parentId: null, published: true }
      : { parentId, published: true };

    const nodes = await db.node.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: { published: true },
          orderBy: { order: 'asc' },
          select: { id: true, title: true, slug: true, icon: true, order: true },
        },
      },
    });

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Nodes GET error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// POST /api/nodes — Create new node
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, content, icon, parentId, published, authorId } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Título y slug son requeridos' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.node.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Este slug ya existe' }, { status: 409 });
    }

    // Get max order for siblings
    const siblingsCount = await db.node.count({
      where: parentId ? { parentId } : { parentId: null },
    });

    const node = await db.node.create({
      data: {
        title,
        slug,
        content: content || '',
        icon: icon || 'FileText',
        parentId: parentId || null,
        published: published !== undefined ? published : true,
        authorId: authorId || null,
        order: siblingsCount,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error('Nodes POST error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// PUT /api/nodes — Update node
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, slug, content, icon, parentId, published, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (icon !== undefined) updateData.icon = icon;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (published !== undefined) updateData.published = published;
    if (order !== undefined) updateData.order = order;

    const node = await db.node.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Nodes PUT error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// DELETE /api/nodes?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    await db.node.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Nodes DELETE error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
