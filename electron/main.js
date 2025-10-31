// Forçando a recarga do arquivo para limpar o cache de build.
// main.js
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, Menu, nativeImage } = require('electron');
const AdmZip = require('adm-zip');
const { Worker } = require('worker_threads');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { TEMP_PATHS, logger, createTempDir } = require('./utils');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const ffprobe = ffmpeg.ffprobe;

// Gerenciamento de Configurações
const SETTINGS_FILE_PATH = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_SETTINGS = {
  defaultSavePath: app.getPath('documents'),
  autoUpdateCheck: true,
  videoQuality: 'balanced',
  projectCompressionLevel: -1, // Padrão do Archiver
};

let appSettings = DEFAULT_SETTINGS;

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const settingsData = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsedSettings = JSON.parse(settingsData);
      appSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
    } else {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
  } catch (error) {
    console.error('❌ Main: Erro ao carregar configurações, usando padrões.', error);
    appSettings = DEFAULT_SETTINGS;
  }
  devLog
}

ipcMain.handle('get-settings', () => {
  return appSettings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  try {
    appSettings = { ...appSettings, ...newSettings };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(appSettings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('❌ Main: Erro ao salvar configurações.', error);
    return { success: false, error: error.message };
  }
});

// Verificar se estamos em modo de desenvolvimento
const isDev = process.env.ELECTRON_IS_DEV === 'true';

// Logger de desenvolvimento para evitar poluir o console em produção
const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

let mainWindow;
let forceQuit = false; // Flag para controlar o fechamento forçado

// Importar módulos para desktop-native
const os = require('os');
const cp = require('child_process');

// ✅ REGISTRAR HANDLERS CRÍTICOS IMEDIATAMENTE APÓS OS REQUIRES
// Handlers críticos que precisam estar disponíveis desde o início

// Sistema de APIs - handlers críticos
ipcMain.handle('get-system-info', async () => {
   try {
     const os = require('os');
     const info = {
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
     return info;
   } catch (error) {
     console.error('❌ Main: Erro ao obter informações do sistema:', error);
     throw error;
   }
 });

ipcMain.on('get-system-info-sync', (event) => {
  const os = require('os');
  event.returnValue = {
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

ipcMain.handle('get-path', async (event, name) => {
  return app.getPath(name);
});

ipcMain.handle('system:get-default-documents-path', async () => {
  return app.getPath('documents');
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// Handler especial para vídeo - precisa ser registrado cedo mas depende da janela
ipcMain.handle('get-video-url', async (event, filePath) => {
  try {
    if (!server) {
      // Servidor ainda não inicializado - iniciar agora
      server = http.createServer((req, res) => {
        try {
          // Decodificar URL - manter o caminho completo
          let videoPath = decodeURIComponent(req.url.slice(1));
          // Não remover a barra inicial - é necessária para caminhos absolutos

          // Verificar se o arquivo existe
          const fs = require('fs');
          if (!fs.existsSync(videoPath)) {
            console.error('❌ Arquivo de vídeo não encontrado:', videoPath);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
          }

          const stat = fs.statSync(videoPath);
          const fileSize = stat.size;
          const range = req.headers.range;

          // Determinar MIME type baseado na extensão
          const ext = path.extname(videoPath).toLowerCase();
          const mimeTypes = {
            // Videos
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv',
            '.flv': 'video/x-flv',
            '.mkv': 'video/x-matroska',
            // Images
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';

          // Adicionar cabeçalhos CORS
          const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
            'Content-Type': contentType
          };

          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            if (start >= fileSize) {
              res.writeHead(416, {
                'Content-Range': `bytes */${fileSize}`,
                ...headers
              });
              res.end();
              return;
            }

            const file = fs.createReadStream(videoPath, { start, end });
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              ...headers
            });
            file.pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Length': fileSize,
              ...headers
            });
            fs.createReadStream(videoPath).pipe(res);
          }
        } catch (error) {
          console.error('❌ Erro ao servir vídeo:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error: ' + error.message);
        }
      });

      return new Promise((resolve, reject) => {
        server.listen(0, 'localhost', () => {
          videoServerPort = server.address().port;

          // Codificar o filePath para URL
          const encodedFilePath = encodeURIComponent(filePath);
          const url = `http://localhost:${videoServerPort}/${encodedFilePath}`;
          resolve(url);
        });

        server.on('error', (error) => {
          console.error('❌ Erro ao iniciar servidor de vídeo:', error);
          reject(error);
        });
      });
    } else {
      // Servidor já existe - retornar URL existente
      const encodedFilePath = encodeURIComponent(filePath);
      const url = `http://localhost:${videoServerPort}/${encodedFilePath}`;
      return url;
    }
  } catch (error) {
    console.error('❌ Erro em get-video-url:', error);
    throw error;
  }
});

console.log('✅ Main: Handlers críticos registrados com sucesso');



const archiver = require('archiver');
const crypto = require('crypto');

ipcMain.handle('exportProject', async (event, projectData, outputPath, compressionLevel = -1, password = null) => {
    try {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: compressionLevel } // Set compression level
        });

        const promise = new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve({ success: true });
            });
            archive.on('error', (err) => {
                console.error('❌ Archiver: Error during archiving:', err);
                reject(err);
            });
        });

        archive.pipe(output);

        // Add videos.js (project data), encrypting if password is provided
        let contentToArchive;
        
        if (password) {
            projectData.isEncrypted = true; // Mark as encrypted
            const plainText = JSON.stringify(projectData, null, 2);

            const algorithm = 'aes-256-cbc';
            const salt = crypto.randomBytes(16);
            const key = crypto.scryptSync(password, salt, 32);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(plainText, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // The final content is an object containing everything needed for decryption
            const encryptedPackage = {
                isEncrypted: true, // A clear, unencrypted flag
                salt: salt.toString('hex'),
                iv: iv.toString('hex'),
                encryptedData: encrypted
            };
            contentToArchive = JSON.stringify(encryptedPackage);
        } else {
            projectData.isEncrypted = false;
            contentToArchive = JSON.stringify(projectData, null, 2);
        }

        archive.append(contentToArchive, { name: 'videos.js' });

        // Add videos and overlays
        for (const question of projectData.questions) {
            if (question.video && fs.existsSync(question.video)) { // Ensure file exists
                archive.file(question.video, { name: path.basename(question.video) });
            }
            if (question.overlay && question.overlay.path && fs.existsSync(question.overlay.path)) { // Ensure file exists
                archive.file(question.overlay.path, { name: path.basename(question.overlay.path) });
            }
        }

        await archive.finalize();
        return await promise; // Wait for the archive to finalize and output stream to close

    } catch (error) {
        console.error('❌ Error exporting project:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('exportQuestion', async (event, question, outputPath, compressionLevel = -1) => {
    try {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: compressionLevel } // Set compression level
        });

        const promise = new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve({ success: true });
            });
            archive.on('error', (err) => {
                console.error('❌ Archiver: Error during archiving:', err);
                reject(err);
            });
        });

        archive.pipe(output);

        // Create a project structure for a single question
        const projectData = {
            name: question.label,
            type: "multiple_choice",
            totalAlternatives: Object.keys(question.markers).length,
            questions: [question],
            isDirty: false,
            overlays: [] // Overlays are part of the question object
        };

        // Add videos.js
        const videosJsContent = JSON.stringify(projectData, null, 2);
        archive.append(videosJsContent, { name: 'videos.js' });

        // Add video and overlay
        if (question.video && fs.existsSync(question.video)) {
            archive.file(question.video, { name: path.basename(question.video) });
        }
        if (question.overlay && question.overlay.path && fs.existsSync(question.overlay.path)) {
            archive.file(question.overlay.path, { name: path.basename(question.overlay.path) });
        }

        await archive.finalize();
        return await promise;

    } catch (error) {
        console.error('❌ Error exporting question:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('import-question', async (event, avaFilePath, projectBasePath) => {
    try {
        const tempDir = createTempDir(path.join(TEMP_PATHS.IMPORTS, `import-${Date.now()}`));
        logger.temp('Created import temp dir', tempDir);

        const zip = new AdmZip(avaFilePath);
        zip.extractAllTo(tempDir, true);

        const videosJsPath = path.join(tempDir, 'videos.js');
        const projectData = JSON.parse(await fsPromises.readFile(videosJsPath, 'utf8'));
        let importedQuestion = projectData.questions[0];

        // Determine the actual base path for storing media
        const finalProjectBasePath = projectBasePath ? path.dirname(projectBasePath) : app.getPath('documents');
        // Create a dedicated folder for the question's media within the project's base path
        const questionMediaDir = path.join(finalProjectBasePath, 'media', 'questions', importedQuestion.id || `q_${Date.now()}`);
        await fsPromises.mkdir(questionMediaDir, { recursive: true });

        // Handle video file
        if (importedQuestion.video) {
            const oldVideoPath = importedQuestion.video;
            const videoFileName = path.basename(oldVideoPath);
            const newVideoPath = path.join(questionMediaDir, videoFileName);
            await fsPromises.copyFile(path.join(tempDir, videoFileName), newVideoPath);
            importedQuestion.video = newVideoPath; // Update path
        }

        // Handle overlay image files
        if (importedQuestion.overlays && importedQuestion.overlays.length > 0) {
            for (const overlay of importedQuestion.overlays) {
                const oldOverlayPath = overlay.path;
                const overlayFileName = path.basename(oldOverlayPath);
                const newOverlayPath = path.join(questionMediaDir, overlayFileName);
                await fsPromises.copyFile(path.join(tempDir, overlayFileName), newOverlayPath);
                overlay.path = newOverlayPath; // Update path
            }
        }

        // Clean up temp directory
        await fsPromises.rm(tempDir, { recursive: true, force: true });

        return { success: true, question: importedQuestion };
    } catch (error) {
        console.error('❌ Error importing question:', error);
        return { success: false, error: error.message };
    }
});

const http = require('http');
let server;
let videoServerPort;

// ✅ Handler get-video-url movido para o topo - removido daqui para evitar duplicação

// Criar menu nativo da aplicação
function createNativeMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Projeto',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Abrir Projeto...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Salvar',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-project');
          }
        },
        {
          label: 'Salvar Como...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-save-project-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Exportar Prova...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            showCloseConfirmDialog();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        {
          label: 'Desfazer',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Refazer',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Copiar',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Colar',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Selecionar Tudo',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll'
        }
      ]
    },
    {
      label: 'Questão',
      submenu: [
        {
          label: 'Adicionar Nova Questão',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow.webContents.send('menu-add-question');
          }
        },
        {
          label: 'Duplicar Questão Atual',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('menu-duplicate-question');
          }
        },
        {
          label: 'Remover Questão',
          accelerator: 'Delete',
          click: () => {
            mainWindow.webContents.send('menu-delete-question');
          }
        }
      ]
    },
    {
      label: 'Ferramentas',
      submenu: [
        {
          label: 'Configurações',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        {
          label: 'Janela de Preview de Vídeo',
          click: () => {
            // Envia uma mensagem para o renderer process solicitar uma janela de preview
            // O renderer deve então chamar o handler 'window:create-preview' com a URL do vídeo
            mainWindow.webContents.send('menu-create-preview');
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o AvaLIBRAS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'AvaLIBRAS',
              message: 'Criador AvaLIBRAS',
              detail: 'Versão 2.0.0\n\nSistema de criação de avaliações educacionais com vídeo para LIBRAS.\n\n© 2024 - Todos os direitos reservados',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Manter web security habilitada para melhor compatibilidade
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: false,
  });

  // Define o ícone da janela de forma mais robusta
  const iconPath = path.join(__dirname, `../public/source/img/icone.${process.platform === 'win32' ? 'ico' : 'png'}`);
  const image = nativeImage.createFromPath(iconPath);
  mainWindow.setIcon(image);

  // Criar menu nativo
  createNativeMenu();

  // Carregar a aplicação diretamente dos arquivos estáticos (sem Vite)
  if (isDev) {
    // Em desenvolvimento, carregar do build local (sem servidor externo)
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
    // Abrir DevTools em desenvolvimento
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carregar do arquivo estático
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Mostrar a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Eventos da janela
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximize');
  });

  // Implementar Drag & Drop de arquivos
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

ipcMain.handle('process-dropped-files', async (event, filePaths) => {
    const processedFiles = [];

    for (const filePath of filePaths) {
      try {
        // Verificar se é um arquivo de vídeo suportado
        const supportedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
        const ext = path.extname(filePath).toLowerCase();

        if (supportedExtensions.includes(ext)) {
          const stat = await fs.stat(filePath);
          processedFiles.push({
            path: filePath,
            name: path.basename(filePath),
            size: stat.size,
            type: 'video'
          });
        } else {
        }
      } catch (error) {
        console.error('❌ Main: Erro ao processar arquivo:', filePath, error);
      }
    }

    return processedFiles;
  });

  // Interceptar tentativa de fechamento para usar modal customizado
  mainWindow.on('close', (event) => {
    if (forceQuit) {
      return; // Permite o fechamento se a flag forceQuit for verdadeira
    }
    event.preventDefault();
    mainWindow.webContents.send('app-closing');
  });
}

// Função para mostrar diálogo de confirmação foi removida para usar um modal customizado no frontend

// IPC Handlers para controles da janela
ipcMain.on('minimize-app', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-app', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-app', () => {
  // Notifica o renderer para mostrar o modal de confirmação customizado
  if (mainWindow) {
    mainWindow.webContents.send('app-closing');
  }
});

// Handler para forçar o fechamento da aplicação (usado pelo modal de confirmação)
ipcMain.on('force-quit-app', () => {
  forceQuit = true;
  app.quit();
});

ipcMain.on('toggle-dev-tools', () => {
   if (mainWindow) {
     if (mainWindow.webContents.isDevToolsOpened()) {
       mainWindow.webContents.closeDevTools();
     } else {
       mainWindow.webContents.openDevTools();
     }
   }
 });

// IPC Handlers para diálogos
ipcMain.handle('show-open-dialog', async (event, options) => {
  if (!mainWindow) return { canceled: true };
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  if (!mainWindow) return { canceled: true };
  return await dialog.showSaveDialog(mainWindow, options);
});

// Sistema de gerenciamento de projetos
const recentProjectsFile = path.join(app.getPath('userData'), 'recent_projects.json');

ipcMain.handle('save-project', async (event, projectData, filePath) => {
  try {
    await fsPromises.writeFile(filePath, JSON.stringify(projectData, null, 2));

    // Adicionar aos projetos recentes (nível de SO)
    app.addRecentDocument(filePath);

    // Adicionar aos projetos recentes
    await addToRecentProjects(projectData);

    mainWindow.webContents.send('project-saved', { success: true, filePath });
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving project:', error);
    mainWindow.webContents.send('error', { message: 'Erro ao salvar projeto', error: error.message });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-project', async (event, filePath) => {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    const projectData = JSON.parse(data);

    // Adicionar aos projetos recentes (nível de SO)
    app.addRecentDocument(filePath);

    // Adicionar aos projetos recentes
    await addToRecentProjects(projectData);

    mainWindow.webContents.send('project-loaded', { success: true, projectData });
    return { success: true, projectData };
  } catch (error) {
    console.error('Error loading project:', error);
    mainWindow.webContents.send('error', { message: 'Erro ao carregar projeto', error: error.message });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-recent-projects', async () => {
  try {
    try {
      const data = await fsPromises.readFile(recentProjectsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error getting recent projects:', error);
    return [];
  }
});

async function addToRecentProjects(projectData) {
  try {
    let recentProjects = [];

    try {
      const data = await fsPromises.readFile(recentProjectsFile, 'utf8');
      recentProjects = JSON.parse(data);
    } catch {
      // File doesn't exist, start with empty array
    }

    // Remove duplicate and add to beginning
    recentProjects = recentProjects.filter(p => p.name !== projectData.name);
    recentProjects.unshift({
      name: projectData.name,
      path: projectData.path || '',
      lastModified: new Date().toISOString(),
      type: projectData.type || 'multiple_choice'
    });

    // Keep only last 5 projects
    recentProjects = recentProjects.slice(0, 5);

    await fsPromises.writeFile(recentProjectsFile, JSON.stringify(recentProjects, null, 2));
  } catch (error) {
    console.error('Error adding to recent projects:', error);
  }
}

ipcMain.handle('add-to-recent-projects', async (event, projectData) => {
  await addToRecentProjects(projectData);
  return { success: true };
});

// Sistema de APIs - melhorado para capturar tempo real do sistema
ipcMain.handle('get-system-double-click-time', async () => {
  try {
    // Valores padrão otimizados para cada SO
    const systemSettings = {
      'win32': { default: 500, min: 300, max: 1000 }, // Windows: velocidade em ms
      'darwin': { default: 500, min: 300, max: 1000 },  // macOS: threshold em ms
      'linux': { default: 400, min: 200, max: 800 },   // Linux: mais rápido
      'default': { default: 450, min: 300, max: 1000 }  // Fallback geral
    };

    const platform = process.platform;
    const settings = systemSettings[platform] || systemSettings['default'];

    // Tentar obter configuração real do sistema (com fallback para valores padrão)
    const { execSync } = require('child_process');

    try {
      if (platform === 'win32') {
        // Windows - ler registro do sistema
        const result = execSync('reg query "HKEY_CURRENT_USER\\Control Panel\\Mouse" /v DoubleClickSpeed 2>nul', { encoding: 'utf8' });
        const match = result.match(/DoubleClickSpeed\s+REG_SZ\s+(\d+)/);
        if (match) {
          const systemTime = parseInt(match[1]) * 10; // Convert registry value to ms
          return Math.max(settings.min, Math.min(settings.max, systemTime));
        }
      } else if (platform === 'darwin') {
        // macOS - usar defaults do sistema
        const result = execSync('defaults read -g com.apple.mouse.doubleClickThreshold 2>/dev/null || echo "450"', {
          encoding: 'utf8',
          shell: true
        });
        const systemTime = parseFloat(result.trim()) * 1000;
        return Math.max(settings.min, Math.min(settings.max, systemTime));
      } else if (platform === 'linux') {
        // Linux - tentar obter de configurações GTK/X11
        try {
          // Tentar GSettings (GNOME/GTK)
          const gsettingsResult = execSync('gsettings get org.gnome.desktop.interface double-click 2>/dev/null || echo "400"', {
            encoding: 'utf8'
          });
          const systemTime = parseInt(gsettingsResult.trim()) || settings.default;
          return Math.max(settings.min, Math.min(settings.max, systemTime));
        } catch (gsettingsError) {
          // Fallback para valor padrão Linux otimizado
          return settings.default;
        }
      }
    } catch (systemError) {
      console.warn('⚠️ Main: Erro ao detectar tempo do sistema, usando padrão:', systemError.message);
      return settings.default;
    }

    // Se não conseguir detectar, usar valor padrão otimizado para o SO
    return settings.default;

  } catch (error) {
    console.error('❌ Main: Erro crítico ao obter tempo de duplo clique:', error);
    return 450; // Fallback seguro
  }
});

// Handler para calcular e retornar o uso de CPU
ipcMain.handle('get-cpu-usage', () => {
    return new Promise((resolve) => {
        const startCpus = os.cpus();

        setTimeout(() => {
            const endCpus = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;

            for (let i = 0; i < endCpus.length; i++) {
                const start = startCpus[i].times;
                const end = endCpus[i].times;

                const idle = end.idle - start.idle;
                const total = (end.user - start.user) + (end.nice - start.nice) + (end.sys - start.sys) + (end.irq - start.irq) + idle;
                
                totalIdle += idle;
                totalTick += total;
            }

            // Evita divisão por zero se o totalTick for 0
            const usage = totalTick > 0 ? 100 - ((totalIdle / endCpus.length) / (totalTick / endCpus.length) * 100) : 0;
            resolve(`${usage.toFixed(2)}%`);
        }, 1000); // Amostra de 1 segundo para o cálculo
    });
});
// ✅ Handlers críticos movidos para o topo - removidos daqui para evitar duplicação

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Error ensuring directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('system:clear-temp-files', async () => {
  logger.temp('Attempting to clear all temporary files', TEMP_PATHS.BASE);
  try {
    // Verifica se o diretório existe
    const exists = await fsPromises.access(TEMP_PATHS.BASE).then(() => true).catch(() => false);

    if (exists) {
      // Remove o diretório e todo o seu conteúdo
      await fsPromises.rm(TEMP_PATHS.BASE, { recursive: true, force: true });
      logger.temp('Temporary base directory removed', TEMP_PATHS.BASE);
    } else {
      logger.temp('Temporary base directory does not exist, no cleanup needed', TEMP_PATHS.BASE);
    }
    // Recria o diretório base vazio para futuras operações
    await fsPromises.mkdir(TEMP_PATHS.BASE, { recursive: true });
    logger.temp('Temporary base directory recreated', TEMP_PATHS.BASE);

    return { success: true };
  } catch (error) {
    logger.error('Failed to clear temporary files', error, { path: TEMP_PATHS.BASE });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-file', async (event, srcPath, destPath) => {
  try {
    await fsPromises.copyFile(srcPath, destPath);
    return { success: true };
  } catch (error) {
    console.error('Error copying file:', error);
    return { success: false, error: error.message };
  }
});

// Path utilities
ipcMain.handle('path-join', async (event, ...args) => {
  return path.join(...args);
});

ipcMain.handle('path-dirname', async (event, p) => {
  return path.dirname(p);
});

ipcMain.handle('path-basename', async (event, p) => {
  return path.basename(p);
});

ipcMain.handle('path-relative', async (event, from, to) => {
  return path.relative(from, to);
});

ipcMain.on('show-item-in-folder', (event, fullPath) => {
  shell.showItemInFolder(fullPath);
});

// Handler para criar uma janela de preview de vídeo
ipcMain.handle('window:create-preview', async (event, videoUrl) => {
  if (!videoUrl) return;

  let previewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Preview de Vídeo',
    autoHideMenuBar: true,
    frame: true, // Usar frame padrão para a janela de preview
    parent: mainWindow, // Associar ao pai para comportamento modal opcional
    modal: false // Não bloquear a janela principal
  });

  previewWindow.loadURL(videoUrl);

  previewWindow.on('closed', () => {
    previewWindow = null;
  });
});

// APIs de vídeo - Otimizadas com Worker Threads

// Fila de tarefas para garantir que apenas um processo FFmpeg seja executado por vez
const taskQueue = [];
let isWorkerBusy = false;

/**
 * Processa o próximo item da fila de tarefas FFmpeg, se o worker não estiver ocupado.
 */
function processNextInQueue() {
    if (isWorkerBusy || taskQueue.length === 0) {
        return; // Worker ocupado ou fila vazia
    }

    isWorkerBusy = true;
    const { task, options, resolve, reject } = taskQueue.shift();

    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: {
        isPackaged: app.isPackaged
      }
    });
    let workerTerminated = false; // Flag para controlar o encerramento do worker

    worker.on('message', (message) => {
        try {
            if (message.success) {
                resolve(message.result);
            } else {
                reject(new Error(message.error + (message.stack ? '\n' + message.stack : '')));
            }
        } finally {
            if (!workerTerminated) {
                worker.terminate();
                workerTerminated = true;
            }
            isWorkerBusy = false;
            processNextInQueue(); // Processa o próximo item
        }
    });

    worker.on('error', (err) => {
        reject(err);
        console.error(`❌ Erro irrecuperável no worker para a tarefa '${task}'.`, err);
        if (!workerTerminated) {
            worker.terminate();
            workerTerminated = true;
        }
        isWorkerBusy = false;
        processNextInQueue(); // Tenta processar o próximo item mesmo em caso de erro
    });

    worker.on('exit', (code) => {
        if (code !== 0 && !workerTerminated) { // Verifica se o worker não foi terminado explicitamente
            const errorMessage = `Worker para a tarefa '${task}' parou com código de saída: ${code}`;
            console.error(errorMessage);
            reject(new Error(errorMessage));
        }
        if (!workerTerminated) {
            worker.terminate(); // Garante que o worker seja terminado se não foi antes
            workerTerminated = true;
        }
        isWorkerBusy = false; // Garante que o worker seja marcado como não ocupado
        processNextInQueue(); // Processa o próximo item
    });

    worker.postMessage({ task, ...options });
}

/**
 * Adiciona uma tarefa FFmpeg à fila de processamento.
 * @param {string} task - O nome da tarefa.
 * @param {object} options - As opções para a tarefa.
 * @returns {Promise<any>} Uma promessa que resolve com o resultado da tarefa.
 */
function runFfmpegTask(task, options) {
  return new Promise((resolve, reject) => {
    taskQueue.push({ task, options, resolve, reject });
    processNextInQueue();
  }).finally(() => {
    // Garante que o worker seja terminado após a resolução/rejeição da promessa
    // O worker é terminado dentro do on('message') ou on('error') agora.
    // Esta parte é mais para garantir que a fila continue.
    // O terminate() real será feito no on('exit') ou no on('message')/on('error')
    // após a resolução da promessa.
  });
}

// Handler para obter informações do vídeo (agora usando o worker)
ipcMain.handle('get-video-info', async (event, videoPath) => {
  try {
    const videoInfo = await runFfmpegTask('info', { videoPath });
    return videoInfo;
  } catch (error) {
    console.error('❌ Main: Erro ao obter informações do vídeo via worker:', error);
    throw error; // Lança o erro para o renderer process
  }
});

// Handler para cortar vídeo (agora usando o worker)
ipcMain.handle('video:cut', async (event, options) => {
  try {
    const processedPath = await runFfmpegTask('cut', options);
    return { success: true, processedPath };
  } catch (error) {
    console.error('❌ Main: Erro ao cortar vídeo via worker:', error);
    throw error;
  }
});

// Handler para processamento genérico de vídeo (agora usando o worker)
ipcMain.handle('process-video', async (event, options) => {
    try {
        const processedPath = await runFfmpegTask('process-video', options);
        return { success: true, processedPath };
    } catch (error) {
        console.error('❌ Main: Erro ao processar vídeo via worker:', error);
        throw error;
    }
});

// Handler para aplicar overlay (agora usando o worker)
ipcMain.handle('video:process-overlay', async (event, options) => {
    try {
        // Adiciona a configuração de qualidade de vídeo às opções do worker
        const optionsWithQuality = {
            ...options,
            videoQuality: appSettings.videoQuality || 'balanced'
        };
        const processedPath = await runFfmpegTask('process-overlay', optionsWithQuality);
        return { success: true, processedPath };
    } catch (error) {
        console.error('❌ Main: Erro ao aplicar overlay via worker:', error);
        throw error;
    }
});


// Handler para ler arquivo como Data URL (para overlays de imagem)
ipcMain.handle('shell-open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('❌ Main: Erro ao abrir URL externa:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file-as-data-url', async (event, filePath) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Verificar extensão do arquivo
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Tipo de arquivo não suportado: ${ext}`);
    }

    // Ler arquivo como buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Converter para base64
    const base64 = fileBuffer.toString('base64');

    // Determinar MIME type
    const mimeType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    }[ext] || 'image/jpeg';

    // Retornar Data URL
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return dataUrl;

  } catch (error) {
    console.error('❌ Main: Erro ao ler arquivo como Data URL:', error);
    throw new Error(`Falha ao ler arquivo: ${error.message}`);
  }
});

// Inicialização da aplicação
app.whenReady().then(() => {
    loadSettings(); // Carrega as configurações do usuário
    createTempDir(TEMP_PATHS.BASE); // Garante que o diretório base temporário exista
    createWindow();
    if (appSettings.autoUpdateCheck) {
      autoUpdater.checkForUpdatesAndNotify();
    }



    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', async () => {
  // Limpeza automática de arquivos temporários ao sair
  logger.temp('App: All windows closed. Initiating automatic temporary file cleanup.');
  await ipcMain.handle('system:clear-temp-files'); // Chama o handler de limpeza

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ✅ SUPORTE A ABERTURA DE ARQUIVOS E MENU DE CONTEXTO

// Handler para abrir arquivos via linha de comando ou menu de contexto
async function openFile(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath);

        console.log(`📂 Abrindo arquivo: ${fileName} (${ext})`);

        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        let action = null;

        // Determinar ação baseada na extensão
        switch (ext) {
            case '.avaprojet':
                action = 'open-project';
                break;
            case '.ava':
                action = 'open-exam';
                break;
            case '.avaquest':
                action = 'import-question';
                break;
            default:
                console.warn(`⚠️ Extensão não suportada: ${ext}`);
                return { success: false, error: 'Extensão não suportada' };
        }

        // Enviar arquivo para o processo renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('open-file-request', {
                action: action,
                filePath: filePath,
                fileName: fileName
            });

            mainWindow.show();
            mainWindow.focus();

            return { success: true, action, fileName };
        } else {
            throw new Error('Janela principal não está disponível');
        }

    } catch (error) {
        console.error('❌ Erro ao abrir arquivo:', error);

        // Mostrar diálogo de erro
        if (mainWindow && !mainWindow.isDestroyed()) {
            dialog.showErrorBox('Erro ao Abrir Arquivo',
                `Não foi possível abrir o arquivo:\n${filePath}\n\nErro: ${error.message}`);
        }

        return { success: false, error: error.message };
    }
}

// Evento para abrir arquivos via associação (Windows/Linux)
app.on('open-file', async (event, filePath) => {
    event.preventDefault();
    console.log(`📂 Recebido evento open-file: ${filePath}`);

    // Se a janela ainda não estiver pronta, guardar o arquivo para abrir depois
    if (!mainWindow || mainWindow.isDestroyed()) {
        global.pendingFile = filePath;
        return;
    }

    await openFile(filePath);
});

// Processar arquivos passados como argumento (Linux)
app.on('ready', async () => {
    const args = process.argv.slice(1);
    const filePaths = args.filter(arg => {
        return arg.endsWith('.avaprojet') ||
               arg.endsWith('.ava') ||
               arg.endsWith('.avaquest');
    });

    if (filePaths.length > 0) {
        console.log(`📂 Arquivos recebidos como argumento:`, filePaths);

        // Aguardar um pouco para garantir que a janela esteja pronta
        setTimeout(async () => {
            for (const filePath of filePaths) {
                await openFile(filePath);
            }
        }, 1000);
    }
});

// Handler para processar múltiplos arquivos (drag & drop)
ipcMain.handle('open-files', async (event, filePaths) => {
    const results = [];

    for (const filePath of filePaths) {
        const result = await openFile(filePath);
        results.push(result);
    }

    return results;
});

// Handler para verificar se pode abrir arquivo
ipcMain.handle('can-open-file', async (event, filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const supportedExtensions = ['.avaprojet', '.ava', '.avaquest'];

        return {
            canOpen: supportedExtensions.includes(ext),
            extension: ext,
            fileName: path.basename(filePath)
        };
    } catch (error) {
        return { canOpen: false, error: error.message };
    }
});

// NOTA: Limpeza automática de arquivos temporários ao sair foi removida
// porque localStorage não está disponível no processo principal do Electron.
// O usuário pode limpar arquivos manualmente através das Configurações.

// Impedir abertura múltipla da aplicação
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Alguém tentou executar uma segunda instância, devemos focar na janela existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}