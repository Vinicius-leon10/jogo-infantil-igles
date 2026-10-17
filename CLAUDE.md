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
  depois dos testes; o rodapé da tela de níveis mostra a versão (commit) em uso.

## Estado atual (atualizar quando mudar)
- `main` (oficial) está em `670f842`; tudo depois disso está só no teste, aguardando o dono pedir
  "pode publicar na versão real" (fast-forward de `claude/sprout-app` para `main`).
- Conteúdo: nível 1 = animais (10 fases, Macieira), nível 2 = números 0–10 (7 fases, Cerejeira). Cores, roupas,
  cômodos, casa e as histórias estão fora por enquanto (histórias dependem das cores).
- Decidido pelo dono: sem aviso de "tire do silencioso" na abertura.

## Lições do iPhone (não repetir)
- O silencioso corta a voz (speechSynthesis), não a música/efeitos: antes de caçar bug de "sem som", pedir para
  conferir o silencioso e o "🔊 Testar voz" da Área dos Pais.
- Som só depois de um toque (por isso a abertura "Toque para começar").
- Não chamar `speechSynthesis.cancel()` sem nada tocando; esperar ~300 ms após cancelar antes de falar de novo.
- Atualizações: o app abre `?v=<build>` quando acha versão nova (o cache do iPhone ignora reload).
- Ilustrações: o dono gera imagens (cachorro, número 1) e o resto segue o estilo; recortar com `scripts/cutout.py`.
