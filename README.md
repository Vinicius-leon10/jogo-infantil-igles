# Sprout 🌱 — Aprenda inglês, broto a broto

App infantil (interface em português) para aprender vocabulário em inglês com um brotinho como companheiro:
2 níveis, 84 fases, 79 palavras, quiz adaptado para quem lê / ainda não lê, jogo da memória e 6 histórias bilíngues.

Recriado a partir do *Sprout — Guia completo de recriação*: mesmo conteúdo, regras de pontuação e identidade visual.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático)
```

## Dois modos

- **Modo local (padrão)** — sem configurar nada. O adulto toca em "Começar neste aparelho", cadastra a criança
  e o progresso fica salvo no `localStorage` deste aparelho.
- **Modo nuvem (Supabase)** — login Google/Apple e progresso sincronizado entre aparelhos:
  1. Crie um projeto em [supabase.com](https://supabase.com).
  2. Rode `supabase/migrations/0001_sprout.sql` no SQL Editor (tabelas + RLS: cada conta só vê os próprios dados).
  3. Em *Authentication → Providers*, ative Google e Apple; em *URL Configuration*, adicione a URL pública do app.
  4. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (chave pública/anon).

## Publicar

`npm run build` gera um site estático em `dist/` — funciona em Vercel, Netlify, Cloudflare Pages ou GitHub Pages
(configure as variáveis `VITE_*` no painel da hospedagem se for usar o modo nuvem). Use HTTPS: microfone e
instalação na tela inicial dependem disso.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/data/content.ts` | Palavras, categorias, fases e níveis |
| `src/data/stories.ts` | As 6 histórias |
| `src/App.tsx` | Controle das telas (níveis → mapa → intro → aprender → quiz → resultado → memória) |
| `src/components/` | Telas e mascote |
| `src/hooks/` | Login, perfil, progresso, voz (TTS) e microfone |
| `src/lib/backend.ts` | Cliente Supabase opcional + helpers de `localStorage` |
| `scripts/make-icons.mjs` | Gera os ícones PNG/ICO a partir de `scripts/sprout-icon.svg` |

## Diferenças em relação ao original (correções das limitações do guia)

- **Desbloqueio de fases pela posição no nível**, não por `id - 1` — no original as fases 101, 111, 121 e 131
  ficavam travadas para sempre. A primeira fase do nível 2 libera junto com o nível (30 de 50 fases do nível 1).
- **Estado de progresso único** (React context) compartilhado por mapa, níveis, histórias e área dos pais.
- **Progresso local separado por conta** (`sprout-progress-v2:<userId>`); trocar de conta não mistura dados.
- **Mesclagem nuvem/local preserva tempos e tentativas**, e o resultado mesclado é enviado de volta à nuvem;
  falhas de rede ficam na fila e são reenviadas (também ao fechar/ocultar a página).
- Idade limitada a 1–12 na interface e no banco; nome validado (1–30).
- `lang="pt-BR"` e zoom permitido.
- Sem dependências do Lovable; SPA Vite + React 19 + Tailwind v4 (sem SSR).

## Atenção

O desafio matemático da área dos pais é só uma barreira para crianças, não um controle de acesso.
Antes de publicar para outras famílias, revise privacidade de dados de menores (consentimento, política
de privacidade, exclusão de conta) — o reconhecimento de voz do navegador pode processar a fala em servidores
do fornecedor do navegador.
