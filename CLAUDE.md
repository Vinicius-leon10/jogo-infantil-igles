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
  (republicar com o Artifact tool a partir do HTML gerado por `scripts/build-claude-test.py`; o build precisa de
  `--emptyOutDir`, senão sobra CSS antigo — o script agora recusa pasta com mais de um .js/.css). Comando:
  `SPROUT_ENV=teste GITHUB_SHA=$(git rev-parse HEAD) npx vite build --outDir <tmp>/dist --emptyOutDir` e depois
  `python3 scripts/build-claude-test.py <tmp>/dist scripts/claude-test-template.html <tmp>/sprout-teste.html`.
  Usar SEMPRE esse template do repo: um HTML baixado do artifact traz o CSS velho junto (já publicou o mapa sem a
  animação duas vezes).
- Teste no GitHub Pages: https://vinicius-leon10.github.io/jogo-infantil-igles/teste/ (branch `claude/sprout-app`).
- Oficial: https://vinicius-leon10.github.io/jogo-infantil-igles/ (branch `main`). O deploy roda no GitHub Actions
  depois dos testes; só na versão de teste o rodapé da tela de níveis mostra a versão (commit) em uso
  (escondido na oficial a pedido do dono).

## Estado atual (atualizar quando mudar)
- Oficial atualizada pelo PR #5 (juntado em `main` a pedido do dono) com tudo até o commit que contém esta linha
  (inclui o mapa limpo, o som que dorme com o celular bloqueado, a aba Falas e as vozes novas de Lion, Monkey, One,
  Seven e Ten). As ferramentas de avaliação continuam só no teste (atrás de `__APP_ENV__ === "teste"`). Mudanças depois disso ficam só no teste até o dono pedir para publicar (novo PR
  de `claude/sprout-app` para `main`).
- Fontes: o dono viu as opções (Baloo 2/Andika/Sniglet) e decidiu manter Fredoka + Nunito por enquanto.
- Conteúdo: nível 1 = animais (10 fases, Macieira), nível 2 = números 0–10 (7 fases, Cerejeira), nível 3 = cores
  (11: red, blue, yellow, green, orange, purple, pink, brown, black, white, gray; 7 fases "Cor N", IDs 301+, Laranjeira).
  Roupas, cômodos, casa e as histórias estão fora por enquanto (as histórias já podem voltar: dependiam das cores).
- Figuras das cores: o dono mandou a mancha azul; as outras saem dela com `python3 scripts/recolor.py <azul.png>
  <saida.png> <#cor|white|black|gray>` (mantém brilho, sombra e rostinho; branco ganha borda cinza).
- PARA VER DEPOIS (pedido do dono): o repositório `emilkowalski/skills` no GitHub tem uma skill com design no estilo
  Apple; olhar e propor o que dá para aproveitar no visual do Sprout (sem mudar nada antes do dono aprovar).
- Só na versão de teste (`__APP_ENV__ === "teste"`, a pedido do dono): todas as fases/níveis liberados, Área dos Pais
  sem a conta de adulto e com "Ouvir todas as palavras" (figura + áudio gravado de cada animal e número). São
  ferramentas de avaliação do dono e NUNCA devem valer na oficial: manter sempre atrás de `__APP_ENV__ === "teste"`
  (o código vai para `main` junto, mas fica desligado lá; R03/R04/R38 garantem os bloqueios e a conta na oficial).
- Decidido pelo dono: sem estilo Apple/visual adulto (viu exemplos e não gostou); manter o visual infantil atual.
- Decidido pelo dono: sem aviso de "tire do silencioso" na abertura.
- Voz: o iPhone NÃO libera a Ava (nem vozes Premium/Aprimoradas) para apps web — confirmado pela lista do
  "Teste de som": só Samantha, Daniel, Karen, Moira, Tessa, Rishi e vozes "engraçadas". O app usa Samantha.
- Áudios gravados (ElevenLabs, voz Jessica, velocidade 0,7 — a mais lenta; 0,9 o dono achou rápida): `node scripts/make-voices.mjs` gera `src/assets/voice/<id>.mp3` para
  os 14 animais e zero..ten (pula os que já existem; `--force` regrava). O app toca esses MP3 pelo Web Audio (funciona
  no silencioso) e usa speechSynthesis só como reserva (frases, Testar voz, MP3 que não carregou). Publicados na
  oficial pelo PR #4. Palavra nova no conteúdo = rodar o script de novo. Nunca pedir a
  chave no chat (fica no ambiente como `ELEVENLABS_API_KEY`). Diagnóstico: aba "Falas" da Área dos Pais (Teste de som; no teste também "Ouvir todas as palavras") mostra
  "🐶 Testar áudio gravado", o último áudio (tocou / bloqueado / não carregou) e o estado do som do app.
- Trocar a voz de uma palavra: `node scripts/make-voices.mjs --takes <ids>` grava 3 versões em
  `src/assets/voice-takes/<id>-a|b|c.mp3`. Na versão de teste, aba Falas → "Escolher vozes" toca atual/A/B/C, o dono
  marca a melhor (fica no aparelho e o app de teste já usa) e manda o resumo ("Lion: B, …"). Com o resumo: copiar a
  escolhida por cima de `src/assets/voice/<id>.mp3` e apagar as takes da palavra (as "atual" não precisam de nada).
  As takes nunca vão para a oficial: o build oficial troca `src/lib/voiceTakes.ts` por `voiceTakes.none.ts`
  (vite.config.ts), então nem copia os arquivos; teste R45.
- Pronúncia: o dono escolheu Lion C, Monkey B, One C e Seven B (já copiadas para `src/assets/voice/`). As takes tentam
  jeitos diferentes de acertar o inglês (TAKES em make-voices.mjs): A = multilingual_v2 com contexto em inglês,
  B = flash_v2 com `<phoneme>` ARPAbet, C = turbo_v2 (só inglês); 2ª rodada com `--labels=d,e,f`: D = turbo_v2 +
  `<phoneme>`, E = multilingual_v2 na sequência (contando), F = turbo_v2_5 com language_code en. A chave não tem
  permissão de speech_to_text, então não dá para conferir por transcrição; quem decide é o ouvido do dono.
  3ª rodada `--labels=g,h,i`: G = turbo_v2 sem exclamação, H = flash_v2 com `<phoneme>` IPA, I = turbo_v2 com
  grafia do som (RESPELL).
- "Tene" (dono): a voz segura o "n" final ~200 ms quase no volume da vogal e solta, o que soa como um "e" a mais.
  Não adianta regravar: `python3 scripts/trim-nasal.py <in> <out> --keep <ms>` acha o começo do "n" (som abafado,
  pouca energia acima de 1 kHz) e deixa só alguns ms com fade. Serve para outras palavras que terminem em n/m.
- Ten: o dono escolheu K (a atual cortada com `trim-nasal.py --keep 60 --fade 45`), já em `src/assets/voice/ten.mp3`.
- Mais lento sem mudar o tom: `python3 scripts/slow-voice.py <in> <out> --tempo 0.65 --tail-ms 370` (rubberband;
  `--tail-ms` deixa o "n" curto de fora para não voltar o "tene").
- Brown: o dono escolheu J (a atual com o "n" final cortado, trim-nasal.py --keep 60 --fade 45), já em
  `src/assets/voice/brown.mp3`.
- Elogios do fim de fase também são gravados (Great job, Awesome, Well done, Fantastic, Amazing, You did it, Perfect;
  turbo_v2, em make-voices.mjs) e o app acha pelo texto só com letras ("You did it!" → youdidit.mp3).
- Fim de fase com 100% (pedido do dono): "Perfeito!", "Perfect!" na voz gravada, estrelas com "plim" (playStar),
  sprout pulando (animate-hop), confete dos dois lados e as figuras da fase com ✓ para ouvir de novo (R48/R49).
  Ordem do som: fanfarra → um "plim" por estrela → só então o elogio, sozinho (antes tocava tudo junto; R50).
- Green: o dono escolheu J (a atual com o "n" final cortado), já em `src/assets/voice/green.mp3`.
- Em avaliação agora: Orange — A/B/C não serviram; takes D (turbo_v2 + `<phoneme>`), F (turbo_v2_5 en),
  H (flash_v2 + IPA ˈɔrɪndʒ) e I (turbo_v2 com "Or-inj"). O fim do Orange não tem som sobrando (termina no "dj"),
  então o problema que o dono ouve está no meio da palavra.

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
- Silencioso: no iOS 17+ basta `navigator.audioSession.type = "playback"`; o `<audio>` mudo em repetição só é usado
  em iPhone antigo, porque ele faz o iPhone mostrar o app como player na tela bloqueada (mesmo pausado) (R42).
- Ao bloquear o celular / sair do app (`visibilitychange` hidden, `pagehide`) o som dorme: para a música, desliga o
  áudio mudo, suspende o Web Audio e devolve a sessão ("auto"); ao voltar, a música retoma e o próximo toque
  pega a sessão "playback" de novo (R41/R42).
- Atualizações: o app abre `?v=<build>` quando acha versão nova (o cache do iPhone ignora reload).
- Ilustrações: o dono gera imagens (cachorro, número 1) e o resto segue o estilo; recortar com `scripts/cutout.py`.
