import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import defaultPlayers from '@/data/players.json';

const filePath = path.join(process.cwd(), 'src', 'data', 'players.json');

// Check available storage providers
function getStorageConfig() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const ghToken = process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GITHUB_REPO; // e.g. "username/equilibra-ai"

  return {
    hasKV: Boolean(kvUrl && kvToken),
    kvUrl,
    kvToken,
    hasGitHub: Boolean(ghToken && ghRepo),
    ghToken,
    ghRepo,
  };
}

export async function GET() {
  const config = getStorageConfig();

  // 1. Try Vercel KV / Upstash Redis
  if (config.hasKV && config.kvUrl && config.kvToken) {
    try {
      const res = await fetch(`${config.kvUrl}/get/equilibra_players`, {
        headers: { Authorization: `Bearer ${config.kvToken}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          return NextResponse.json(parsed, {
            headers: { 'x-storage-provider': 'vercel-kv' },
          });
        }
      }
    } catch (kvErr) {
      console.error('Error fetching from KV:', kvErr);
    }
  }

  // 2. Try GitHub API
  if (config.hasGitHub && config.ghToken && config.ghRepo) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${config.ghRepo}/contents/src/data/players.json`,
        {
          headers: {
            Authorization: `Bearer ${config.ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Equilibra-AI',
          },
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const fileData = await res.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return NextResponse.json(JSON.parse(content), {
          headers: { 'x-storage-provider': 'github-api' },
        });
      }
    } catch (ghErr) {
      console.error('Error fetching from GitHub:', ghErr);
    }
  }

  // 3. Try Local File System (works in local dev)
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(content), {
        headers: { 'x-storage-provider': 'local-fs' },
      });
    }
  } catch (fsErr) {
    console.error('Error reading local file:', fsErr);
  }

  // Fallback to bundled json
  return NextResponse.json(defaultPlayers, {
    headers: { 'x-storage-provider': 'bundled-fallback' },
  });
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

    const config = getStorageConfig();
    let savedProvider = 'none';

    // 1. Save to Vercel KV / Upstash Redis
    if (config.hasKV && config.kvUrl && config.kvToken) {
      try {
        const res = await fetch(`${config.kvUrl}/set/equilibra_players`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.kvToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify(body)),
        });
        if (res.ok) {
          savedProvider = 'vercel-kv';
        }
      } catch (kvErr) {
        console.error('Error saving to KV:', kvErr);
      }
    }

    // 2. Save directly to GitHub via API (updates src/data/players.json in the repo!)
    if (config.hasGitHub && config.ghToken && config.ghRepo) {
      try {
        // First get current SHA
        let sha: string | undefined;
        const getRes = await fetch(
          `https://api.github.com/repos/${config.ghRepo}/contents/src/data/players.json`,
          {
            headers: {
              Authorization: `Bearer ${config.ghToken}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Equilibra-AI',
            },
          }
        );
        if (getRes.ok) {
          const existing = await getRes.json();
          sha = existing.sha;
        }

        // Now commit the updated file
        const updateRes = await fetch(
          `https://api.github.com/repos/${config.ghRepo}/contents/src/data/players.json`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${config.ghToken}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Equilibra-AI',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'chore(data): atualizar lista de jogadores via painel Equilibra.ai',
              content: Buffer.from(JSON.stringify(body, null, 2)).toString('base64'),
              sha,
            }),
          }
        );

        if (updateRes.ok) {
          savedProvider = savedProvider === 'none' ? 'github-api' : `${savedProvider}+github-api`;
        }
      } catch (ghErr) {
        console.error('Error committing to GitHub:', ghErr);
      }
    }

    // 3. Save to local filesystem if running in local environment
    try {
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');
      if (savedProvider === 'none') {
        savedProvider = 'local-fs';
      }
    } catch {
      // Serverless read-only environment without KV/GitHub set
    }

    return NextResponse.json({
      success: true,
      provider: savedProvider,
      count: body.length,
      message:
        savedProvider === 'vercel-kv'
          ? 'Salvo com sucesso na nuvem Vercel KV!'
          : savedProvider.includes('github-api')
          ? 'Salvo com commit automático no seu repositório GitHub!'
          : savedProvider === 'local-fs'
          ? 'Salvo no arquivo local src/data/players.json!'
          : 'Salvo na sessão local do navegador.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição.' },
      { status: 500 }
    );
  }
}
