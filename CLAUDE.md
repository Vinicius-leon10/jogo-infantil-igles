# Sprout — instruções do projeto

App infantil de inglês (Vite + React 19 + Tailwind v4). Interface e conversa com o dono em português.

## Fluxo de publicação
- Toda mudança vai para o branch `claude/sprout-app` e para o link de teste no Claude
  (`python3 scripts/build-claude-test.py` sobre um build com `SPROUT_ENV=teste`).
- Só mesclar em `main` (versão real) quando o dono pedir explicitamente.

## Testes de regressão (obrigatório)
- Todo bug corrigido ganha um teste em `tests/regressao.spec.ts` com o próximo número `R..` e uma linha em
  `tests/README.md`. Escreva o teste primeiro e confirme que ele falha sem a correção.
- Antes de cada push: `npx tsc --noEmit` e `npm test` precisam passar. O GitHub Actions roda os mesmos testes e
  bloqueia a publicação se algum falhar.

## Endereços
- Teste no Claude (link que o dono usa): https://claude.ai/artifact/N7JrhLNphV4CroyejAFHyf
  (republicar com o Artifact tool a partir do HTML gerado por `scripts/build-claude-test.py`).
- Teste no GitHub Pages: https://vinicius-leon10.github.io/jogo-infantil-igles/teste/ (branch `claude/sprout-app`).
- Oficial: https://vinicius-leon10.github.io/jogo-infantil-igles/ (branch `main`). O deploy roda no GitHub Actions
  depois dos testes; só na versão de teste o rodapé da tela de níveis mostra a versão (commit) em uso
  (escondido na oficial a pedido do dono).

## Estado atual (atualizar quando mudar)
- Oficial atualizada pelo PR #3 (juntado em `main`) com tudo até o commit que contém esta linha (inclui a
  paleta "Dia ensolarado" e a voz Ava). Mudanças depois disso ficam só no teste até o dono pedir para publicar (novo PR
  de `claude/sprout-app` para `main`).
- Fontes: o dono viu as opções (Baloo 2/Andika/Sniglet) e decidiu manter Fredoka + Nunito por enquanto.
- Conteúdo: nível 1 = animais (10 fases, Macieira), nível 2 = números 0–10 (7 fases, Cerejeira). Cores, roupas,
  cômodos, casa e as histórias estão fora por enquanto (histórias dependem das cores).
- Decidido pelo dono: sem aviso de "tire do silencioso" na abertura.
- Voz: o iPhone NÃO libera a Ava (nem vozes Premium/Aprimoradas) para apps web — confirmado pela lista do
  "Teste de som": só Samantha, Daniel, Karen, Moira, Tessa, Rishi e vozes "engraçadas". O app usa Samantha.
- Áudios gravados (ElevenLabs, voz Jessica): `node scripts/make-voices.mjs` gera `src/assets/voice/<id>.mp3` para
  os 14 animais e zero..ten (pula os que já existem; `--force` regrava). O app toca esses MP3 pelo Web Audio (funciona
  no silencioso) e usa speechSynthesis só como reserva (frases, Testar voz, MP3 que não carregou). Estão SÓ no teste;
  a oficial (`main`) não recebe até o dono pedir. Palavra nova no conteúdo = rodar o script de novo. Nunca pedir a
  chave no chat (fica no ambiente como `ELEVENLABS_API_KEY`). Diagnóstico: "Teste de som" da Área dos Pais mostra
  "🐶 Testar áudio gravado", o último áudio (tocou / bloqueado / não carregou) e o estado do som do app.

## Visual
- Paleta "Dia ensolarado" (escolhida pelo dono): céu azul-claro → creme, cartões brancos, verde-grama `--sprout`
  (texto verde usa `--sprout-ink`), amarelo-sol, coral e azul. Tema único claro; mapa é um campo de dia.
- Botões "fofinhos" 3D: classes `btn-3d` (verde) e `btn-3d-soft` / `btn-3d-blue` / `btn-3d-coral`; texto escuro
  sobre o verde (branco não tem contraste). Fonte base 17px e `--radius` 1.6rem.

## Lições do iPhone (não repetir)
- O silencioso corta a voz (speechSynthesis), não a música/efeitos: antes de caçar bug de "sem som", pedir para
  conferir o silencioso e o "🔊 Testar voz" da Área dos Pais.
- Som só depois de um toque (por isso a abertura "Toque para começar").
- Qualquer fala do speechSynthesis (até a fala em branco do desbloqueio) deixa o Web Audio "interrupted" por um
  instante: o áudio gravado espera até 2 s o som voltar antes de cair na voz do aparelho.
- Não chamar `speechSynthesis.cancel()` sem nada tocando; esperar ~300 ms após cancelar antes de falar de novo.
- Atualizações: o app abre `?v=<build>` quando acha versão nova (o cache do iPhone ignora reload).
- Ilustrações: o dono gera imagens (cachorro, número 1) e o resto segue o estilo; recortar com `scripts/cutout.py`.
