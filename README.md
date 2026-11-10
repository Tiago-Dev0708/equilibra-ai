# Equilibra

Sorteio de times equilibrados para jogos entre amigos. Cada jogador tem um nível por modalidade (Alto, Médio ou Baixo) e o sorteio distribui o grupo de forma que a diferença de força entre os times seja a menor possível.

Feito com Next.js 16, React 19, Tailwind CSS 4 e TypeScript.

## Funcionalidades

- **10 modalidades**: Futebol Society, Futsal, Futebol de Campo, Vôlei de Praia, Vôlei Quarteto, Vôlei de Quadra, Basquete, Basquete 3x3, Beach Tennis e Handebol.
- **Nível por modalidade**: cada jogador só aparece nas modalidades que pratica. Alto = 3, Médio = 2 e Baixo = 1 ponto.
- **Posições no vôlei (quarteto e sexteto)**: levantador, ponteiro, central, oposto ou líbero. O sorteio garante ao menos 1 levantador e 2 ponteiros por time e avisa quando faltam jogadores nessas posições.
- **Sorteio equilibrado**: várias tentativas embaralhadas, mantendo a de menor diferença de pontos e com os jogadores de nível alto espalhados entre os times. Depois do sorteio, dá para mover jogadores entre os times manualmente.
- **Lista do WhatsApp**: cole a lista de confirmados (`1. Tiago`, `2 - Lucas`). Numeração e emojis são removidos, quem já está cadastrado é escalado e quem não está é criado.
- **Compartilhar**: copia os times formatados para colar no grupo.
- **Tema claro e escuro**: segue o sistema e pode ser alternado no topo da página.

## Persistência dos dados

A lista de jogadores fica salva em um banco **Upstash Redis** conectado ao projeto pela própria Vercel, compartilhado entre todos os dispositivos que acessam o link.

| Ambiente | Onde salva |
| --- | --- |
| Vercel com Redis conectado | Upstash Redis |
| `npm run dev` sem variáveis | `.data/players.json` (ignorado pelo git) |
| Vercel sem banco | Somente no navegador de cada pessoa |

`src/data/players.json` é a lista inicial, usada enquanto o banco ainda não tem nada salvo.

## Deploy na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `equilibra-ai` e clique em **Deploy**. A Vercel detecta o Next.js automaticamente.
2. No projeto, abra **Storage** > **Create Database** > **Upstash for Redis** (plano gratuito) e conecte ao projeto, marcando todos os ambientes.
3. A Vercel cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`. O app também aceita `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
4. Faça um novo deploy (**Deployments** > **Redeploy**) para o app passar a usar o banco.

O indicador ao lado da lista mostra **Sincronizado** quando o banco está ativo.

> A API de gravação não tem autenticação: qualquer pessoa com o link pode editar a lista. Para um grupo de amigos isso costuma bastar.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000. Para usar o mesmo banco da produção:

```bash
npx vercel link
npx vercel env pull .env.local
```
