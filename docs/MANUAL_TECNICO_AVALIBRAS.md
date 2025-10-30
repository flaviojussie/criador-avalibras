# Manual Técnico Completo do AvaLIBRAS v2.0.0

**"Esquema Elétrico" do Criador AvaLIBRAS para Manutenção e Desenvolvimento**

**⚠️ IMPORTANTE**: Este manual documenta apenas o **Criador AvaLIBRAS** (editor de videoprovas). O **Aplicador AvaLIBRAS** (player para estudantes) ainda não foi implementado e está planejado para versões futuras.

---

## 📋 Índice

1. [Visão Geral e Arquitetura](#visão-geral-e-arquitetura)
2. [Estatísticas do Projeto](#estatísticas-do-projeto)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Estrutura de Código Detalhada](#estrutura-de-código-detalhada)
5. [Pontos Críticos de Manutenção](#pontos-críticos-de-manutenção)
6. [Recursos Futuros e Incompletudes](#recursos-futuros-e-incompletudes)
7. [Guia de Depuração](#guia-de-depuração)
8. [Performance e Segurança](#performance-e-segurança)
9. [Deploy e Distribuição](#deploy-e-distribuição)

---

## 🏗️ Visão Geral e Arquitetura

### Arquitetura Híbrida Electron + React

O **Criador AvaLIBRAS v2.0.0** é um editor de videoprovas educacionais para criação de avaliações com vídeo em LIBRAS (Língua Brasileira de Sinais).

**Nota**: O sistema AvaLIBRAS é composto por duas aplicações planejadas:
- ✅ **Criador AvaLIBRAS** (implementado): Editor para professores criarem provas
- ⏳ **Aplicador AvaLIBRAS** (não implementado): Player para estudantes realizarem as provas

**Tecnologias Principais:**
- **Frontend**: React 18.2.0 + Vite + Tailwind CSS
- **Desktop**: Electron 38.2.0 (multiplataforma)
- **Processamento de Vídeo**: FFmpeg com worker threads
- **Arquitetura**: Component-based com hooks personalizados

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Processo Principal (Main)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Gestão de     │  │   Servidor      │  │   Worker     │ │
│  │   Janelas       │  │   HTTP          │  │   FFmpeg     │ │
│  │                 │  │   (Streaming)   │  │   Threads    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕️ IPC (Comunicação Segura)
┌─────────────────────────────────────────────────────────────┐
│                    Preload Script                           │
│                 (Ponte de Segurança)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Context       │  │   Cache         │  │   Validação  │ │
│  │   Bridge        │  │   Crítico       │  │   de APIs    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕️ APIs Expostas
┌─────────────────────────────────────────────────────────────┐
│                Processo de Renderização (React)             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Componentes   │  │   Hooks         │  │   Serviços   │ │
│  │   UI            │  │   Personalizados│  │   Utils      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Funcionalidades Implementadas

### 1. Sistema de Gestão de Projetos ✅

**Descrição**: Sistema completo para criar, carregar e salvar projetos educacionais em formato `.avaprojet`.

**Arquivos Responsáveis**:
- `src/hooks/useQuestions.js` - Lógica principal de gestão de projetos
- `src/utils/apiService.js` - Abstração de APIs do sistema
- `electron/main.js` - Handlers IPC para persistência

### 2. Editor de Vídeo Avançado ✅

**Descrição**: Sistema completo de edição de vídeo com timeline interativa.

**Arquivos Responsáveis**:
- `src/hooks/useVideoEditor.js` - Lógica principal de edição
- `src/components/Timeline.jsx` - Interface da timeline
- `src/components/Editor.jsx` - Componente principal do editor
- `electron/main.js` - Servidor HTTP para streaming

### 3. Sistema de Overlays ✅

**Descrição**: Sistema de posicionamento de imagens sobre o vídeo sincronizadas no tempo.

**Arquivos Responsáveis**:
- `src/hooks/useOverlay.js` - Gestão de overlays
- `src/components/VideoOverlay.jsx` - Renderização visual
- `electron/worker.js` - Processamento de overlays com FFmpeg

### 4. Sistema de Questões ✅

**Descrição**: CRUD completo de questões com validação e gabarito.

**Arquivos Responsáveis**:
- `src/hooks/useQuestions.js` - Gestão completa
- `src/components/Sidebar.jsx` - Interface de gestão
- `src/components/GabaritoModal.jsx` - Modal de gabarito

### 5. Integração Desktop ✅

**Descrição**: Recursos nativos da aplicação desktop.

**Arquivos Responsáveis**:
- `electron/main.js` - Processo principal Electron
- `electron/preload.js` - Ponte segura entre processos
- `src/App.jsx` - Integração com menus e atalhos

### 6. Criptografia de Projetos ✅

**Descrição**: Opção de criptografar projetos ao exportar com senha.

**Arquivos Responsáveis**:
- `src/components/EncryptModal.jsx` - Modal para inserir senha
- `electron/main.js` - Lógica de criptografia com o módulo `crypto`

### 7. Configurações da Aplicação ✅

**Descrição**: Interface para o usuário configurar preferências da aplicação.

**Arquivos Responsáveis**:
- `src/components/SettingsModal.jsx` - Modal de configurações
- `electron/main.js` - Lógica para salvar e carregar configurações

### 8. Importação e Exportação de Questões ✅

**Descrição**: Permite importar e exportar questões individuais no formato `.avaquest`.

**Arquivos Responsáveis**:
- `electron/main.js` - Handlers IPC `import-question` e `export-question`
- `src/hooks/useQuestions.js` - Lógica `addQuestionFromImport`

### 6. Menu de Contexto para Questões ✅

**Descrição**: Menu de contexto (botão direito) para ações rápidas em questões.

**Arquivos Responsáveis**:
- `src/components/Sidebar.jsx` - Gerenciamento do menu
- `src/components/QuestionContextMenu.jsx` - Componente do menu

**Funcionalidades Principais**:
- Editar (selecionar questão)
- Mover (reordenar para cima/baixo)
- Exportar questão individual
- Excluir questão

### 7. Reordenação de Questões (Drag & Drop) ✅

**Descrição**: Funcionalidade de arrastar e soltar para reorganizar a ordem das questões na sidebar.

**Arquivos Responsáveis**:
- `src/hooks/useQuestions.js` - Lógica de reordenação
- `src/components/Sidebar.jsx` - Manipuladores de drag & drop
- `src/components/QuestionGrid.jsx` (interno ao Sidebar) - Elementos arrastáveis

### 8. Importação de Questões (.avaquest) ✅

**Descrição**: Permite importar uma questão individual a partir de um arquivo `.avaquest`, incluindo a mídia associada (vídeo e overlays).

**Arquivos Responsáveis**:
- `electron/main.js` - Handler IPC `import-question`.
- `src/hooks/useQuestions.js` - Lógica `addQuestionFromImport`.
- `src/App.jsx` - Integração com o menu da UI.

---

## 📁 Estrutura de Código Detalhada

### Camada Principal (Electron)

#### `electron/main.js` - Cérebro da Aplicação

**Responsabilidades Principais**:
- **Gestão de Janela**: Controle completo da janela principal, menus nativos
- **Sistema IPC**: Múltiplos handlers para comunicação inter-processos
- **Servidor HTTP**: Servidor localhost dinâmico para streaming de vídeo
- **Worker Threads**: Sistema de fila para processamento FFmpeg não-bloqueante

**Handlers IPC Críticos**:
```javascript
// Sistema (linha 30)
ipcMain.handle('get-system-info', async () => {
  // Informações do sistema: platform, arch, memory, cpus
});

// Sistema (novo)
ipcMain.handle('system:clear-temp-files', async () => {
  // Limpa todos os arquivos temporários da aplicação
});

// Sistema (novo)
ipcMain.handle('system:get-default-documents-path', async () => {
  // Retorna o caminho padrão da pasta de documentos do usuário
});

// Vídeo (linha 69)
ipcMain.handle('get-video-url', async (event, videoPath) => {
  // Servidor HTTP para streaming com range requests
});

// Arquivos (linha 58)
ipcMain.handle('file-exists', async (event, filePath) => {
  // Verificação de existência de arquivos
});
```

#### `electron/worker.js` - Processamento de Vídeo

**Responsabilidades**:
- **4 tipos de tarefas**: info, cut, process-overlay, process-video
- **Sistema de arquivos temporários**: Criação e limpeza garantida após cada operação
- **Processamento FFmpeg**: Corte, overlay, extração de frames

#### `electron/preload.js` - Ponte Segura

**Responsabilidades**:
- **API Bridge**: Expõe APIs seguras via `contextBridge`
- **Sistema Híbrido**: APIs síncronas e assíncronas
- **Cache Crítico**: Cache para APIs essenciais
- **Validações**: Verificação de contexto e disponibilidade

### Camada React (Frontend)

#### Hooks Personalizados (Estado Centralizado)

##### `src/hooks/useQuestions.js` - Gestor de Questões

**Funções Principais**:
- **CRUD Completo**: `addQuestion()`, `updateQuestion()`, `deleteQuestion()`, `reorderQuestions()`
- **Validação de Dados**: Validação estrita e não-estrita
- **Projetos**: `createNewProject()`, `loadProject()`, `saveProject()`
- **Navegação**: `nextQuestion()`, `previousQuestion()`, `goToQuestion()`

##### `src/hooks/useVideoEditor.js` - Editor de Vídeo

**Funções Principais**:
- **Sistema de Seleção**: `startSelection()`, `updateSelection()`, `endSelection()`
- **Arrasto de Marcadores**: `startMarkerDrag()`, movimento cascata
- **Arrasto de Overlays**: `startOverlayDrag()`, movimento individual
- **Corte de Vídeo**: Integração com worker FFmpeg

##### `src/hooks/useOverlay.js` - Sistema de Overlays

**Funções Principais**:
- **Renderização em Canvas**: `drawOverlays()` com `requestAnimationFrame`
- **Carregamento de Imagens**: Assíncrono com cache
- **Cálculos de Posição**: `calculateOverlayDimensions()`, `calculatePosition()`

##### `src/hooks/useSettings.js` - Gestor de Configurações

**Funções Principais**:
- **Carregar Configurações**: `loadSettings()`
- **Salvar Configurações**: `saveSettings()`

#### Componentes UI Principais

##### `src/App.jsx` - Componente Principal

**Responsabilidades**:
- **Orquestração**: Integra todos os hooks e componentes
- **Gestão de Estado**: Notificações, loading, modais
- **Atalhos de Teclado**: Ctrl+N, Ctrl+S, Ctrl+O, Ctrl+E
- **Menu Nativo**: Integração com menus do sistema

##### `src/components/Editor.jsx` - Editor Principal

**Responsabilidades**:
- **Drag & Drop**: Arrastar arquivos de vídeo
- **Carregamento de Vídeo**: Sistema robusto com retry
- **Integração Timeline**: Conecta com sistema de edição

##### `src/components/Timeline.jsx` - Timeline Interativa

**Responsabilidades**:
- **3 Tracks**: Progresso, Marcadores, Overlays
- **Sistema de Arrasto**: Marcadores e overlays arrastáveis
- **Entrada Manual**: TimeInput para edição precisa

### Camada de Serviços

#### `src/utils/apiService.js` - Abstração de APIs

**Responsabilidades**:
- **Detecção de Ambiente**: Electron vs Web
- **Sistema de Fallback**: Múltiplas estratégias para cada API
- **Validação de APIs**: Verificação de disponibilidade
- **Cache Inteligente**: Cache para operações críticas

#### `src/utils/errorHandler.js` - Sistema de Erros

**Responsabilidades**:
- **Registro Centralizado**: `log(error, context)`
- **Sistema de Listeners**: `addListener()` para notificações
- **Wrappers**: `wrapApiCall()`, `wrapEventHandler()`

---

## ⚠️ Pontos Críticos de Manutenção

### APIs Electron (Pontos Sensíveis)

**Handlers IPC Críticos em main.js**:
- `get-video-url` (linha 69): Servidor HTTP para streaming - **PONTO CRÍTICO**
- `get-system-info` (linha 30): Informações do sistema - **DEPENDÊNCIA**
- `file-exists` (linha 58): Verificação de arquivos - **ESSENCIAL**
- `system:clear-temp-files` (novo): Limpeza de arquivos temporários - **MANUTENÇÃO**
- `system:get-default-documents-path` (novo): Obter caminho de documentos - **UTILIDADE**

### Processamento de Vídeo (Área Complexa)

**Worker Thread System**:
- **Fila de Tarefas**: Apenas um processo FFmpeg por vez
- **Arquivos Temporários**: Criação automática em `/tmp/avalibras-*` com limpeza garantida
- **Processamento FFmpeg**: Corte, overlay, extração de frames, com suporte a níveis de compressão configuráveis

### Criptografia e Compressão (Novas Dependências)

**Módulos Utilizados**:
- **`crypto`**: Módulo nativo do Node.js para criptografia de projetos.
- **`adm-zip`**: Biblioteca para descompressão de arquivos `.avaquest`.
- **`archiver`**: Biblioteca para compressão de projetos e questões em formato ZIP.

### Estado Global (Sincronização)

**Fonte da Verdade**:
- **useQuestions**: Gestor central de questões e projetos
- **Sincronização**: Múltiplos hooks precisam sincronizar estado
- **Validação**: Regras complexas de negócio centralizadas

---

## 🔮 Recursos Futuros e Incompletudes

### Funcionalidades Implementadas Recentemente

1. **Sistema de Configurações Avançadas**: ✅
   - **Status**: Implementado (`SettingsModal.jsx`)
   - **Funcionalidades**: Configurações gerais, qualidade de vídeo/exportação, gerenciamento de arquivos temporários.

2. **Criptografia de Projetos**: ✅
   - **Status**: Implementado (`EncryptModal.jsx`)
   - **Funcionalidades**: Exportação de projetos com senha.

3. **Importação/Exportação de Questões**: ✅
   - **Status**: Implementado
   - **Funcionalidades**: Importação e exportação de questões individuais no formato `.avaquest`.

### Menus da Aplicação

A aplicação possui duas estruturas de menu:

1.  **Menu Nativo (OS)**: Definido em `electron/main.js`, é o menu que aparece no topo da janela em ambientes como macOS ou com a tecla Alt no Windows/Linux. Ele contém um conjunto completo de opções, incluindo "Arquivo", "Editar", "Questão", "Ferramentas" e "Ajuda".
2.  **Menu Customizado (UI)**: Definido em `src/App.jsx` e renderizado pelo componente `TitleBar`. Este é o menu principal com o qual o usuário interage diretamente na barra de título da aplicação. Sua estrutura é mais enxuta:
    *   **Arquivo**: Novo, Abrir, Salvar, Salvar Como, Exportar, Sair.
    *   **Questão**: Adicionar Nova, Importar, Exportar, Remover Todas.
    *   **Configurações**: Abre o modal de configurações.
    *   **Ajuda**: Documentação, Reportar Problema, Sobre.

A maioria das funcionalidades é acionada tanto pelo menu nativo (via eventos IPC) quanto pelo menu customizado (via callbacks diretos).

---

## 🐛 Guia de Depuração

### Problemas Comuns e Soluções

#### Vídeo Não Carrega

**Sintomas**: Tela preta, erro de carregamento
**Verificação**:
1. Verificar se servidor HTTP está ativo (main.js linha 76)
2. Verificar permissões de arquivo
3. Testar API `getVideoUrl` no console
4. Verificar logs do preload script

#### APIs Não Respondem

**Sintomas**: `electronAPI is undefined`, `fs is not defined`, `path is not defined`, timeouts
**Verificação**:
1. Verificar timing de inicialização (`apiService.init()`)
2. Verificar se `electronAPI` está disponível
3. Testar handlers IPC no main process
4. Verificar importações de módulos Node.js (`fs`, `path`, `os`) no `main.js` e `preload.js`

#### Estado Inconsistente

**Sintomas**: Dados não sincronizados, bugs de UI
**Verificação**:
1. Verificar sincronização entre hooks
2. Limpar localStorage se necessário
3. Reiniciar aplicação para reset completo

### Ferramentas de Debug

- **DevTools**: F12 no processo de renderização
- **Main Process Console**: `ELECTRON_IS_DEV=true npm run dev:electron`
- **Logs Detalhados**: Sistema de logging em todo código
- **Estado LocalStorage**: `localStorage.getItem('avalibras_recent_projects')`

---

## ⚡ Performance e Segurança

### Estratégias de Performance Implementadas

- **Lazy Loading**: Carregamento sob demanda de componentes
- **Memoização**: `React.memo` e `useMemo` para evitar re-renders
- **Cache de APIs**: Cache crítico em preload.js
- **Virtualização**: Planejada para timelines complexas e listas de questões
- **Drag & Drop Otimizado**: Reordenação de questões com feedback visual e precisão aprimorada.

### Implementações de Segurança

- **Context Isolation**: `contextIsolation: true` em webPreferences
- **Node Integration**: `nodeIntegration: false` no renderer
- **Preload Script**: Única ponte entre processos
- **Validação de Entrada**: Em todos os pontos de entrada de dados
- **Content Security Policy (CSP)**: Configuração rigorosa para mitigar XSS

---

## 📦 Deploy e Distribuição

### Processo de Build

```bash
# Build do React
npm run build

# Build Electron para produção
npm run build-electron

# Desenvolvimento com hot reload
npm run dev:electron
```

### Configurações Multiplataforma (package.json)

- **Windows**: NSIS installer com assinatura
- **macOS**: DMG com notarização (pendente)
- **Linux**: AppImage standalone
- **File Associations**: Arquivos `.avaprojet` associados à aplicação

### Estrutura de Distribuição

```
dist/
├── avalibras-win32-x64/
├── avalibras-darwin-x64/
├── avalibras-linux-x64/
└── installers/
    ├── Avalibras-Setup-x.x.x.exe
    ├── Avalibras-x.x.x.dmg
    └── Avalibras-x.x.x.AppImage
```

---

## 👥 Guia para Novos Desenvolvedores

### Primeiros Passos

1. **Entender a Arquitetura**: Estudar diagrama de processos Electron
2. **Mapear Hooks**: Compreender fluxo de dados nos hooks personalizados
3. **APIs Electron**: Familiarizar-se com handlers IPC disponíveis
4. **Sistema de Projetos**: Entender estrutura de dados `.avalibras`

### Áreas de Contribuição Sugeridas

1. **Implementação de Configurações**: Menu Ferramentas → Configurações
2. **Sistema de Estatísticas**: Track tempo de uso, features mais usadas
3. **Melhorias na Timeline**: Zoom, scroll horizontal, atalhos
4. **Import/Export Avançado**: Formatos adicionais, integração LMS

### Padrões de Código

- **Components**: Functional components com hooks
- **State Management**: Hooks personalizados para lógica de negócio
- **API Calls**: Sempre via apiService.js com fallback
- **Error Handling**: Sempre usar errorHandler.log() com contexto
- **Nomenclatura**: Inglês para código, português para UI/mensagens

---

## 📞 Contato e Suporte

Este manual técnico é um documento vivo e deve ser atualizado conforme a aplicação evolui.

**Manutenção do Manual**:
- Atualizar diagramas quando arquitetura mudar
- Documentar novas funcionalidades assim que implementadas
- Manter seção de recursos futuros atualizada
- Adicionar novos padrões de código conforme surgirem

---

*Última atualização: Outubro 2025*
*Versão: 2.0.0*
*Aplicação: AvaLIBRAS*