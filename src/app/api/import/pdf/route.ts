import { NextRequest, NextResponse } from 'next/server';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Dynamic import para evitar errores de build en Vercel
    let pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
    try {
      const pdfParseModule = await import('pdf-parse');
      pdfParse =
        (pdfParseModule as unknown as { default?: typeof pdfParse }).default ??
        (pdfParseModule as unknown as typeof pdfParse);
    } catch {
      return NextResponse.json({ 
        error: 'La funcionalidad de importación de PDF no está disponible en este entorno de servidor.' 
      }, { status: 501 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'No se pudo extraer contenido del PDF. Asegúrate de que no esté protegido o vacío.' 
      }, { status: 422 });
    }

    const lines = data.text.split('\n').filter((l: string) => l.trim().length > 0);
    let title = '';
    let markdownLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (i === 0 && !title) {
        title = line;
        markdownLines.push(`# ${line}`);
      } else {
        markdownLines.push(line);
      }
    }

    const markdown = markdownLines.join('\n\n');
    const html = await marked.parse(markdown);

    return NextResponse.json({
      success: true,
      title,
      html,
      pages: data.numpages,
    });

  } catch (error: any) {
    console.error('Error en importador de PDF:', error);
    return NextResponse.json({ 
      error: 'Error interno al procesar el PDF', 
      details: error.message 
    }, { status: 500 });
  }
}
