# Fluxo de Uso do Criador AvaLIBRAS (Versão Beta)

Este documento descreve em detalhes os fluxos de uso do **Criador AvaLIBRAS** (para criação de videoprovas). O documento é direcionado tanto para usuários finais quanto para desenvolvedores que precisam entender os workflows completos da aplicação.

**⚠️ IMPORTANTE**: Este documento cobre apenas o **Criador AvaLIBRAS** (editor). O **Aplicador AvaLIBRAS** (player para estudantes) ainda não foi implementado. A seção 2 deste documento descreve o fluxo planejado para o Aplicador como referência futura.

## 1. Fluxo de Uso do Criador AvaLIBRAS

### 1.1. Visão Geral do Workflow Principal

O workflow principal do Criador AvaLIBRAS segue o seguinte fluxo:

```
Criar Projeto → Adicionar Questões → Editar Vídeos → Adicionar Overlays → Configurar Gabarito → Exportar Prova
```

### 1.2. Passo a Passo Detalhado

#### Etapa 1: Criação de Novo Projeto

1.  **Abrir Aplicação**:
    *   Iniciar o Criador AvaLIBRAS
    *   Aplicação inicia com modal "Novo Projeto" (se for o primeiro uso)

2.  **Configurar Projeto**:
    ```
    Modal: Novo Projeto
    ┌─────────────────────────────┐
    │ Nome do Projeto:           │
    │ [Projeto sem Título      ] │
    │                            │
    │ Tipo: Múltipla Escolha     │
    │                            │
    │ Nº de Alternativas:        │
    │ ○ 4 alternativas (A,B,C,D)│
    │ ○ 5 alternativas (A,B,C,D,E)│
    │                            │
    │ [ Cancelar ]  [ Criar ]   │
    └─────────────────────────────┘
    ```

3.  **Interface Principal**:
    *   Sidebar esquerda com lista de questões
    *   Área central de edição com player de vídeo
    *   Timeline interativa na parte inferior
    *   Barra de status com informações do projeto

#### Etapa 2: Adição de Questões

1.  **Adicionar Primeira Questão**:
    *   Clicar no botão "+" na sidebar
    *   Ou usar menu "Questão" → "Adicionar Nova"
    *   Ou usar atalho Ctrl+Shift+Q

2.  **Carregar Vídeo**:
    ```
    Opções de Carregamento:
    ┌─────────────────────────────┐
    │ [ Arrastar vídeo para cá ]  │
    │                            │
    │ ou                          │
    │ [ Selecionar Arquivo ]     │
    │                            │
    │ Formatos suportados:        │
    │ MP4, WebM, MOV, AVI        │
    └─────────────────────────────┘
    ```

3.  **Carregamento via Drag & Drop**:
    *   Arrastar arquivo de vídeo para área central
    *   Barra de progresso aparece durante carregamento
    *   Vídeo aparece no player automaticamente

4.  **Verificação do Vídeo**:
    *   Player exibe vídeo carregado
    *   Controles de play/pause/volume/fullscreen
    *   Timeline sincronizada com player
    *   Duração do vídeo exibida no canto inferior direito

#### Etapa 3: Marcação de Alternativas na Timeline

1.  **Reproduzir Vídeo**:
    *   Clicar no botão play para iniciar reprodução
    *   Observar o conteúdo do vídeo

2.  **Marcar Alternativa A**:
    *   Pausar vídeo no início da resposta para alternativa A
    *   Clicar no marcador "A" na timeline
    *   Tempo é automaticamente registrado

3.  **Marcar Alternativas B, C, D**:
    ```
    Interface da Timeline:
    ┌───────────────────────────────────────────────────────────┐
    │ 0:00 [●──A───●──B───●──C───●──D───●──E───] 3:45           │
    │                                                           │
    │ Controles:                                               │
    │ [►] [■] [◄◄] [►►] [■■] [🔊] [⛶] [📝] [✂️] [🖼️]          │
    └───────────────────────────────────────────────────────────┘

    Marcadores de Alternativas:
    A: 00:15 ──●─── (tempo marcado)
    B: 00:45 ───●── (tempo marcado)
    C: 01:20 ────●─ (tempo marcado)
    D: 02:10 ─────● (tempo marcado)
    E: 02:45 ──────● (tempo marcado - se aplicável)
    ```

4.  **Ajuste Fino dos Tempos**:
    *   Clicar em marcador para ajustar tempo manualmente
    *   Usar campos de entrada de tempo para precisão
    *   Arrastar marcadores diretamente na timeline

5.  **Validação Automática**:
    *   Sistema valida se todos os marcadores foram definidos
    *   Feedback visual sobre marcadores faltantes
    *   Aviso se tempos estiverem fora de ordem

#### Etapa 4: Edição Avançada de Vídeo (Opcional)

1.  **Ferramenta de Corte**:
    *   Clicar no botão de tesoura (✂️) na barra de ferramentas
    *   Mouse muda para cursor de corte na timeline

2.  **Selecionar Trecho**:
    *   Clicar e arrastar na timeline para selecionar trecho
    *   Área selecionada fica destacada
    *   Tempos de início e fim exibidos

3.  **Confirmar Corte**:
    ```
    Confirmação de Corte:
    ┌─────────────────────────────┐
    │ Tempos selecionados:        │
    │ Início: 00:30              │
    │ Fim: 02:15                 │
    │                            │
    │ Duração a ser removida:     │
    │ 01:45                      │
    │                            │
    │ [ Cancelar ]  [ Cortar ]  │
    └─────────────────────────────┘
    ```

4.  **Processamento**:
    *   FFmpeg processa vídeo em background
    *   Barra de progresso mostra andamento
    *   Vídeo editado aparece automaticamente

#### Etapa 5: Adição de Overlays (Opcional)

1.  **Adicionar Overlay**:
    *   Pausar vídeo onde overlay deve aparecer
    *   Clicar no botão de imagem (🖼️) na barra de ferramentas

2.  **Configurar Overlay**:
    ```
    Modal: Configurar Overlay
    ┌─────────────────────────────────┐
    │ Imagem: [Selecionar Arquivo]   │
    │                                │
    │ Tempo de Início: [00:05    ]   │
    │ Duração:        [00:03    ]   │
    │                                │
    │ Posição:                        │
    │ ○ Centro   ○ Superior Esq     │
    │ ○ Inferior Dir ○ Personalizado │
    │                                │
    │ Tamanho: [80% ▼]                │
    │ Opacidade: [100% ▼]             │
    │                                │
    │ [ Preview ] [ Cancelar ] [OK] │
    └─────────────────────────────────┘
    ```

3.  **Visualização**:
    *   Preview do overlay sobre o vídeo
    *   Ajustes em tempo real
    *   Múltiplos overlays podem ser adicionados

4.  **Edição de Overlays**:
    *   Clicar em overlay existente para editar
    *   Arrastar overlay diretamente no player
    *   Redimensionar usando alças de controle

#### Etapa 6: Configuração do Gabarito

1.  **Abrir Gabarito**:
    *   Clicar no botão de gabarito (📝) na barra de ferramentas
    *   Ou clicar no ícone de gabarito na sidebar

2.  **Definir Resposta Correta**:
    ```
    Modal: Gabarito da Questão
    ┌─────────────────────────────────┐
    │ Questão: Questão 01            │
    │                                │
    │ Gabarito:                      │
    │ ○ A) Alternativa A             │
    │ ● B) Alternativa B ← Correta   │
    │ ○ C) Alternativa C             │
    │ ○ D) Alternativa D             │
    │                                │
    │ Dica para o Professor:         │
    │ [Esta resposta está correta   │
    │ porque...                    ] │
    │                                │
    │ [ Cancelar ]  [ Salvar ]     │
    └─────────────────────────────────┘
    ```

3.  **Validação da Questão**:
    *   Sistema verifica se todos os campos foram preenchidos
    *   Validação de integridade dos dados
    *   Indicador visual de "Questão Completa"

#### Etapa 7: Gerenciamento de Múltiplas Questões

1.  **Adicionar Mais Questões**:
    *   Repetir Etapas 2-6 para cada questão adicional
    *   Sidebar mostra lista completa de questões

2.  **Organizar Questões**:
    *   Arrastar e soltar questões na sidebar para reordenar (drag & drop).
    *   Usar menu de contexto (botão direito) para mover questões para cima/baixo.

3.  **Navegação entre Questões**:
    *   Clicar em questão na sidebar para editar
    *   Usar setas de navegação na barra de ferramentas
    *   Atalhos de teclado: Alt+Setas

#### Etapa 8: Salvamento e Exportação

1.  **Salvar Projeto**:
    *   Menu "Arquivo" → "Salvar" (Ctrl+S)
    *   Escolher local e nome do arquivo
    *   Arquivo salvo como `.avaprojet`

2.  **Exportar Prova**:
    *   Menu "Arquivo" → "Exportar Prova" (Ctrl+E)
    *   Confirmar configurações de exportação (incluindo nível de compressão)

3.  **Opções de Exportação**:
    ```
    Exportar Prova Completa:
    ┌─────────────────────────────────┐
    │ Nome da Prova:                  │
    │ [Avaliação de LIBRAS - Prova 1]│
    │                                │
    │ Incluir:                        │
    │ ✓ Todas as questões            │
    │ ✓ Gabarito                     │
    │ ✓ Overlays                     │
    │                                │
    │ Formato:                        │
    │ ● Arquivo .AVA (recomendado)   │
    │ ○ Pasta com arquivos separados │
    │                                │
    │ [ Cancelar ]  [ Exportar ]    │
    └─────────────────────────────────┘
    ```

4.  **Progresso de Exportação**:
    *   Barra de progresso mostra andamento
    *   Arquivo `.ava` criado com todos os recursos
    *   Notificação de sucesso ao finalizar

### 1.3. Fluxos Alternativos e Funcionalidades Adicionais

#### Importação de Projeto Existente
1.  Menu "Arquivo" → "Abrir..." (Ctrl+O)
2.  Selecionar arquivo `.avaprojet`
3.  Projeto carregado com todas as questões e configurações

#### Gerenciamento de Projetos Recentes
1.  Menu "Arquivo" → "Projetos Recentes"
2.  Lista de projetos acessados recentemente
3.  Clique para abrir projeto selecionado

#### Importação de Questão Individual (.avaquest)
1.  Menu "Questão" → "Importar..."
2.  Selecionar arquivo `.avaquest`
3.  A questão é adicionada ao final da lista de questões do projeto atual, com toda a sua mídia (vídeo, overlays) sendo copiada para a pasta do projeto.

#### Edição de Dados da Questão
1.  Clicar no ícone de edição ao lado da questão
2.  Modificar label, enunciado, metadados
3.  Salvar alterações automaticamente

#### Validação do Projeto
1.  Menu "Ferramentas" → "Verificar Integridade"
2.  Sistema verifica integridade de todos os dados
3.  Relatório de problemas encontrados

## 2. Fluxo de Uso do Aplicador AvaLIBRAS

### 2.1. Visão Geral do Workflow Principal

```
Importar Prova → Navegar por Questões → Reproduzir Vídeo → Navegar por Alternativas → Concluir Avaliação
```

### 2.2. Passo a Passo Detalhado

#### Etapa 1: Importação da Prova

1.  **Abrir Aplicação**:
    *   Iniciar o Aplicador AvaLIBRAS
    *   Tela inicial com opções de importação

2.  **Importar Prova**:
    ```
    Tela de Importação:
    ┌─────────────────────────────────┐
    │        Aplicador AvaLIBRAS      │
    │                                │
    │ [ Selecionar Arquivo .AVA ]    │
    │                                │
    │ ou                              │
    │ [ Arrastar prova para cá ]      │
    │                                │
    │ Provas recentes:                │
    │ • Prova de Matemática          │
    │ • Prova de História            │
    └─────────────────────────────────┘
    ```

3.  **Carregar Prova**:
    *   Selecionar arquivo `.ava` exportado pelo Criador
    *   Arrastar arquivo para área de importação
    *   Sistema extrai e carrega prova

4.  **Configuração Inicial** (se aplicável):
    ```
    Configuração da Prova:
    ┌─────────────────────────────────┐
    │ Prova: Avaliação de LIBRAS     │
    │                                │
    │ Senha (se protegida):          │
    │ [••••••••••••••••••••••••••••] │
    │                                │
    │ Nome do Aluno:                 │
    │ [_________________________]   │
    │                                │
    │ [ Iniciar Prova ]              │
    └─────────────────────────────────┘
    ```

#### Etapa 2: Interface Principal do Aplicador

1.  **Layout da Interface**:
    ```
    ┌───────────────────────────────────────────────────────────┐
    │                   Prova: Avaliação de LIBRAS               │
    │ Progresso: Questão 1 de 5 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
    │                                                           │
    │  ┌─────────────────┐  ┌─────────────────────────────────┐  │
    │  │   Navegação     │  │           Player de Vídeo        │  │
    │  │                 │  │                                 │  │
    │  │ [Questão 1 ●]   │  │  ┌─────────────────────────────┐  │  │
    │  │ [Questão 2  ]   │  │  │                             │  │  │
    │  │ [Questão 3  ]   │  │  │        Vídeo da Questão     │  │  │
    │  │ [Questão 4  ]   │  │  │                             │  │  │
    │  │ [Questão 5  ]   │  │  └─────────────────────────────┘  │  │
    │  │                 │  │                                 │  │
    │  │   [INÍCIO ●]    │  │  [■] [◄◄] [►►] [■■] [🔊] [⛶]   │  │
    │  │   [Alternativa A│  │                                 │  │
    │  │   [Alternativa B│  │  Alternativas:                  │  │
    │  │   [Alternativa C│  │  ○ INÍCIO                       │  │
    │  │   [Alternativa D│  │  ● Alternativa A                 │  │
    │  │                 │  │  ○ Alternativa B                 │  │
    │  │ [Próxima →]     │  │  ○ Alternativa C                 │  │
    │  └─────────────────┘  │  ○ Alternativa D                 │  │
    │                       │                                 │  │
    │                       │         [Próxima Questão →]     │  │
    │                       └─────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────┘
    ```

#### Etapa 3: Navegação e Reprodução de Vídeo

1.  **Navegar para Questão**:
    *   Clicar em número da questão na sidebar
    *   Usar setas de navegação "← Anterior" "Próxima →"
    *   Atalhos de teclado: ← → ou Alt+Setas

2.  **Reproduzir Vídeo da Questão**:
    *   Vídeo inicia automaticamente ao selecionar questão
    *   Controles de reprodução padrão disponíveis
    *   Barra de progresso mostra tempo atual

3.  **Ajustar Volume e Velocidade**:
    *   Controle deslizante de volume
    *   Opção de ajustar velocidade de reprodução (0.5x - 2x)

4.  **Modo Tela Cheia**:
    *   Botão de expansão para tela cheia
    *   Interface simplificada no modo tela cheia
    *   Controles de navegação sempre visíveis

#### Etapa 4: Navegação por Alternativas

1.  **Navegação Estruturada**:
    ```
    Estrutura da Questão:
    ┌─────────────────────────────────┐
    │ SEÇÕES DA QUESTÃO:             │
    │                                │
    │ [●] INÍCIO                     │
    │     - Enunciado da questão     │
    │     - Instruções gerais       │
    │                                │
    │ [○] ALTERNATIVA A              │
    │     - Vídeo da alternativa A   │
    │                                │
    │ [○] ALTERNATIVA B              │
    │     - Vídeo da alternativa B   │
    │                                │
    │ [○] ALTERNATIVA C              │
    │     - Vídeo da alternativa C   │
    │                                │
    │ [○] ALTERNATIVA D              │
    │     - Vídeo da alternativa D   │
    └─────────────────────────────────┘
    ```

2.  **Navegação por Botões**:
    *   Clicar nos botões de alternativas para pular para seção específica
    *   Botão "INÍCIO" retorna ao enunciado da questão
    *   Feedback visual indica seção atual

3.  **Navegação Automática**:
    *   Vídeo avança automaticamente para próxima seção
    *   Configuração para desativar navegação automática
    *   Pausa automática entre seções para compreensão

4.  **Visualização de Overlays**:
    *   Overlays adicionados no Criador aparecem automaticamente
    *   Sincronização temporal precisa
    *   Sobreposição transparente sobre o vídeo

#### Etapa 5: Progressão e Conclusão

1.  **Controle de Progresso**:
    *   Barra de progresso no topo mostra questões concluídas
    *   Sistema marca questões como visualizadas
    *   Possibilidade de revisitar questões anteriores

2.  **Finalizar Prova**:
    ```
    Confirmação de Finalização:
    ┌─────────────────────────────────┐
    │ Tem certeza que deseja          │
    │ finalizar a prova?              │
    │                                │
    │ Questões respondidas: 4/5      │
    │ Tempo utilizado: 15:23         │
    │                                │
    │ [ Revisar Respostas ]          │
    │ [ Finalizar Prova ]            │
    └─────────────────────────────────┘
    ```

3.  **Revisão de Respostas**:
    *   Opção de revisar todas as questões
    *   Navegação rápida entre questões
    *   Confirmação final antes de conclusão

4.  **Resultado**:
    ```
    Prova Concluída!
    ┌─────────────────────────────────┐
    │           Resultado             │
    │                                │
    │ Nome: João Silva               │
    │ Prova: Avaliação de LIBRAS     │
    │                                │
    │ Questões: 5/5 respondidas      │
    │ Tempo: 15:23                  │
    │                                │
    │ Gabarito disponível            │
    │ com o professor.               │
    │                                │
    │ [ Fechar ]                     │
    └─────────────────────────────────┘
    ```

### 2.3. Funcionalidades Avançadas do Aplicador

#### Modo de Acessibilidade
1.  **Configurações de Acessibilidade**:
    *   Aumento de tamanho de fonte
    *   Alto contraste
    *   Navegação por teclado completa
    *   Suporte para leitores de tela

2.  **Legendas e Interpretação**:
    *   Legendas em português (se disponíveis)
    *   Janela de interpretação em LIBRAS
    *   Controle independente de volume

#### Recursos Adicionais
1.  **Anotações Pessoais**:
    *   Campo para anotações durante prova
    *   Salvar anotações localmente
    *   Exportar anotações

2.  **Tempo Ilimitado**:
    *   Sem limite de tempo por padrão
    *   Timer opcional para gestão de tempo
    *   Pausas permitidas durante prova

## 3. Fluxos de Erro e Recuperação

### 3.1. Erros Comuns no Criador

#### Falha no Carregamento de Vídeo
```
Erro ao Carregar Vídeo:
┌─────────────────────────────────┐
│ Não foi possível carregar o      │
│ vídeo selecionado.               │
│                                │
│ Possíveis causas:               │
│ • Formato não suportado         │
│ • Arquivo corrompido            │
│ • Permissões insuficientes      │
│                                │
│ [ Tentar Outro Vídeo ]          │
│ [ Converter Vídeo ]             │
│ [ Cancelar ]                    │
└─────────────────────────────────┘
```

#### Falha na Exportação
```
Erro na Exportação:
┌─────────────────────────────────┐
│ Falha ao exportar prova.        │
│                                │
│ Erro: Espaço em disco          │
│ insuficiente.                  │
│                                │
│ Espaço necessário: 250 MB      │
│ Espaço disponível: 120 MB      │
│                                │
│ [ Liberar Espaço ]             │
│ [ Alterar Local ]              │
│ [ Cancelar ]                    │
└─────────────────────────────────┘
```

### 3.2. Erros Comuns no Aplicador

#### Falha na Importação
```
Erro na Importação:
┌─────────────────────────────────┐
│ Não foi possível importar       │
│ a prova selecionada.            │
│                                │
│ Verifique:                     │
│ • Arquivo .ava válido          │
│ • Prova não corrompida         │
│ • Versão compatível            │
│                                │
│ [ Selecionar Outro Arquivo ]    │
│ [ Entrar em Contato ]          │
└─────────────────────────────────┘
```

#### Falha na Reprodução
```
Erro de Reprodução:
┌─────────────────────────────────┐
│ O vídeo não pôde ser reproduzido│
│                                │
│ Soluções:                      │
│ • Verificar codec de vídeo      │
│ • Atualizar drivers            │
│ • Tentar outro player          │
│                                │
│ [ Pular Questão ]              │
│ [ Tentar Novamente ]           │
└─────────────────────────────────┘
```

## 4. Dicas e Melhores Práticas

### 4.1. Para Criadores de Prova

1.  **Planejamento**:
    *   Prepare roteiro antes de gravar
    *   Organize estrutura de questões
    *   Tenha backup dos vídeos originais

2.  **Gravação de Vídeo**:
    *   Use iluminação adequada
    *   Grave em ambiente silencioso
    *   Formato MP4 com H.264 recomendado

3.  **Organização**:
    *   Nomeie arquivos consistentemente
    *   Mantenha estrutura de pastas organizada
    *   Salve projetos regularmente

4.  **Qualidade**:
    *   Revise todas as questões antes de exportar
    *   Teste prova no Aplicador antes de distribuir
    *   Peça feedback de colegas

### 4.2. Para Aplicadores de Prova

1.  **Preparação**:
    *   Verifique equipamento antes da prova
    *   Teste fones de ouvido
    *   Garanta ambiente tranquilo

2.  **Durante a Prova**:
    *   Utilize recursos de acessibilidade se necessário
    *   Faça anotações para auxiliar compreensão
    *   Não hesite em revisar questões

3.  **Técnica de Estudo**:
    *   Assista a todos os vídeos com atenção
    *   Compare alternativas antes de decidir
    *   Use pausas para reflexão

## 5. Suporte e Ajuda

### 5.1. Recursos de Ajuda

*   **Manual do Usuário**: Documentação completa
*   **Tutoriais em Vídeo**: Demonstrações passo a passo
*   **FAQ**: Perguntas frequentes
*   **Suporte por Email**: avalibras@suporte.com

### 5.2. Comunidade

*   **Fórum de Discussão**: Dicas e compartilhamento
*   **Grupo de Usuários**: Exchange de experiências
*   **Workshops**: Treinamentos presenciais

### 5.3. Feedback

*   **Reportar Bugs**: Sistema de ticket
*   **Sugerir Melhorias**: Portal de ideias
*   **Avaliação de Satisfação**: Pesquisas periódicas

---

*Versão: Beta*
*Última atualização: Outubro 2025*
*Aplicação: AvaLIBRAS*