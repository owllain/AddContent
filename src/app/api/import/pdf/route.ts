import { NextRequest, NextResponse } from 'next/server';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let processPdf: any;
    try {
      const mod = await import('firecrawl-pdf-inspector');
      processPdf = mod.processPdf;
    } catch {
      return NextResponse.json({ 
        error: 'La funcionalidad de importación de PDF no está disponible en este entorno.' 
      }, { status: 501 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo' }, { status: 400 });
    }

    // Convertir el archivo a Buffer para pdf-inspector
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Procesar el PDF
    const result = processPdf(buffer);

    if (!result || !result.markdown) {
      return NextResponse.json({ 
        error: 'No se pudo extraer contenido del PDF. Asegúrate de que no esté protegido o vacío.' 
      }, { status: 422 });
    }

    // Heurística simple para extraer el título (primera línea si empieza con #)
    let title = '';
    let markdown = result.markdown;
    const lines = markdown.split('\n');
    if (lines.length > 0 && lines[0].startsWith('# ')) {
      title = lines[0].replace('# ', '').trim();
    }

    // Convertir Markdown a HTML
    const html = await marked.parse(markdown);

    return NextResponse.json({
      success: true,
      title: title,
      html: html,
      pdfType: result.pdfType,
    });

  } catch (error: any) {
    console.error('Error en importador de PDF:', error);
    return NextResponse.json({ 
      error: 'Error interno al procesar el PDF', 
      details: error.message 
    }, { status: 500 });
  }
}
