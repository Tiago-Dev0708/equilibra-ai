import { NextResponse, connection } from 'next/server';
import { getStorageMode, readPlayers, writePlayers } from '@/lib/server/players-store';
import { sanitizePlayers } from '@/lib/validate';

const MAX_BODY_BYTES = 512 * 1024;
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  // Sempre executa por requisição: com Cache Components ativo, um GET que só
  // lê arquivo poderia ser pré-renderizado no build e ficar congelado.
  await connection();

  try {
    const result = await readPlayers();
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/players] falha ao ler', err);
    return NextResponse.json(
      { error: 'Não foi possível carregar os jogadores.' },
      { status: 502, headers: NO_STORE }
    );
  }
}

export async function POST(request: Request) {
  if (getStorageMode() === 'none') {
    return NextResponse.json(
      {
        error: 'storage_unavailable',
        message: 'Nenhum banco conectado. Conecte o Upstash Redis na aba Storage da Vercel.',
      },
      { status: 503, headers: NO_STORE }
    );
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400, headers: NO_STORE });
  }

  const players = sanitizePlayers(body);
  if (!players) {
    return NextResponse.json(
      { error: 'Formato inválido. Esperado um array de jogadores com id, name e elos.' },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const storage = await writePlayers(players);
    return NextResponse.json({ ok: true, storage, count: players.length }, { headers: NO_STORE });
  } catch (err) {
    console.error('[api/players] falha ao salvar', err);
    return NextResponse.json(
      { error: 'Não foi possível salvar os jogadores.' },
      { status: 502, headers: NO_STORE }
    );
  }
}
