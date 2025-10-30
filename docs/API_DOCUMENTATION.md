# Documentação da API v2.0.0 (Criador AvaLIBRAS)

Este documento detalha as APIs expostas pelo **Criador AvaLIBRAS v2.0.0**, focando na interface `electronAPI` disponível no processo de renderização (frontend React) e nos principais handlers IPC (Inter-Process Communication) gerenciados pelo processo principal do Electron (`main.js`).

**⚠️ IMPORTANTE**: Esta documentação cobre apenas as APIs do **Criador AvaLIBRAS**. As APIs do **Aplicador AvaLIBRAS** serão documentadas quando implementado.

## 1. Visão Geral da Arquitetura de Comunicação

A comunicação entre o frontend (processo de renderização React) e o backend (processo principal Electron) é realizada de forma segura através de um `preload.js` script. Este script utiliza `contextBridge` para expor um objeto `window.electronAPI` ao contexto do frontend, garantindo que o processo de renderização não tenha acesso direto aos módulos Node.js ou ao sistema de arquivos.

O `src/utils/apiService.js` no frontend atua como uma camada de abstração, fornecendo uma interface unificada para as APIs, com fallback para ambiente web (se aplicável) e tratamento de erros robusto.

## 2. `window.electronAPI` (APIs Expostas via `preload.js`)

O objeto `window.electronAPI` é a principal interface para o frontend interagir com as funcionalidades nativas do sistema e do Electron. Todas as funções são assíncronas e retornam Promises.

### 2.1. Controles da Janela

*   **`minimizeApp(): Promise<void>`**
    *   **Descrição**: Minimiza a janela principal da aplicação
    *   **Retorno**: `Promise<void>` - Resolve quando a janela for minimizada

*   **`maximizeApp(): Promise<void>`**
    *   **Descrição**: Maximiza/restaura a janela principal da aplicação
    *   **Retorno**: `Promise<void>` - Resolve quando a janela for maximizada/restaurada

*   **`closeApp(): Promise<void>`**
    *   **Descrição**: Fecha a janela principal da aplicação
    *   **Retorno**: `Promise<void>` - Resolve quando a janela for fechada

### 2.2. APIs de Vídeo

*   **`video.getVideoUrl(videoPath: string): Promise<string>`**
    *   **Descrição**: Solicita um URL local para streaming de um arquivo de vídeo específico. O processo principal inicia um servidor HTTP temporário para servir o vídeo.
    *   **Parâmetros**:
        *   `videoPath` (string): Caminho absoluto para o arquivo de vídeo no sistema de arquivos.
    *   **Retorno**: `Promise<string>` - URL `http://localhost:porta/caminho/do/video.mp4` para uso no elemento `<video>`.

*   **`video.cutVideo(options: object): Promise<string>`**
    *   **Descrição**: Realiza o corte de um segmento de vídeo usando FFmpeg em um worker thread. O caminho do arquivo de saída é gerado automaticamente.
    *   **Parâmetros**:
        *   `options` (object): Objeto com as opções de corte, incluindo `videoPath`, `startTime` e `endTime`.
    *   **Retorno**: `Promise<string>` - Caminho absoluto do novo vídeo cortado.

*   **`video.processVideo(task: object): Promise<object>`**
    *   **Descrição**: Envia uma tarefa de processamento de vídeo genérica para o worker FFmpeg.
    *   **Parâmetros**:
        *   `task` (object): Objeto contendo detalhes da tarefa (tipo, caminho, parâmetros).
    *   **Retorno**: `Promise<object>` - Resultado da operação com metadados.

*   **`video.getVideoInfo(videoPath: string): Promise<object>`**
    *   **Descrição**: Obtém metadados de um arquivo de vídeo, como duração, dimensões e codec.
    *   **Parâmetros**:
        *   `videoPath` (string): Caminho absoluto do vídeo.
    *   **Retorno**: `Promise<object>` - Objeto com os metadados do vídeo.

### 2.3. APIs de Sistema

*   **`system.getSystemInfo(): Promise<object>`**
    *   **Descrição**: Retorna informações básicas sobre o sistema operacional de forma assíncrona.
    *   **Retorno**: `Promise<object>` - Objeto com informações do sistema.

*   **`system.getSystemInfoSync(): object`**
    *   **Descrição**: Retorna informações básicas sobre o sistema operacional de forma síncrona.
    *   **Retorno**: `object` - Objeto com informações do sistema.

*   **`system.getSystemDoubleClickTime(): Promise<number>`**
    *   **Descrição**: Obtém o tempo de duplo clique configurado no sistema operacional do usuário para criar uma experiência de UI mais responsiva.
    *   **Retorno**: `Promise<number>` - O tempo de duplo clique em milissegundos.

*   **`system.getCpuUsage(): Promise<string>`**
    *   **Descrição**: Calcula e retorna o uso atual da CPU.
    *   **Retorno**: `Promise<string>` - O uso de CPU formatado como porcentagem (ex: "15.23%").

*   **`system.fileExists(filePath: string): Promise<boolean>`**
    *   **Descrição**: Verifica se um arquivo existe no caminho especificado.
    *   **Parâmetros**:
        *   `filePath` (string): Caminho absoluto para o arquivo.
    *   **Retorno**: `Promise<boolean>` - `true` se o arquivo existir.

*   **`system.createDirectory(dirPath: string): Promise<void>`**
    *   **Descrição**: Cria um diretório no caminho especificado.
    *   **Parâmetros**:
        *   `dirPath` (string): Caminho absoluto para o diretório.
    *   **Retorno**: `Promise<void>`

*   **`system.ensureDirectory(dirPath: string): Promise<void>`**
    *   **Descrição**: Garante que um diretório exista, criando-o se necessário.
    *   **Parâmetros**:
        *   `dirPath` (string): Caminho absoluto para o diretório.
    *   **Retorno**: `Promise<void>`

*   **`system.copyFile(srcPath: string, destPath: string): Promise<void>`**
    *   **Descrição**: Copia um arquivo de um local para outro.
    *   **Parâmetros**:
        *   `srcPath` (string): Caminho do arquivo de origem.
        *   `destPath` (string): Caminho do arquivo de destino.
    *   **Retorno**: `Promise<void>`

*   **`system.getPath(name: string): Promise<string>`**
    *   **Descrição**: Retorna caminhos para diretórios especiais do sistema.
    *   **Parâmetros**:
        *   `name` (string): Nome do caminho ('home', 'documents', 'desktop', 'temp', 'userData', etc.).
    *   **Retorno**: `Promise<string>` - Caminho absoluto do diretório.

*   **`system.clearTempFiles(): Promise<object>`**
    *   **Descrição**: Limpa todos os arquivos temporários gerados pela aplicação.
    *   **Retorno**: `Promise<object>` - `{ success: boolean, error?: string }`

*   **`system.getDefaultDocumentsPath(): Promise<string>`**
    *   **Descrição**: Retorna o caminho padrão da pasta de documentos do usuário.
    *   **Retorno**: `Promise<string>` - Caminho absoluto para a pasta de documentos.

### 2.4. APIs de Utilitários

*   **`path.join(...args: string[]): Promise<string>`**
    *   **Descrição**: Junta segmentos de caminho em um caminho normalizado.
    *   **Retorno**: `Promise<string>`

*   **`path.dirname(p: string): Promise<string>`**
    *   **Descrição**: Retorna o nome do diretório de um caminho.
    *   **Retorno**: `Promise<string>`

*   **`path.basename(p: string): Promise<string>`**
    *   **Descrição**: Retorna a última porção de um caminho.
    *   **Retorno**: `Promise<string>`

*   **`path.relative(from: string, to: string): Promise<string>`**
    *   **Descrição**: Retorna o caminho relativo entre dois caminhos.
    *   **Retorno**: `Promise<string>`

*   **`shell.openExternal(url: string): Promise<void>`**
    *   **Descrição**: Abre uma URL no navegador padrão do usuário.
    *   **Retorno**: `Promise<void>`

*   **`showItemInFolder(fullPath: string): void`**
    *   **Descrição**: Mostra o arquivo especificado no gerenciador de arquivos do sistema.

### 2.5. APIs de Projeto

*   **`project.saveProject(projectData: object, filePath: string): Promise<object>`**
    *   **Descrição**: Salva os dados de um projeto AvaLIBRAS em arquivo `.avaprojet`
    *   **Parâmetros**:
        *   `projectData` (object): Objeto completo do projeto a ser salvo
        *   `filePath` (string): Caminho absoluto onde salvar o arquivo
    *   **Retorno**: `Promise<object>` - Resultado da operação:
        ```javascript
        {
          success: boolean,
          error?: string
        }
        ```

*   **`project.loadProject(filePath: string): Promise<object>`**
    *   **Descrição**: Carrega os dados de um projeto AvaLIBRAS de arquivo `.avaprojet`
    *   **Parâmetros**:
        *   `filePath` (string): Caminho absoluto do arquivo `.avaprojet`
    *   **Retorno**: `Promise<object>` - Resultado com dados do projeto:
        ```javascript
        {
          success: boolean,
          projectData?: object,
          error?: string
        }
        ```

*   **`project.getRecentProjects(): Promise<string[]>`**
    *   **Descrição**: Retorna lista dos projetos recentes do armazenamento local
    *   **Retorno**: `Promise<string[]>` - Array de caminhos absolutos dos projetos recentes

### 2.6. APIs de Diálogo

*   **`showSaveDialog(options: object): Promise<object>`**
    *   **Descrição**: Exibe diálogo de salvamento de arquivo nativo do sistema
    *   **Parâmetros**:
        *   `options` (object): Opções do diálogo (title, defaultPath, filters)
    *   **Retorno**: `Promise<object>` - Resultado do diálogo:
        ```javascript
        {
          canceled: boolean,
          filePath?: string,
          bookmark?: string
        }
        ```

*   **`showOpenDialog(options: object): Promise<object>`**
    *   **Descrição**: Exibe diálogo de abertura de arquivo nativo do sistema
    *   **Parâmetros**:
        *   `options` (object): Opções do diálogo (title, filters, properties)
    *   **Retorno**: `Promise<object>` - Resultado do diálogo:
        ```javascript
        {
          canceled: boolean,
          filePaths: string[],
          bookmarks: string[]
        }
        ```

### 2.7. APIs de Importação/Exportação

*   **`exportProject(projectData: object, outputPath: string, compressionLevel?: number, password?: string): Promise<object>`**
    *   **Descrição**: Exporta prova completa em formato `.ava` (ZIP com todos os recursos), com nível de compressão e senha configuráveis.
    *   **Parâmetros**:
        *   `projectData` (object): Objeto completo do projeto.
        *   `outputPath` (string): Caminho onde salvar o arquivo `.ava`.
        *   `compressionLevel` (number, opcional): Nível de compressão ZIP (0-9, -1 para padrão). Padrão é -1.
        *   `password` (string, opcional): Senha para criptografar o projeto.
    *   **Retorno**: `Promise<object>` - Resultado da exportação.

*   **`exportQuestion(question: object, outputPath: string, compressionLevel?: number): Promise<object>`**
    *   **Descrição**: Exporta questão individual em formato `.avaquest` (ZIP com todos os recursos), com nível de compressão configurável.
    *   **Parâmetros**:
        *   `question` (object): Objeto da questão a ser exportada.
        *   `outputPath` (string): Caminho onde salvar o arquivo `.avaquest`.
        *   `compressionLevel` (number, opcional): Nível de compressão ZIP (0-9, -1 para padrão). Padrão é -1.
    *   **Retorno**: `Promise<object>` - Resultado da exportação.

*   **`importQuestion(avaFilePath: string, projectBasePath: string): Promise<object>`**
    *   **Descrição**: Importa uma questão de um arquivo `.avaquest`, copiando a mídia para a pasta do projeto atual.
    *   **Parâmetros**:
        *   `avaFilePath` (string): Caminho do arquivo `.avaquest` a ser importado.
        *   `projectBasePath` (string): Caminho base do projeto atual para onde a mídia será copiada.
    *   **Retorno**: `Promise<object>` - Objeto com os dados da questão importada.

### 2.8. APIs de Interação com a UI

*   **`processDroppedFiles(filePaths: string[]): Promise<object[]>`**
    *   **Descrição**: Processa arquivos que foram arrastados e soltos na janela, retornando informações sobre os vídeos válidos.
    *   **Parâmetros**:
        *   `filePaths` (string[]): Array com os caminhos dos arquivos.
    *   **Retorno**: `Promise<object[]>` - Array de objetos representando os arquivos de vídeo processados.

*   **`window.createPreview(videoUrl: string): Promise<void>`**
    *   **Descrição**: Cria uma nova janela para pré-visualização de um vídeo.
    *   **Parâmetros**:
        *   `videoUrl` (string): URL do vídeo a ser exibido.
    *   **Retorno**: `Promise<void>`

### 2.9. APIs de Menu

*   **`onMenuNewProject(callback: Function): void`**: Registra listener para o evento de menu "Novo Projeto".
*   **`onMenuOpenProject(callback: Function): void`**: Registra listener para o evento de menu "Abrir Projeto".
*   **`onMenuSaveProject(callback: Function): void`**: Registra listener para o evento de menu "Salvar".
*   **`onMenuSaveProjectAs(callback: Function): void`**: Registra listener para o evento de menu "Salvar Como...".
*   **`onMenuExportProject(callback: Function): void`**: Registra listener para o evento de menu "Exportar Prova".
*   **`onMenuAddQuestion(callback: Function): void`**: Registra listener para o evento de menu "Adicionar Nova Questão".
*   **`onMenuDuplicateQuestion(callback: Function): void`**: Registra listener para o evento de menu "Duplicar Questão Atual".
*   **`onMenuDeleteQuestion(callback: Function): void`**: Registra listener para o evento de menu "Remover Questão".
*   **`onMenuSettings(callback: Function): void`**: Registra listener para o evento de menu "Configurações".
*   **`removeAllListeners(event: string): void`**: Remove todos os listeners para um evento de menu específico.

### 2.8. APIs de Desenvolvimento

*   **`toggleDevTools(): void`**
    *   **Descrição**: Abre/fecha as Ferramentas de Desenvolvedor (DevTools)

### 2.9. APIs de Configurações

*   **`settings.get(): Promise<object>`**
    *   **Descrição**: Obtém as configurações atuais do aplicativo.
    *   **Retorno**: `Promise<object>` - Objeto com as configurações.

*   **`settings.save(newSettings: object): Promise<object>`**
    *   **Descrição**: Salva as novas configurações do aplicativo.
    *   **Parâmetros**:
        *   `newSettings` (object): Objeto com as novas configurações a serem salvas.
    *   **Retorno**: `Promise<object>` - `{ success: boolean, error?: string }`

### 2.10. APIs de Criptografia

*   **`encryptModal.onConfirm(password: string): void`**
    *   **Descrição**: Confirma a exportação de um projeto com criptografia.
    *   **Parâmetros**:
        *   `password` (string): Senha para criptografar o projeto.

## 3. Handlers IPC Críticos (Processo Principal - `electron/main.js`)

### 3.1. Handlers de Sistema

#### `get-system-info`
```javascript
ipcMain.handle('get-system-info', async () => {
  // Retorna informações detalhadas do sistema operacional
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
    homedir: os.homedir(),
    tmpdir: os.tmpdir()
  };
});
```

#### `file-exists`
```javascript
ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});
```

#### `system:clear-temp-files`
```javascript
ipcMain.handle('system:clear-temp-files', async () => {
  // Limpa todos os arquivos temporários da aplicação
});
```

#### `system:get-default-documents-path`
```javascript
ipcMain.handle('system:get-default-documents-path', async () => {
  // Retorna o caminho padrão da pasta de documentos do usuário
});
```

### 3.2. Handlers de Vídeo

#### `get-video-url`
```javascript
ipcMain.handle('get-video-url', async (event, videoPath) => {
  // Inicia servidor HTTP para streaming de vídeo com suporte a range requests
  // Implementa cache para evitar múltiplos servidores para o mesmo arquivo
  // Retorna URL localhost para uso no elemento <video>
});
```

#### `video:process-overlay`
```javascript
ipcMain.handle('video:process-overlay', async (event, options) => {
  // Aplica um overlay de imagem a um vídeo usando FFmpeg em um worker thread.
});
```

#### `read-file-as-data-url`
```javascript
ipcMain.handle('read-file-as-data-url', async (event, filePath) => {
  // Lê um arquivo de imagem e o converte para um Data URL.
});
```

### 3.3. Handlers de Projeto

#### `save-project`
```javascript
ipcMain.handle('save-project', async (event, projectData, filePath) => {
  // Salva projeto em formato JSON com validação
  // Atualiza lista de projetos recentes
  // Retorna resultado da operação
  // O objeto projectData agora inclui as propriedades `isDirty` e `filePath`
});
```

#### `load-project`
```javascript
ipcMain.handle('load-project', async (event, filePath) => {
  // Carrega projeto de arquivo JSON com validação
  // Adiciona à lista de projetos recentes
  // Retorna dados do projeto
  // O objeto projectData agora inclui as propriedades `isDirty` e `filePath`
});
```

## 4. apiService.js - Camada de Abstração

### 4.1. Funcionalidades

O `apiService.js` fornece:

*   **Detecção de Ambiente**: Identifica automaticamente se está rodando no Electron ou navegador
*   **Sistema de Fallback**: Múltiplas estratégias para cada API com graceful degradation
*   **Validação de APIs**: Verificação dinâmica de disponibilidade das APIs
*   **Cache Inteligente**: Cache para operações críticas para melhorar performance
*   **Tratamento de Erros**: Centralizado e consistente para todas as chamadas

### 4.2. Métodos Principais

```javascript
class ApiService {
  // Inicialização e detecção de ambiente
  async init(): Promise<Capabilities>

  // Aguarda até que APIs estejam prontas
  async waitUntilReady(): Promise<boolean>

  // API de vídeo com fallback robusto
  async getVideoUrl(filePath: string): Promise<string>

  // API de sistema com suporte síncrono/assíncrono
  async getSystemInfo(): Promise<object>

  // Validação assíncrona de APIs
  validateAPIsAsync(): void
}
```

### 4.3. Sistema de Capacidades

```javascript
const capabilities = {
  isElectron: boolean,
  hasVideoAPI: boolean,
  hasSystemAPI: boolean,
  hasFileAPI: boolean,
  hasProjectAPI: boolean
}
```

## 5. Tratamento de Erros

### 5.1. Padrão de Erros

Todas as APIs retornam Promises que podem ser rejeitadas com objetos de erro padronizados:

```javascript
{
  code: string,        // Código de erro único
  message: string,     // Mensagem descritiva
  context?: object,    // Contexto adicional do erro
  stack?: string       // Stack trace (modo desenvolvimento)
}
```

### 5.2. Tipos de Erro Comuns

*   `API_UNAVAILABLE`: API não está disponível no ambiente atual
*   `FILE_NOT_FOUND`: Arquivo especificado não existe
*   `PERMISSION_DENIED`: Sem permissão para acessar o recurso
*   `INVALID_PARAMETERS`: Parâmetros inválidos fornecidos
*   `PROCESSING_ERROR`: Erro durante processamento de vídeo
*   `SYSTEM_ERROR`: Erro do sistema operacional

### 5.3. Estratégias de Recuperação

*   **Retry Automático**: Para erros temporários de rede/sistema
*   **Fallback**: Alternativas quando API primária falha
*   **Notificação**: Feedback visual claro para o usuário
*   **Logging**: Registro detalhado para depuração

## 6. Considerações de Segurança

### 6.1. Context Isolation

*   **Configuração**: `contextIsolation: true` nas webPreferences
*   **Isolamento**: Processo de renderização não acessa Node.js diretamente
*   **Ponte Segura**: Apenas APIs explicitamente expostas via `contextBridge`

### 6.2. Node Integration

*   **Desativado**: `nodeIntegration: false` no processo de renderização
*   **Segurança**: Impede execução de código Node.js no contexto do navegador
*   **Controle**: Acesso controlado via preload script validado

### 6.3. Validação de Entrada

*   **Sanitização**: Todos os inputs são validados no processo principal
*   **Tipagem**: Verificação estrita de tipos de dados
*   **Path Traversal**: Proteção contra ataques de path traversal
*   **Injection**: Prevenção contra injeção de comandos

## 7. Performance e Otimização

### 7.1. Cache de APIs

*   **Cache Crítico**: Operações frequentes cacheadas no preload
*   **TTL**: Time-to-live configurável para cached items
*   **Invalidação**: Cache invalidado quando necessário

### 7.2. Lazy Loading

*   **Carregamento Sob Demanda**: APIs inicializadas apenas quando necessárias
*   **Validação Assíncrona**: APIs validadas em background sem bloquear UI
*   **Progressive Enhancement**: Funcionalidade básica disponível imediatamente

### 7.3. Streaming de Vídeo

*   **Range Requests**: Suporte a bytes ranges para streaming eficiente
*   **Servidor Único**: Servidor HTTP reutilizado para múltiplos vídeos
*   **Cleanup**: Servidores encerrados automaticamente quando não necessários

## 8. Exemplos de Uso

### 8.1. Carregar Projeto

```javascript
// Usando apiService
try {
  const result = await apiService.showOpenDialog({
    title: 'Carregar Projeto',
    filters: [
      { name: 'AvaLIBRAS Projects', extensions: ['avaprojet'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const projectData = await apiService.loadProject(result.filePaths[0]);
    // Processar dados do projeto
  }
} catch (error) {
  console.error('Erro ao carregar projeto:', error);
}
```

### 8.2. Processar Vídeo

```javascript
// Obter URL para streaming
const videoUrl = await apiService.getVideoUrl('/path/to/video.mp4');

// Cortar vídeo
const cutVideoPath = await window.electronAPI.video.cutVideo(
  '/path/to/video.mp4',
  10.5,  // startTime
  25.3,  // endTime
  '/path/to/cut_video.mp4'
);
```

### 8.3. Salvar Projeto

```javascript
const projectData = {
  name: "Minha Prova",
  type: "multiple_choice",
  totalAlternatives: 4,
  questions: [...]
};

const result = await window.electronAPI.project.saveProject(
  projectData,
  '/path/to/project.avaprojet'
);

if (result.success) {
  console.log('Projeto salvo com sucesso!');
} else {
  console.error('Erro ao salvar:', result.error);
}
```

---

*Versão: 2.0.0*
*Última atualização: Outubro 2025*
*Aplicação: AvaLIBRAS*