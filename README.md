# ⚖️ Equilibra.ai — Sorteador de Times Equilibrados por Elo

O **Equilibra.ai** é uma aplicação web moderna e minimalista para sorteio justo de times em diversas modalidades esportivas. O algoritmo distribui os jogadores balanceando a pontuação técnica (High Elo, Mid Elo, Low Elo) e a quantidade de jogadores em cada equipe.

Desenvolvido exclusivamente com **Next.js 16**, **Tailwind CSS 4** e **TypeScript**.

---

## 🚀 Funcionalidades

- **Modalidades Esportivas Pré-configuradas**:
  - ⚽ Futebol Society (6x6)
  - 👟 Futsal (5x5)
  - ⚽ Futebol de Campo (11x11)
  - 🏖️ Vôlei de Praia (Dupla Mista - 2x2)
  - 🏐 Vôlei (Quarteto Misto - 4x4)
  - 🏐 Vôlei de Quadra (Sexteto Misto - 6x6)
  - 🏀 Basquete (5x5) e Basquete 3x3
  - 🎾 Beach Tennis (Dupla - 2x2)
  - 🤾 Handebol (7x7)

- **Elo Individual por Esporte**:
  - **High Elo (Craque)**: 3 pontos
  - **Mid Elo (Mediano)**: 2 pontos
  - **Low Elo (Iniciante)**: 1 ponto
  - Cada jogador só tem ativos os esportes que ele **realmente pratica** (não fica tudo marcado como Mid).

- **Sorteio Balanceado por Algoritmo**:
  - Snake draft com otimização Monte Carlo para garantir diferença mínima de força entre os times.
  - Distribuição uniforme dos jogadores de High Elo.
  - Diagnóstico de força dos times em tempo real.
  - Opção de remanejar jogadores manualmente entre os times após o sorteio com 1 clique.

- **Importação Direta do WhatsApp**:
  - Botão **"Colar do WhatsApp"**: cole a lista de confirmados (`1. Tiago`, `2 - Lucas`) e o sistema limpa os números, localiza os jogadores existentes ou cadastra os novos automaticamente.

- **Compartilhamento**:
  - Botão **"Copiar para WhatsApp"**: formata os times com emojis pronto para colar no grupo.

---

## ☁️ Como funciona a Persistência na Vercel (Sem precisar de git push manual)

Em ambientes Serverless como a Vercel, o sistema de arquivos da máquina é somente-leitura. O **Equilibra.ai** possui suporte nativo a duas formas de sincronização permanente na nuvem:

### Opção 1: Vercel KV / Upstash Redis (Recomendado — 1 Clique na Vercel)
1. No painel do seu projeto na [Vercel](https://vercel.com):
2. Clique na aba **Storage** → **Connect Database** → **KV (Upstash)**.
3. A Vercel conecta as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` automaticamente.
4. Pronto! Qualquer alteração de jogadores feita de qualquer celular ou computador é salva e sincronizada na nuvem instantaneamente.

### Opção 2: Commit Automático no seu GitHub
Se você prefere que o próprio arquivo `src/data/players.json` no seu repositório seja commitado a cada alteração:
1. Crie um **Personal Access Token** no GitHub (com permissão `repo` / `contents:write`).
2. Adicione 2 variáveis de ambiente no projeto da Vercel:
   - `GITHUB_TOKEN`: seu token do GitHub
   - `GITHUB_REPO`: `seu-usuario/seu-repositorio` (ex: `tiago/equilibra-ai`)
3. A cada alteração feita na interface, a API do app faz o commit direto no seu repositório!

---

## 💻 Executando Localmente

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Acesse no navegador
http://localhost:3000
```

---

## 📦 Como Subir no GitHub e Deployar na Vercel

```bash
# 1. Crie o repositório no seu GitHub (público)
# 2. Adicione o remote e envie:
git remote add origin https://github.com/SEU_USUARIO/equilibra-ai.git
git branch -M main
git push -u origin main
```

Na [Vercel](https://vercel.com):
1. Clique em **"Add New..."** → **"Project"**.
2. Importe o repositório `equilibra-ai`.
3. Clique em **"Deploy"** (a Vercel detecta Next.js automaticamente).
