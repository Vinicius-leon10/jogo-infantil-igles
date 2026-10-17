# Testes de regressão

Cada bug corrigido ou comportamento ajustado tem um teste aqui. Se um deles voltar, o teste falha e a
publicação (teste e real) é bloqueada no GitHub Actions.

Rodar: `npm test` (gera as duas versões do app, abre um Chromium em tamanho de celular e executa tudo).

| ID | O que garante | Origem |
|---|---|---|
| R01 | App abre sem login, direto no cadastro da criança | Login removido a pedido |
| R02 | Fluxo completo (cadastro → aprender → quiz → resultado) salva progresso e libera a próxima fase; nenhum arquivo falta no subendereço do GitHub Pages | Publicação em `/jogo-infantil-igles/` |
| R03 | Nível 2 bloqueado com 5 das 10 fases do nível 1 e liberado com 6 | Regra dos 60% |
| R04 | Fases liberam pela ordem dentro do nível (IDs pulam de 10 para 201), não por `id - 1` | Bug do guia original: blocos travados |
| R05 | Estrelas nos limites 59/60/79/80/94/95, XP e arredondamento da nota | Regras de pontuação do guia |
| R06 | Voz em inglês, velocidade 0,7 | "Voz rápida" (0,78) e depois "lenta" (0,6) |
| R07 | No modo leitura, o nome do animal anterior não toca na pergunta seguinte | "Som errado do animal" no quiz |
| R08 | Quem não lê só recebe perguntas de áudio com opções em imagem | Regra do guia |
| R09 | Animais aparecem como ilustração, não emoji | Ilustrações no estilo do cachorro |
| R10 | Música toca nos menus após um toque, para no aprender/quiz e o botão desliga | Música sem som no iPhone; botão de música |
| R11 | Sons de acerto, erro e fim de fase tocam | Efeitos sonoros |
| R12 | Cabeçalho fica abaixo da barra do relógio / Dynamic Island do iPhone | Topo escondido no app instalado |
| R13 | Cada tela abre no topo, sem herdar a rolagem do mapa | Cabeçalho sumindo ao sair do mapa |
| R15 | Versão de teste mostra o selo e guarda dados separados; a real não mostra o selo | Versão de teste × real |
| R16 | App recarrega sozinho quando uma versão nova é publicada | iPhone abrindo versão antiga (cache) |
| R17 | No jogo da memória, virar outra carta logo após um par não fala a palavra antiga | Mesmo problema do R07 |
| R18 | Se a fala engasgar (o celular aceita e não toca, ou falha), o app tenta de novo uma vez | "Às vezes engasga e não sai o som" |
| R19 | "Continuar" só aparece depois que a palavra certa termina, então tocar nele não corta a fala | "Som rápido e cortado ao clicar Continuar" |
| R20 | Ao trocar de tela, falas que a tela anterior tinha agendado são descartadas (ex.: última palavra do aprender no quiz) | Achado ao investigar o R19 |
| R21 | Nível 1 só animais (10 fases), nível 2 só números de 0 a 10 (7 fases, com ilustrações), histórias ocultas, fase mostrada pela posição | Níveis separados: animais e números |

(R14 ficou dentro do R02.)

## Padrão para bugs novos

1. Antes de corrigir, escreva o teste que reproduz o bug em `regressao.spec.ts`, com o próximo número
   (`R18 …`), e confirme que ele **falha**.
2. Corrija o bug e confirme que o teste **passa**, junto com todos os outros (`npm test`).
3. Acrescente a linha na tabela acima.

Os elementos `data-testid="quiz"`, `data-answer`, `data-mode` e `data-word` existem só para os testes saberem
a resposta certa; não aparecem para a criança.
