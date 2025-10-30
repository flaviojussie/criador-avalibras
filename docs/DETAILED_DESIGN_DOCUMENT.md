# Documento de Design Detalhado (DDD): Módulo de Edição de Vídeo v2.0.0

## 1. Introdução

Este documento detalha o design do módulo de edição de vídeo do **Criador AvaLIBRAS v2.0.0**, com foco nas funcionalidades de corte de vídeo e gerenciamento de overlays. O objetivo é fornecer uma compreensão aprofundada da implementação, interações entre componentes e considerações técnicas para manutenção e futuras expansões.

**⚠️ AVISO**: Este documento cobre apenas o **Criador AvaLIBRAS** (editor). O **Aplicador AvaLIBRAS** (player para estudantes) ainda não foi implementado e está planejado para desenvolvimento futuro.

## 2. Visão Geral do Módulo

O módulo de edição de vídeo é o coração do Criador AvaLIBRAS, permitindo que os usuários manipulem vídeos para criar questões de prova. Ele integra o player de vídeo, a timeline interativa e as ferramentas de corte e overlay.

### Componentes Principais:
*   `src/hooks/useVideoEditor.js` (Hook): Gerencia a lógica de estado e as operações de edição de vídeo
*   `src/components/Timeline.jsx` (Componente): Renderiza a interface da linha do tempo, incluindo marcadores e seleções
*   `src/components/Editor.jsx` (Componente): Componente principal que orquestra o player de vídeo e a timeline
*   `src/hooks/useOverlay.js` (Hook): Gerencia o sistema de overlays
*   `src/components/VideoOverlay.jsx` (Componente): Responsável pela renderização visual dos overlays
*   `electron/worker.js`: Processa operações de FFmpeg em um thread separado
*   `electron/main.js`: Gerencia a comunicação IPC e o servidor HTTP para streaming de vídeo
*   `src/components/EncryptModal.jsx` (Componente): Modal para inserir senha ao exportar projeto criptografado.
*   `src/components/SettingsModal.jsx` (Componente): Modal para configurar as preferências do aplicativo.
*   `src/components/ConfirmModal.jsx` (Componente): Modal genérico para confirmação de ações destrutivas.
*   `src/components/AboutModal.jsx` (Componente): Modal com informações sobre o aplicativo.
*   `src/components/KeyboardShortcutsModal.jsx` (Componente): Modal que exibe os atalhos de teclado.
*   `src/components/LoadingModal.jsx` (Componente): Modal de carregamento para operações assíncronas.

## 3. Design Detalhado: Funcionalidade de Corte de Vídeo

### 3.1. Fluxo de Usuário para Corte

1.  O usuário carrega um vídeo para uma questão
2.  O usuário ativa a "Ferramenta de Corte" (`cutButton`)
3.  O usuário seleciona um trecho na linha do tempo arrastando o mouse (definindo `startTime` e `endTime` da seleção)
4.  O usuário confirma o corte através da interface
5.  O sistema processa o corte e atualiza o vídeo no player

### 3.2. Componentes Envolvidos e Interações

*   **`Timeline.jsx`**:
    *   Detecta eventos de `mousedown`, `mousemove`, `mouseup` para iniciar, atualizar e finalizar a seleção de um trecho
    *   Comunica o `selectionState` (início, fim, se está selecionando) para `useVideoEditor`
    *   Renderiza visualmente a área selecionada na linha do tempo
    *   Interface responsiva com tooltips e feedback visual

*   **`useVideoEditor.js`**:
    *   Recebe o `selectionState` da `Timeline`
    *   Contém a lógica para gerenciar o estado de seleção
    *   Quando o corte é confirmado, chama API do Electron para processar o vídeo
    *   Atualiza o `videoSource` da questão após o corte ser concluído
    *   Gerencia estados complexos de arrasto e seleção

*   **`electron/main.js`**:
    *   Recebe a chamada IPC para processamento de vídeo
    *   Envia a tarefa de corte para `electron/worker.js`
    *   Monitora o progresso e o resultado da tarefa do worker
    *   Fornece feedback ao usuário durante o processamento

*   **`electron/worker.js`**:
    *   Executa a função de corte usando FFmpeg
    *   **Processo de Corte Detalhado**:
        1.  **Etapa 1**: Criar parte 1 (início até ponto de corte)
        2.  **Etapa 2**: Criar parte 2 (ponto de corte até final)
        3.  **Etapa 3**: Criar lista de concatenação
        4.  **Etapa 4**: Concatenar partes em novo arquivo
        5.  **Etapa 5**: Limpar arquivos temporários
    *   Retorna o caminho do novo vídeo cortado ou erro

### 3.3. Considerações Técnicas para Corte

*   **FFmpeg**: Utilizado para processamento de vídeo em worker thread
*   **Arquivos Temporários**: Criados em `/tmp/avalibras-*` com limpeza automática e garantida após cada operação.
*   **Assincronicidade**: Operações FFmpeg não bloqueiam a UI
*   **Performance**: Otimizado para vídeos grandes com sistema de fila

## 4. Design Detalhado: Gerenciamento de Overlays

### 4.1. Fluxo de Usuário para Overlays

1.  O usuário clica no botão "Adicionar Imagem" (`overlayButton`)
2.  O vídeo é pausado automaticamente e o tempo atual é capturado
3.  Um modal (`OverlayModal`) é exibido para configuração da imagem
4.  O usuário configura: tempo de início, duração, posição, tamanho, opacidade
5.  A imagem é renderizada sobre o vídeo durante reprodução no intervalo configurado
6.  Usuário pode arrastar e redimensionar overlays diretamente no player

### 4.2. Componentes Envolvidos e Interações

*   **`useOverlay.js` (Hook)**:
    *   Gerencia estado dos overlays (lista, propriedades)
    *   Contém lógica para adicionar, remover e atualizar overlays
    *   `drawOverlays()`: Renderização via Canvas com `requestAnimationFrame`
    *   Cálculos de posição e dimensão responsivos

*   **`VideoOverlay.jsx` (Componente)**:
    *   Renderiza elemento `<canvas>` sobre player de vídeo
    *   Utiliza contexto 2D do Canvas para desenhar imagens
    *   Integração com `useVideoEditor` para arrasto interativo

*   **`OverlayModal.jsx` (Componente)**:
    *   Interface para configuração de atributos do overlay
    *   Validação de inputs e preview em tempo real
    *   Chama `useOverlay.addOverlay()` com dados configurados

*   **`electron/worker.js` (para exportação)**:
    *   Processa overlays permanentemente via FFmpeg
    *   Task `process-overlay`: Aplica filtros FFmpeg no vídeo final

### 4.3. Considerações Técnicas para Overlays

*   **Renderização em Tempo Real**: Canvas API para feedback instantâneo
*   **FFmpeg para Exportação**: Overlays permanentes no arquivo final, com qualidade e compressão configuráveis pelo usuário.
*   **Sincronização Temporal**: Precisão de milissegundos
*   **Performance**: Otimizado com RAF e cache de imagens
*   **Carregamento Assíncrono**: Imagens carregadas sob demanda

## 5. Estrutura de Dados

### Array `overlays` dentro de `question`:

O objeto `question` agora contém um array `overlays`, permitindo múltiplas imagens sobrepostas no mesmo vídeo.

```javascript
// dentro do objeto question
"overlays": [
  {
    "id": "overlay_1", // ID único gerado automaticamente
    "path": "/path/to/image.png", // Caminho absoluto da imagem
    "startTime": 5.0, // Tempo em segundos que o overlay deve aparecer
    "duration": 3.0, // Duração em segundos que o overlay deve permanecer visível
    "position": "center", // Posição na tela ("center", "top-left", etc.)
    "size": 80, // Tamanho relativo (porcentagem da largura do vídeo)
    "opacity": 80 // Opacidade (0 a 100)
  }
]
```

### Propriedade `isEncrypted` no Projeto:

O objeto `projectData` agora contém uma propriedade booleana `isEncrypted` para indicar se o projeto foi salvo com criptografia.

```javascript
// dentro do objeto projectData
"isEncrypted": true, // ou false
```

### Estado de Seleção em `useVideoEditor`:

```javascript
{
  selectionState: {
    startTime: number,
    endTime: number,
    isSelecting: boolean,
    isDraggingHandle: boolean,
    isSelectionModeActive: boolean
  },
  markerDragState: {
    isDragging: boolean,
    markerKey: string,
    tempMarkers: object
  },
  overlayDragState: {
    isDragging: boolean,
    overlayId: string,
    currentTime: number
  }
}
```

## 6. Sistema de Estados e Eventos

### 6.1. Gerenciamento de Estados

O sistema utiliza uma arquitetura de estados centralizada com hooks personalizados:

*   **useVideoEditor**: Gerencia estados de edição, seleção e arrasto.
*   **useOverlay**: Gerencia estados de overlays e renderização.
*   **useQuestions**: Gerencia estados de projetos e questões.

### 6.2. Sistema de Eventos

*   **Eventos de Mouse**: Mousedown, mousemove, mouseup para seleção e arrasto.
*   **Eventos de Teclado**: Atalhos para ferramentas e navegação.
*   **Eventos de Vídeo**: Timeupdate para sincronização de overlays.
*   **Eventos IPC**: Comunicação entre processos Electron.

## 7. Pontos Críticos e Desafios

### 7.1. Sincronização FFmpeg/UI

*   **Desafio**: Garantir que estado da UI reflita vídeo pós-processamento.
*   **Solução**: Sistema de promises e callbacks para atualização síncrona.
*   **Fallback**: Estados de loading e retry automático.

### 7.2. Gerenciamento de Recursos

*   **Memória**: Cache inteligente de imagens e limpeza automática.
*   **CPU**: Worker threads para processamento não-bloqueante.
*   **Disco**: Sistema temporário robusto com limpeza garantida após cada operação e opção de limpeza manual.

### 7.3. Tratamento de Erros

*   **Validação**: Validação de inputs em múltiplas camadas.
*   **Recuperação**: Sistema de retry e fallback automático.
*   **Feedback**: Notificações visuais e logging detalhado.

### 7.4. Experiência do Usuário (UX)

*   **Detecção de Clique Adaptativo**: O `useVideoEditor` implementa um sistema que mede a performance do sistema do usuário para ajustar dinamicamente o tempo de detecção de duplo-clique, garantindo uma experiência de usuário consistente em diferentes máquinas.

### 7.5. Extensibilidade

*   **Plugins**: Arquitetura preparada para novas ferramentas.
*   **APIs**: Interfaces bem definidas para integração.
*   **Configuração**: Sistema de preferências planejado.

## 8. Criptografia de Projetos

### 8.1. Fluxo de Usuário para Criptografia

1.  O usuário seleciona a opção "Exportar Prova..."
2.  Um modal (`EncryptModal`) é exibido, solicitando uma senha.
3.  O usuário insere uma senha e confirma.
4.  O projeto é exportado e o arquivo `videos.js` dentro do `.ava` é criptografado com a senha fornecida.

### 8.2. Componentes Envolvidos e Interações

*   **`EncryptModal.jsx`**:
    *   Interface para o usuário inserir a senha.
    *   Chama a função `onConfirm` com a senha inserida.

*   **`electron/main.js`**:
    *   Recebe a chamada IPC para `exportProject` com a senha.
    *   Usa o módulo `crypto` do Node.js para criptografar o arquivo `videos.js`.

## 9. Configurações da Aplicação

### 9.1. Fluxo de Usuário para Configurações

1.  O usuário clica no ícone de engrenagem na barra de status ou no menu "Ferramentas" > "Configurações".
2.  O modal `SettingsModal` é exibido.
3.  O usuário pode alterar configurações como o caminho padrão para salvar projetos, a qualidade de vídeo e o nível de compressão.
4.  As configurações são salvas no arquivo `settings.json` na pasta de dados do usuário.

### 9.2. Componentes Envolvidos e Interações

*   **`SettingsModal.jsx`**:
    *   Interface para o usuário visualizar e alterar as configurações.
    *   Chama a API `settings.save` para persistir as alterações.

*   **`electron/main.js`**:
    *   Handlers IPC `get-settings` e `save-settings` para ler e escrever no arquivo `settings.json`.

### 9.1. Estratégias de Performance

*   **Lazy Loading**: Componentes carregados sob demanda
*   **Memoização**: React.memo e useMemo para renders otimizados
*   **Virtualização**: Planejada para timelines complexas
*   **Web Workers**: Processamento em background

### 9.2. Otimizações Específicas

*   **Canvas**: RAF para renderização suave de overlays
*   **FFmpeg**: Parâmetros otimizados para qualidade/performance
*   **Cache**: Sistema multi-nível de cache de recursos
*   **Debouncing**: Para eventos de mouse e teclado频繁

## 10. Considerações de Acessibilidade

### 10.1. Navegação por Teclado

*   **Atalhos**: Definidos para todas as funções principais
*   **Tab Order**: Ordem lógica de navegação
*   **Focus Management**: Indicadores visuais claros

### 10.2. Feedback Visual

*   **Contraste**: Cores com contraste adequado
*   **Tamanhos**: Elementos clicáveis com tamanho mínimo
*   **Animações**: Oções para reduzir motion

### 10.3. Leitores de Tela

*   **ARIA Labels**: Descrições adequadas para elementos interativos
*   **Roles**: Semântica HTML correta
*   **Anúncios**: Notificações de mudanças de estado

## 11. Futuras Expansões

### 11.1. Funcionalidades Planejadas

*   **Transições de Vídeo**: Fade, wipe, dissolve
*   **Efeitos de Áudio**: Volume, fade in/out
*   **Textos e Legendas**: Overlay de texto sincronizado
*   **Múltiplas Tracks**: Vídeo, áudio, subtitles separados

### 11.2. Melhorias de UI/UX

*   **Zoom na Timeline**: Visualização detalhada de segmentos
*   **Multi-seleção**: Selecionar múltiplos segmentos
*   **Undo/Redo**: Sistema completo de histórico
*   **Templates**: Predefinições de configurações comuns

---

*Versão: 2.0.0*
*Última atualização: Outubro 2025*
*Aplicação: AvaLIBRAS*