// preload.js
const { contextBridge, ipcRenderer } = require('electron');

const isDev = process.env.ELECTRON_IS_DEV === 'true';
const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

devLog('🔧 Preload: Inicializando preload script...');

// ✅ SOLUÇÃO DEFINITIVA: Cache de APIs críticas para evitar problemas de timing
const apiCache = {
  systemInfo: null,
  systemInfoPromise: null,
  videoUrlPromises: new Map()
};

// Configuração específica para ambiente Electron
const isElectron = () => true;
const platform = process.platform;

// ✅ FUNÇÕES SÍNCRONAS: Implementações locais que não dependem de IPC
const getSystemInfoSync = () => {
  // Esta é agora uma chamada síncrona para o processo principal
  return ipcRenderer.sendSync('get-system-info-sync');
};

const fileExistsSync = (filePath) => {
  const fs = require('fs');
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

// Verificar se handlers estão disponíveis antes de expor
const checkHandler = (channel) => {
  try {
    // Enviar um ping para verificar se o handler existe
    ipcRenderer.send('ping');
    return true;
  } catch (error) {
    console.warn(`⚠️ Preload: Handler ${channel} pode não estar disponível:`, error.message);
    return false;
  }
};

// Expor APIs seguras para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  // Controles da janela
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  maximizeApp: () => ipcRenderer.send('maximize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),

  // APIs de Exportação e Importação
  exportProject: (projectData, outputPath, compressionLevel, password) => ipcRenderer.invoke('exportProject', projectData, outputPath, compressionLevel, password),
  exportQuestion: (question, outputPath, compressionLevel) => ipcRenderer.invoke('exportQuestion', question, outputPath, compressionLevel),
  importQuestion: (avaFilePath, projectBasePath) => ipcRenderer.invoke('import-question', avaFilePath, projectBasePath),

  // Diálogos
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Event listeners para estado da janela
  onWindowMaximize: (callback) => ipcRenderer.on('window-maximize', callback),
  onWindowUnmaximize: (callback) => ipcRenderer.on('window-unmaximize', callback),

  // Eventos de ciclo de vida da aplicação
  onAppClosing: (callback) => ipcRenderer.on('app-closing', callback),
  forceQuitApp: () => ipcRenderer.send('force-quit-app'),

  // Remover listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // APIs de Configurações
  settings: {
    get: () => ipcRenderer.invoke('get-settings'),
    save: (settings) => ipcRenderer.invoke('save-settings', settings),
  },

  // Informações do ambiente
  isElectron,
  platform,

  // Configuração específica do Electron
  electronConfig: {
    version: process.versions.electron,
    isDev: process.env.ELECTRON_IS_DEV === 'true',
    userDataPath: null, // Será definido quando disponível
  },

  // APIs de vídeo e processamento
  video: {
    // Obter informações do sistema
    getSystemDoubleClickTime: () => {
      devLog('🎥 Preload: Chamando get-system-double-click-time');
      return ipcRenderer.invoke('get-system-double-click-time');
    },

    // Processamento de vídeo
    processVideo: (videoPath, options) => {
      devLog('🎥 Preload: Chamando process-video');
      return ipcRenderer.invoke('process-video', videoPath, options);
    },

    // Exportação de vídeo
    exportVideo: (projectData, outputPath) => {
      devLog('🎥 Preload: Chamando export-video');
      return ipcRenderer.invoke('export-video', projectData, outputPath);
    },

    // Informações de vídeo
    getVideoInfo: (videoPath) => {
      devLog('🎥 Preload: Chamando get-video-info');
      return ipcRenderer.invoke('get-video-info', videoPath);
    },

    
    // Corte de vídeo
    cutVideo: (videoPath, startTime, endTime) => {
      devLog('✂️ Preload: Chamando video:cut para:', { videoPath, startTime, endTime });
      return ipcRenderer.invoke('video:cut', { videoPath, startTime, endTime });
    },

    // Get playable URL for video - IMPLEMENTAÇÃO HÍBRIDA CRÍTICA
    getVideoUrl: async (filePath) => {
      devLog('🎥 Preload: Chamando get-video-url para:', filePath);

      // Verificar cache primeiro
      if (apiCache.videoUrlPromises.has(filePath)) {
        const cachedPromise = apiCache.videoUrlPromises.get(filePath);
        try {
          const result = await cachedPromise;
          devLog('🎥 Preload: Retornando URL do cache para:', filePath);
          return result;
        } catch (error) {
          console.warn('🎥 Preload: Cache falhou, tentando IPC:', error.message);
        }
      }

      try {
        // Tentar IPC primeiro
        const promise = ipcRenderer.invoke('get-video-url', filePath);
        apiCache.videoUrlPromises.set(filePath, promise);

        const result = await promise;
        devLog('✅ Preload: URL obtida via IPC:', result);
        return result;
      } catch (error) {
        console.error('❌ Preload: Falha crítica na API de vídeo:', error);

        // Lançar erro para que o sistema de fallback funcione
        throw new Error(`Erro crítico na API de vídeo: ${error.message}`);
      }
    },
  },

  // APIs de projeto
  project: {
    // Salvar projeto
    saveProject: (projectData, filePath) => ipcRenderer.invoke('save-project', projectData, filePath),

    // Carregar projeto
    loadProject: (filePath) => ipcRenderer.invoke('load-project', filePath),

    // Obter projetos recentes
    getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),

    // Adicionar projeto aos recentes
    addToRecentProjects: (projectData) => ipcRenderer.invoke('add-to-recent-projects', projectData),
  },

  // ✅ SOLUÇÃO DEFINITIVA: APIs híbridas (síncronas + assíncronas)
  system: {
    // Obter informações do sistema - IMPLEMENTAÇÃO HÍBRIDA
    getSystemInfo: async () => {
      devLog('🖥️ Preload: Chamando get-system-info');

      // Tentar usar cache primeiro
      if (apiCache.systemInfo) {
        devLog('🖥️ Preload: Retornando systemInfo do cache');
        return apiCache.systemInfo;
      }

      // Se não há cache, tentar IPC
      try {
        const result = await ipcRenderer.invoke('get-system-info');
        apiCache.systemInfo = result; // Cachear resultado
        return result;
      } catch (error) {
        console.warn('🖥️ Preload: IPC falhou, usando implementação síncrona:', error.message);
        // Fallback para implementação síncrona
        const syncResult = getSystemInfoSync();
        apiCache.systemInfo = syncResult;
        return syncResult;
      }
    },

    // Versão síncrona para casos críticos
    getSystemInfoSync: () => {
      devLog('🖥️ Preload: Chamando getSystemInfoSync');
      if (!apiCache.systemInfo) {
        apiCache.systemInfo = getSystemInfoSync();
      }
      return apiCache.systemInfo;
    },

    // Limpar arquivos temporários
    clearTempFiles: () => ipcRenderer.invoke('system:clear-temp-files'),

    // Obter caminho padrão da pasta de documentos
    getDefaultDocumentsPath: () => ipcRenderer.invoke('system:get-default-documents-path'),

    // Verificar se arquivo existe - IMPLEMENTAÇÃO HÍBRIDA
    fileExists: async (filePath) => {
      devLog('📄 Preload: Chamando file-exists para:', filePath);

      try {
        const result = await ipcRenderer.invoke('file-exists', filePath);
        return result;
      } catch (error) {
        console.warn('📄 Preload: IPC falhou, usando implementação síncrona:', error.message);
        return fileExistsSync(filePath);
      }
    },

    // Versão síncrona para casos críticos
    fileExistsSync: (filePath) => {
      devLog('📄 Preload: Chamando fileExistsSync para:', filePath);
      return fileExistsSync(filePath);
    },

    // Abrir pasta no explorer
    showItemInFolder: (fullPath) => {
      devLog('📁 Preload: Chamando show-item-in-folder para:', fullPath);
      return ipcRenderer.send('show-item-in-folder', fullPath);
    },

    // Obter caminho de diretórios especiais
    getPath: async (name) => {
      devLog('📂 Preload: Chamando get-path para:', name);
      try {
        return await ipcRenderer.invoke('get-path', name);
      } catch (error) {
        console.warn('📂 Preload: IPC falhou para get-path:', error.message);
        // Fallback usando Electron API direto
        const { app } = require('electron');
        return app.getPath(name);
      }
    },

    // Criar diretório
    createDirectory: (dirPath) => {
      devLog('📁 Preload: Chamando create-directory para:', dirPath);
      return ipcRenderer.invoke('create-directory', dirPath);
    },

    // Garantir que um diretório exista
    ensureDirectory: (dirPath) => {
      devLog('📁 Preload: Chamando ensure-directory para:', dirPath);
      return ipcRenderer.invoke('ensure-directory', dirPath);
    },

    // Copiar arquivo
    copyFile: (srcPath, destPath) => {
      devLog('📄 Preload: Chamando copy-file para:', srcPath, destPath);
      return ipcRenderer.invoke('copy-file', srcPath, destPath);
    },

    // Obter uso de CPU
    getCpuUsage: () => {
      devLog('💻 Preload: Chamando get-cpu-usage');
      return ipcRenderer.invoke('get-cpu-usage');
    },
  },

  // APIs de manipulação de caminho
  path: {
    join: (...args) => ipcRenderer.invoke('path-join', ...args),
    dirname: (p) => ipcRenderer.invoke('path-dirname', p),
    basename: (p) => ipcRenderer.invoke('path-basename', p),
    relative: (from, to) => ipcRenderer.invoke('path-relative', from, to),
  },

  // APIs de overlay e imagem
  overlay: {
    // Carregar imagem
    loadImage: (imagePath) => ipcRenderer.invoke('load-image', imagePath),

    // Processar overlay
    processOverlay: (overlayData, videoDimensions) => ipcRenderer.invoke('process-overlay', overlayData, videoDimensions),

    // Salvar overlay
    saveOverlay: (overlayData, outputPath) => ipcRenderer.invoke('save-overlay', overlayData, outputPath),
  },

  // APIs de arquivo para overlays
  readFileAsDataURL: (filePath) => {
    devLog('📁 Preload: Chamando readFileAsDataURL para:', filePath);
    return ipcRenderer.invoke('read-file-as-data-url', filePath);
  },

  // APIs de drag & drop
  processDroppedFiles: (filePaths) => {
    devLog('📁 Preload: Chamando process-dropped-files para:', filePaths);
    return ipcRenderer.invoke('process-dropped-files', filePaths);
  },

  // Event listeners adicionais
  onVideoProcessed: (callback) => ipcRenderer.on('video-processed', callback),
  onProjectSaved: (callback) => ipcRenderer.on('project-saved', callback),
  onProjectLoaded: (callback) => ipcRenderer.on('project-loaded', callback),
  onError: (callback) => ipcRenderer.on('error', callback),

  // Event listeners de menu nativo
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
  onMenuSaveProject: (callback) => ipcRenderer.on('menu-save-project', callback),
  onMenuSaveProjectAs: (callback) => ipcRenderer.on('menu-save-project-as', callback),
  onMenuExportProject: (callback) => ipcRenderer.on('menu-export-project', callback),
  onMenuAddQuestion: (callback) => ipcRenderer.on('menu-add-question', callback),
  onMenuDuplicateQuestion: (callback) => ipcRenderer.on('menu-duplicate-question', callback),
  onMenuDeleteQuestion: (callback) => ipcRenderer.on('menu-delete-question', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),

  // Shell APIs
  shell: {
    openExternal: (url) => {
      devLog('🔗 Preload: Chamando shell.openExternal para:', url);
      return ipcRenderer.invoke('shell-open-external', url);
    }
  },

  // ✅ File Association APIs
  fileAssociation: {
    // Abrir arquivos específicos
    openFile: (filePath) => ipcRenderer.invoke('open-files', [filePath]),

    // Abrir múltiplos arquivos
    openFiles: (filePaths) => ipcRenderer.invoke('open-files', filePaths),

    // Verificar se pode abrir arquivo
    canOpenFile: (filePath) => ipcRenderer.invoke('can-open-file', filePath),

    // Event listeners para abertura de arquivos
    onOpenFileRequest: (callback) => ipcRenderer.on('open-file-request', callback),

    // Remover listener
    removeOpenFileListener: () => ipcRenderer.removeAllListeners('open-file-request')
  }
});

devLog('✅ Preload: electronAPI exposta com sucesso!');

// ✅ SOLUÇÃO DEFINITIVA: Configuração específica para garantir funcionamento no Electron
if (window.electronAPI) {
  // Aplicar configuração específica do Electron
  window.electronAPI.electronConfig = {
    version: process.versions.electron,
    isDev: process.env.ELECTRON_IS_DEV === 'true',
    preloadLoaded: true,
    timestamp: Date.now(),
    hasSyncAPIs: !!(window.electronAPI?.system?.getSystemInfoSync && window.electronAPI?.system?.fileExistsSync),
    hasAsyncAPIs: !!(window.electronAPI?.system?.getSystemInfo && window.electronAPI?.system?.fileExists && window.electronAPI?.video?.getVideoUrl)
  };

    devLog('🔧 Preload: Configuração específica aplicada:', window.electronAPI.electronConfig);
  }