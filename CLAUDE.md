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
