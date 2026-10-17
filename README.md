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

## Sem login

Não há conta nem login. Na primeira vez o adulto cadastra a criança (nome, idade, menino/menina, sabe ler)
e tudo — perfil e progresso — fica salvo no `localStorage` deste aparelho/navegador. Limpar os dados do
navegador apaga o progresso, e ele não passa de um aparelho para outro.

## Publicar

`npm run build` gera um site estático em `dist/` — funciona em Vercel, Netlify, Cloudflare Pages ou GitHub Pages.
Use HTTPS: microfone e
instalação na tela inicial dependem disso.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/data/content.ts` | Palavras, categorias, fases e níveis |
| `src/data/stories.ts` | As 6 histórias |
| `src/App.tsx` | Controle das telas (níveis → mapa → intro → aprender → quiz → resultado → memória) |
| `src/components/` | Telas e mascote |
| `src/hooks/` | Perfil, progresso, voz (TTS) e microfone |
| `src/lib/storage.ts` | Helpers de `localStorage` |
| `scripts/make-icons.mjs` | Gera os ícones PNG/ICO a partir de `scripts/sprout-icon.svg` |

## Diferenças em relação ao original (correções das limitações do guia)

- **Desbloqueio de fases pela posição no nível**, não por `id - 1` — no original as fases 101, 111, 121 e 131
  ficavam travadas para sempre. A primeira fase do nível 2 libera junto com o nível (30 de 50 fases do nível 1).
- **Estado de progresso único** (React context) compartilhado por mapa, níveis, histórias e área dos pais.
- **Sem login Google/Apple nem banco de dados**: tudo salvo localmente no aparelho.
- Idade limitada a 1–12; nome validado (1–30).
- `lang="pt-BR"` e zoom permitido.
- Sem dependências do Lovable; SPA Vite + React 19 + Tailwind v4 (sem SSR).

## Atenção

O desafio matemático da área dos pais é só uma barreira para crianças, não um controle de acesso.
Nenhum dado é enviado a servidor do app, mas o reconhecimento de voz do navegador pode processar a fala
em servidores do fornecedor do navegador.

## Ilustrações dos animais

Os 14 animais usam ilustrações próprias em vez de emoji (`src/assets/animals/`). O cachorro (`dog.png`) é a
referência de estilo; os demais são vetores gerados por `python3 scripts/make-animals.py`. Para trocar um animal por
uma imagem nova, salve `src/assets/animals/<id>.png` (fundo transparente, quadrado) e apague o `.svg` de mesmo nome.
Palavras sem ilustração continuam mostrando o emoji (componente `src/components/Emoji.tsx`).

## Música e efeitos sonoros

Tudo é sintetizado no navegador (`src/lib/sound.ts`, Web Audio API), sem arquivos de áudio nem direitos autorais:
uma música instrumental alegre em loop toca nas telas de níveis, mapa, introdução da fase e lista de histórias,
e para ao começar o aprendizado/quiz e nas histórias (para não atrapalhar a voz). Há som de acerto, de erro
(suave, sem punir), de par formado no jogo da memória e de fim de fase (fanfarra se passou, melodia de
"tente de novo" se não). O botão "Música" nas telas de níveis e de fases liga/desliga a música (fica salvo no aparelho).

## Site publicado (GitHub Pages)

Endereço: **https://vinicius-leon10.github.io/jogo-infantil-igles/**

O workflow `.github/workflows/deploy.yml` roda a cada push em `main` ou `claude/sprout-app`: gera o build e
publica a pasta `dist/` no branch `gh-pages`. Configuração única no GitHub: *Settings → Pages → Build and
deployment → Source: Deploy from a branch → Branch: `gh-pages` / `(root)`*. (Pages grátis exige repositório público.)
