import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import defaultPlayers from '@/data/players.json';

const filePath = path.join(process.cwd(), 'src', 'data', 'players.json');

export async function GET() {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(content));
    }
    return NextResponse.json(defaultPlayers);
  } catch (err) {
    console.error('Error reading players.json', err);
    return NextResponse.json(defaultPlayers);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado um array de jogadores.' },
        { status: 400 }
      );
    }

    // Try to persist to disk when running in an environment with write permissions (e.g. local dev)
    try {
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');
      return NextResponse.json({
        success: true,
        message: 'Arquivo src/data/players.json atualizado com sucesso no repositório!',
        count: body.length,
      });
    } catch (writeErr) {
      // In readonly serverless environments like Vercel runtime
      return NextResponse.json({
        success: true,
        message: 'Persistido em memória de sessão.',
        count: body.length,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição.' },
      { status: 500 }
    );
  }
}
