# Testes de regressão

Cada bug corrigido ou comportamento ajustado tem um teste aqui. Se um deles voltar, o teste falha e a
publicação (teste e real) é bloqueada no GitHub Actions.

Rodar: `npm test` (gera as duas versões do app, abre um Chromium em tamanho de celular e executa tudo).

| ID | O que garante | Origem |
|---|---|---|
| R01 | App abre sem login, direto no cadastro da criança | Login removido a pedido |
| R02 | Fluxo completo (cadastro → aprender → quiz → resultado) salva progresso e libera a próxima fase; nenhum arquivo falta no subendereço do GitHub Pages | Publicação em `/jogo-infantil-igles/` |
| R03 | Nível 2 bloqueado até completar a árvore do nível 1 (fase 10) e liberado depois | Árvore completa libera o próximo nível |
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
| R22 | Ao achar versão nova, abre um endereço novo (`?v=`) que o iPhone não tem guardado, e tenta só uma vez (sem ciclo de recarregar) | "Versão de teste do GitHub não atualizou" |
| R23 | A abertura pede um toque ("Toque para começar 🎵") e a música começa logo em seguida | "A música do início não começa tocando" |
| R24 | Mapa em terreno: fase 1 embaixo, a planta de cada fase cresce do broto até a árvore, árvore-meta no topo | Novo design das fases |
| R25 | Ao completar a última fase aparece a árvore completa e o botão para o próximo nível | Novo design das fases |
| R26 | Trocar de tela não manda "cancelar" para a voz quando ela está em silêncio (isso pode emudecer a voz do iPhone) | "O som não está saindo dos animais" |
| R27 | Área dos pais tem "Testar voz", que fala uma frase e mostra o que o aparelho respondeu | Diagnóstico de som no aparelho real |
| R28 | Se a voz travar no meio (começa e nunca termina, sem som), o app destrava e fala de novo | "Não sai mais o som com o nome do animal" (botão 🔊 pulsando) |
| R29 | Depois que a palavra termina normalmente, ela não é repetida sozinha | Proteção da correção do R28 |
| R30 | Visual "Dia ensolarado": fundo claro, texto escuro, cantos bem arredondados e botões principais 3D | Nova paleta e design infantil |
| R31 | A versão oficial não mostra o texto da versão no rodapé; a de teste mostra "versão … (teste)" | "Esconda o texto da versão do app" |
| R32 | Prefere a voz Ava (depois Zoe, Evan, Samantha…) e, dentro dela, a melhor versão instalada (Premium > Aprimorada > normal) | "Baixei a Ava" |
| R33 | Palavras (animais e números) tocam o áudio gravado na ElevenLabs pelo Web Audio, que funciona no silencioso; "Continuar" espera o áudio terminar | "Voz do iPhone não é a Ava / some no silencioso" |
| R34 | Se o áudio gravado não carregar, a palavra é dita pela voz do aparelho | Proteção do R33 |
| R35 | Se o som do app estiver bloqueado por um instante (o iPhone interrompe o Web Audio depois de uma fala), espera e toca o áudio gravado em vez da voz do aparelho | "Não mudou os áudios" |
| R36 | Áudio gravado numa velocidade calma: palavras geradas com `speed` 0,7 (o "Dog" dura pelo menos 0,9 s) | "A voz está rápida" |
| R37 | Versão de teste: todos os níveis e fases liberados, mesmo sem progresso (a real continua liberando pela ordem: R03/R04) | "Libere todas as fases no teste" |
| R38 | Versão de teste: a Área dos Pais abre sem a conta de adulto; a real continua pedindo | "Não preciso fazer o cálculo no teste" |
| R39 | Versão de teste: a Área dos Pais mostra todos os animais e números (com imagem) e toca o áudio gravado de cada um | "Testar o áudio de todas as palavras sem entrar nas fases" |
| R40 | Mapa de fases limpo: só as plantas (sem caixa com fase/palavras, sem texto de instrução); a planta é o botão 3D e a da vez pisca | "A criança só clica no broto" |
| R41 | Ao bloquear o celular (app em segundo plano) a música para, o áudio mudo do silencioso é desligado (some o "tocando agora" da tela bloqueada) e o som fica suspenso; ao voltar, a música volta | "Música continua tocando com o celular bloqueado" |

(R14 ficou dentro do R02.)

## Padrão para bugs novos

1. Antes de corrigir, escreva o teste que reproduz o bug em `regressao.spec.ts`, com o próximo número
   (`R18 …`), e confirme que ele **falha**.
2. Corrija o bug e confirme que o teste **passa**, junto com todos os outros (`npm test`).
3. Acrescente a linha na tabela acima.

Os testes bloqueiam os MP3 das palavras (`instrument()`), então a fala passa pela voz do aparelho, que é o que
eles inspecionam; o R33 libera os MP3 com `allowVoiceClips()`.

Os elementos `data-testid="quiz"`, `data-answer`, `data-mode` e `data-word` existem só para os testes saberem
a resposta certa; não aparecem para a criança.
