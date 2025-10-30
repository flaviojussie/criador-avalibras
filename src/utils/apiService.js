// apiService.js - Serviço centralizado para abstrair APIs do Electron e Web
import environmentDetector, { isElectron, isWeb, waitForElectronAPIs } from '../utils/environmentDetector.js';
import { devLog } from './devLog.js';

class ApiService {
    constructor() {
        this.capabilities = null;
        this.isReady = false;
        this.initPromise = this.init();
    }

    async init() {
        devLog('🔧 API Service: Inicializando...');

        this.capabilities = await environmentDetector.getCapabilities();
        this.isReady = true;

        devLog('🔧 API Service: Capacidades:', this.capabilities);

        // SOLUÇÃO ROBUSTA: Configuração específica para Electron
        if (this.capabilities.isElectron || (window.electronAPI && window.electronAPI.isElectron && window.electronAPI.isElectron())) {
            devLog('🔧 API Service: Ambiente Electron detectado - aplicando configuração específica');

            // ✅ SOLUÇÃO DEFINITIVA: Configuração otimizada para APIs
             devLog('🔧 API Service: Aplicando configuração otimizada para APIs...');

             // Configuração imediata baseada na disponibilidade atual
             this.capabilities.hasVideoAPI = !!(window.electronAPI?.video?.getVideoUrl);
             this.capabilities.hasSystemAPI = !!(window.electronAPI?.system?.getSystemInfo || window.electronAPI?.system?.getSystemInfoSync);
             this.capabilities.hasFileAPI = !!(window.electronAPI?.system?.fileExists || window.electronAPI?.system?.fileExistsSync);

             devLog('✅ API Service: Configuração aplicada:', this.capabilities);

             // ✅ VALIDAÇÃO ASSÍNCRONA: Verificação em segundo plano (não bloqueante)
             this.validateAPIsAsync();

                // Configuração otimista - assumir que APIs estarão disponíveis
                if (window.electronAPI) {
                    this.capabilities.hasVideoAPI = !!(window.electronAPI?.video?.getVideoUrl);
                    this.capabilities.hasSystemAPI = !!(window.electronAPI?.system?.getSystemInfo || window.electronAPI?.system?.getSystemInfoSync);
                    this.capabilities.hasFileAPI = !!(window.electronAPI?.system?.fileExists || window.electronAPI?.system?.fileExistsSync);

                    devLog('✅ API Service: Configuração otimizada aplicada:', this.capabilities);
                }
        }

        return this.capabilities;
    }

    // ✅ VALIDAÇÃO ASSÍNCRONA NÃO BLOQUEANTE
    validateAPIsAsync() {
        setTimeout(async () => {
            try {
                devLog('🔍 API Service: Iniciando validação assíncrona das APIs...');

                // Aguardar um tempo maior para garantir que tudo esteja carregado
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Re-verificar capacidades após delay
                const currentHasVideoAPI = !!(window.electronAPI?.video?.getVideoUrl);
                const currentHasSystemAPI = !!(window.electronAPI?.system?.getSystemInfo || window.electronAPI?.system?.getSystemInfoSync);
                const currentHasFileAPI = !!(window.electronAPI?.system?.fileExists || window.electronAPI?.system?.fileExistsSync);

                // Atualizar capacidades se houver mudanças
                if (currentHasVideoAPI !== this.capabilities.hasVideoAPI) {
                    devLog('🔄 API Service: hasVideoAPI atualizado:', currentHasVideoAPI);
                    this.capabilities.hasVideoAPI = currentHasVideoAPI;
                }

                if (currentHasSystemAPI !== this.capabilities.hasSystemAPI) {
                    devLog('🔄 API Service: hasSystemAPI atualizado:', currentHasSystemAPI);
                    this.capabilities.hasSystemAPI = currentHasSystemAPI;
                }

                if (currentHasFileAPI !== this.capabilities.hasFileAPI) {
                    devLog('🔄 API Service: hasFileAPI atualizado:', currentHasFileAPI);
                    this.capabilities.hasFileAPI = currentHasFileAPI;
                }

                devLog('✅ API Service: Validação assíncrona concluída:', this.capabilities);

            } catch (error) {
                devLog('⚠️ API Service: Erro na validação assíncrona:', error.message);
            }
        }, 500);
    }

    async waitUntilReady() {
        if (!this.isReady) {
            await this.initPromise;
        }
        return this.isReady;
    }

    // ✅ SOLUÇÃO DEFINITIVA: API de vídeo refatorada com abordagem resiliente
    async getVideoUrl(filePath) {
        await this.waitUntilReady();

        devLog('🎥 API Service: Obtendo URL para vídeo (sistema refatorado):', filePath);

        // ✅ ABORDAGEM 1: Verificação rápida de contexto (sempre funciona)
        const contextCheck = this.checkVideoContext(filePath);
        if (!contextCheck.valid) {
            devLog('⚠️ API Service: Contexto de vídeo inválido:', contextCheck.reason);
            throw new Error(`Contexto inválido: ${contextCheck.reason}`);
        }

        // ✅ ABORDAGEM 2: Tentar API do Electron com segurança máxima
        if (this.isVideoAPIReady()) {
            try {
                const electronUrl = await this.getElectronVideoUrl(filePath);
                if (electronUrl) {
                    devLog('✅ API Service: URL obtida via Electron:', electronUrl);
                    return electronUrl;
                }
            } catch (error) {
                devLog('⚠️ API Service: API do Electron falhou:', error.message);
            }
        }

        // ✅ ABORDAGEM 3: Último recurso - erro informativo
        console.error('❌ API Service: Não foi possível obter URL do vídeo');
        throw new Error('Vídeo não disponível - verifique se o arquivo existe e as APIs estão funcionando');
    }

    // ✅ SOLUÇÃO DEFINITIVA: Implementação híbrida para verificação de arquivos
    async fileExists(filePath) {
        await this.waitUntilReady();

        devLog('📄 API Service: Verificando se arquivo existe:', filePath);

        // Estratégia 1: Tentar versão síncrona primeiro (mais rápida e confiável)
        if (window.electronAPI?.system?.fileExistsSync) {
            try {
                devLog('📄 API Service: Usando versão síncrona...');
                const exists = window.electronAPI.system.fileExistsSync(filePath);
                devLog('📄 API Service: Arquivo existe (síncrono):', exists);
                return exists;
            } catch (error) {
                devLog('⚠️ API Service: Versão síncrona falhou:', error.message);
            }
        }

        // Estratégia 2: Tentar versão assíncrona
        if (window.electronAPI?.system?.fileExists) {
            try {
                devLog('📄 API Service: Usando versão assíncrona...');
                const exists = await window.electronAPI.system.fileExists(filePath);
                devLog('📄 API Service: Arquivo existe (assíncrono):', exists);
                return exists;
            } catch (error) {
                devLog('⚠️ API Service: Erro ao verificar arquivo:', error.message);
            }
        }

    }

    // ✅ SOLUÇÃO DEFINITIVA: Implementação híbrida para informações do sistema
    async getSystemInfo() {
        await this.waitUntilReady();

        devLog('🖥️ API Service: Obtendo informações do sistema');
        devLog('🖥️ API Service: Estado atual das APIs:', {
            hasElectronAPI: !!window.electronAPI,
            hasSystemAPI: !!window.electronAPI?.system?.getSystemInfo,
            hasSystemAPISync: !!window.electronAPI?.system?.getSystemInfoSync,
            isElectron: this.capabilities?.isElectron
        });

        // Estratégia 1: Tentar versão síncrona primeiro (mais rápida)
        if (window.electronAPI?.system?.getSystemInfoSync) {
            try {
                devLog('🖥️ API Service: Usando versão síncrona...');
                const info = window.electronAPI.system.getSystemInfoSync();
                devLog('✅ API Service: Informações obtidas (síncrona)');
                return info;
            } catch (error) {
                devLog('⚠️ API Service: Versão síncrona falhou:', error.message);
            }
        }

        // Estratégia 2: Tentar versão assíncrona
        if (window.electronAPI?.system?.getSystemInfo) {
            try {
                devLog('🖥️ API Service: Usando versão assíncrona...');
                // Aguardar um pouco para garantir que o contexto esteja totalmente carregado
                await new Promise(resolve => setTimeout(resolve, 100));

                const info = await window.electronAPI.system.getSystemInfo();
                devLog('✅ API Service: Informações obtidas (assíncrona)');
                return info;
            } catch (error) {
                devLog('⚠️ API Service: Erro ao obter informações do sistema:', error.message);
            }
        }

        // Estratégia 3: Retornar informações básicas do navegador como último recurso
        try {
            devLog('🖥️ API Service: Usando informações básicas do navegador...');
            const info = {
                platform: 'web',
                arch: 'unknown',
                totalMemory: 'unknown',
                freeMemory: 'unknown',
                cpus: navigator.hardwareConcurrency || 'unknown',
                userAgent: navigator.userAgent
            };
            devLog('✅ API Service: Informações básicas obtidas');
            return info;
        } catch (error) {
            console.error('❌ API Service: Todas as estratégias falharam:', error);
            return null;
        }
    }

    // Serviço de Vídeo Universal (funciona em ambos ambientes)
    async getVideoSource(filePath) {
        await this.waitUntilReady();

        devLog('🎬 API Service: Obtendo fonte de vídeo para:', filePath);

        // ✅ DIAGNÓSTICO DETALHADO: Análise completa do estado atual
        const currentState = {
            // Estado das capacidades
            capabilities: this.capabilities,

            // Estado em tempo real das APIs
            realTime: {
                hasElectronAPI: !!window.electronAPI,
                hasVideoAPI: !!(window.electronAPI?.video?.getVideoUrl),
                hasSystemAPI: !!(window.electronAPI?.system?.getSystemInfo || window.electronAPI?.system?.getSystemInfoSync),
                hasFileAPI: !!(window.electronAPI?.system?.fileExists || window.electronAPI?.system?.fileExistsSync),
                isElectronFunction: !!(window.electronAPI && window.electronAPI.isElectron && window.electronAPI.isElectron())
            },

            // Contexto de execução
            context: {
                apiServiceReady: this.isReady,
                filePath: filePath,
                filePathType: typeof filePath,
                filePathValid: filePath && typeof filePath === 'string' && filePath.length > 0
            },

            // Ambiente de execução
            environment: {
                isElectron: this.capabilities?.isElectron,
                userAgent: navigator.userAgent,
                platform: typeof process !== 'undefined' && process.platform ? process.platform : 'browser',
                nodeEnv: typeof process !== 'undefined' && process.env && process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
            }
        };

        devLog('🎬 API Service: Diagnóstico completo:', currentState);

        // ✅ SOLUÇÃO DEFINITIVA: Sistema inteligente de decisão para vídeo
         devLog('🎬 API Service: Iniciando análise inteligente de vídeo...');

         // Verificação em tempo real da disponibilidade da API
         const hasVideoAPI = !!(window.electronAPI?.video?.getVideoUrl);
         const hasSystemAPI = !!(window.electronAPI?.system?.getSystemInfo || window.electronAPI?.system?.getSystemInfoSync);

         devLog('🎬 API Service: Estado atual das APIs:', {
             hasVideoAPI,
             hasSystemAPI,
             isElectron: this.capabilities?.isElectron,
             apiServiceReady: this.isReady
         });

         // ✅ FORÇA BRUTA: Tentar API de vídeo independentemente do estado inicial
          devLog('🔥 API Service: Tentativa FORÇA BRUTA - ignorando estado inicial');
 
          try {
              // Tentar diretamente sem verificar capacidades
              const url = await this.getVideoUrl(filePath);
              if (url && url.startsWith('http://localhost:')) {
                  devLog('✅ API Service: SUCESSO! Vídeo carregado via força bruta');
                  return { type: 'electron-http', url, source: 'Electron HTTP Server' };
              }
          } catch (error) {
              devLog('⚠️ API Service: Força bruta falhou:', error.message);
          }
 
         // ✅ VERIFICAÇÃO ADICIONAL COM DELAY: Última tentativa
          devLog('🔄 API Service: Última tentativa com delay adicional...');
          await new Promise(resolve => setTimeout(resolve, 1000));
 
          try {
              const url = await window.electronAPI.video.getVideoUrl(filePath);
              if (url && url.startsWith('http://localhost:')) {
                  devLog('✅ API Service: SUCESSO na última tentativa!');
                  return { type: 'electron-http', url, source: 'Electron HTTP Server' };
              }
          } catch (error) {
              devLog('⚠️ API Service: Última tentativa falhou:', error.message);
          }

         // ✅ Fallback inteligente apenas se APIs críticas estiverem disponíveis
         if (hasSystemAPI) {
             devLog('⚠️ API Service: Vídeo não disponível, mas sistema operacional - retornando erro informativo');
             return {
                 type: 'electron-error',
                 url: null,
                 source: 'Video API Unavailable',
                 message: 'API de vídeo não está disponível. Verifique se o processo principal do Electron está funcionando.',
                 error: 'VIDEO_API_UNAVAILABLE',
                 requiresServer: true,
                 originalPath: filePath,
                 troubleshooting: 'Verifique se o handler get-video-url está registrado no main process'
             };
         }

        // Fallback apenas se realmente não estiver no Electron
        devLog('🎬 API Service: Usando método alternativo (não-Electron ou APIs indisponíveis)');
        return this.getWebVideoSource(filePath);
    }

    async getWebVideoSource(filePath) {
        // SOLUÇÃO ROBUSTA: Nunca usar file:// URLs no Electron
        if (this.capabilities.isElectron || (window.electronAPI && window.electronAPI.isElectron && window.electronAPI.isElectron())) {
            devLog('🚫 API Service: BLOQUEANDO file:// URL no ambiente Electron');

            return {
                type: 'electron-error',
                url: null,
                source: 'Electron File URL Blocked',
                message: 'URLs file:// são bloqueadas no Electron. Use o servidor HTTP interno.',
                error: 'FILE_URL_BLOCKED',
                requiresServer: true,
                originalPath: filePath
            };
        }

        if (isWeb()) {
            devLog('🌐 API Service: Ambiente Web detectado');

            // Em ambiente web, precisamos converter o arquivo para blob URL
            return {
                type: 'web-upload',
                url: null,
                source: 'Web Upload Required',
                message: 'Por favor, faça upload do vídeo para uso na web',
                requiresUpload: true,
                originalPath: filePath
            };
        }

        // Último recurso - tentar file:// mas com aviso claro
        devLog('⚠️ API Service: Usando file:// como último recurso - pode falhar');
        const fileUrl = 'file://' + filePath;
        return {
            type: 'file-url',
            url: fileUrl,
            source: 'Direct File URL (Último Recurso)',
            warning: 'Pode não funcionar devido a restrições de segurança'
        };
    }

    // Controles da Janela (Electron apenas)
    minimizeApp() {
        if (this.capabilities.isElectron && window.electronAPI?.minimizeApp) {
            window.electronAPI.minimizeApp();
        }
    }

    maximizeApp() {
        if (this.capabilities.isElectron && window.electronAPI?.maximizeApp) {
            window.electronAPI.maximizeApp();
        }
    }

    closeApp() {
        if (this.capabilities.isElectron && window.electronAPI?.closeApp) {
            window.electronAPI.closeApp();
        }
    }

    forceQuitApp() {
        if (this.capabilities.isElectron && window.electronAPI?.forceQuitApp) {
            window.electronAPI.forceQuitApp();
        }
    }

    onAppClosing(callback) {
        if (this.capabilities.isElectron && window.electronAPI?.onAppClosing) {
            window.electronAPI.onAppClosing(callback);
            // Retorna uma função para remover o listener, para limpeza
            return () => window.electronAPI.removeAllListeners('app-closing');
        }
        // Retorna uma função vazia para o ambiente web
        return () => {};
    }

    // APIs de Projeto
    async saveProject(projectData, filePath) {
        await this.waitUntilReady();

        if (this.capabilities.isElectron && window.electronAPI?.project?.saveProject) {
            try {
                return await window.electronAPI.project.saveProject(projectData, filePath);
            } catch (error) {
                console.error('💾 API Service: Erro ao salvar projeto:', error);
                throw error;
            }
        } else {
            // Em ambiente web, fazer download
            return this.saveProjectWeb(projectData);
        }
    }

    saveProjectWeb(projectData) {
        devLog('💾 API Service: Salvando projeto como download web');

        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectData.name || 'project'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, method: 'web-download' };
    }

    // Utilidades
    getCapabilities() {
        return { ...this.capabilities };
    }

    isReady() {
        return this.isReady;
    }

    getEnvironmentMessage() {
        if (this.capabilities?.isElectron) {
            if (this.capabilities.hasVideoAPI && this.capabilities.hasSystemAPI) {
                return '✅ Ambiente Electron com APIs completas';
            } else {
                return '⚠️ Ambiente Electron com APIs limitadas';
            }
        } else {
            return '🌐 Ambiente Web (funcionalidade limitada)';
        }
    }

    // ✅ SOLUÇÃO DEFINITIVA: Sistema completamente refatorado para informações do sistema (método principal já existe acima)

    // ✅ NOVA LÓGICA: Verificar se contexto Electron está completamente pronto
    isElectronContextReady() {
        try {
            // Verificação mínima de disponibilidade
            if (!window.electronAPI?.system) {
                return false;
            }

            // Verificação de pelo menos uma função disponível
            const hasSyncAPI = typeof window.electronAPI.system.getSystemInfoSync === 'function';
            const hasAsyncAPI = typeof window.electronAPI.system.getSystemInfo === 'function';

            if (!hasSyncAPI && !hasAsyncAPI) {
                return false;
            }

            devLog('✅ API Service: Contexto Electron verificado e pronto');
            return true;

        } catch (error) {
            devLog('⚠️ API Service: Erro na verificação do contexto Electron:', error.message);
            return false;
        }
    }

    // ✅ NOVA LÓGICA: Obter informações locais imediatas (sempre funciona)
    getLocalSystemInfo() {
        const info = {
            platform: 'browser',
            arch: 'javascript',
            cpus: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
            timestamp: Date.now(),
            source: 'local',
            isElectron: this.capabilities?.isElectron || false,
            screenResolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true
        };

        devLog('✅ API Service: Informações locais geradas:', info);
        return info;
    }

    // ✅ NOVA LÓGICA: Tentar obter informações do Electron (com segurança máxima)
    async getElectronSystemInfo() {
        // Tentar versão síncrona primeiro (mais rápida e segura)
        if (window.electronAPI?.system?.getSystemInfoSync) {
            try {
                devLog('🔄 API Service: Tentando versão síncrona...');

                // Verificação final de segurança
                if (typeof window.electronAPI.system.getSystemInfoSync !== 'function') {
                    throw new Error('Função síncrona não disponível');
                }

                const info = window.electronAPI.system.getSystemInfoSync();

                if (info && info.platform) {
                    // Enriquecer informações locais com dados do Electron
                    const enrichedInfo = {
                        ...this.getLocalSystemInfo(),
                        ...info,
                        source: 'electron-sync',
                        enriched: true
                    };

                    devLog('✅ API Service: Informações enriquecidas obtidas via Electron');
                    return enrichedInfo;
                }

            } catch (error) {
                devLog('⚠️ API Service: Versão síncrona falhou:', error.message);
            }
        }

        // Tentar versão assíncrona apenas se realmente necessário
        if (window.electronAPI?.system?.getSystemInfo) {
            try {
                devLog('🔄 API Service: Tentando versão assíncrona...');

                // Delay mínimo para garantir contexto
                await new Promise(resolve => setTimeout(resolve, 50));

                const info = await window.electronAPI.system.getSystemInfo();

                if (info && info.platform) {
                    // Enriquecer informações locais com dados do Electron
                    const enrichedInfo = {
                        ...this.getLocalSystemInfo(),
                        ...info,
                        source: 'electron-async',
                        enriched: true
                    };

                    devLog('✅ API Service: Informações enriquecidas obtidas via Electron (assíncrono)');
                    return enrichedInfo;
                }

            } catch (error) {
                devLog('⚠️ API Service: Versão assíncrona falhou:', error.message);
            }
        }

        devLog('⚠️ API Service: APIs do Electron não funcionais');
        return null;
    }

    // ✅ NOVA LÓGICA: Fallback enriquecido como último recurso
    getEnhancedFallbackInfo() {
        try {
            const baseInfo = this.getLocalSystemInfo();

            // Adicionar informações adicionais úteis
            const enhancedInfo = {
                ...baseInfo,
                source: 'enhanced-fallback',
                message: 'Usando informações locais - APIs do sistema não disponíveis',
                fallbackReason: 'Electron APIs não acessíveis',
                timestamp: Date.now(),
                hasElectronContext: !!window.electronAPI,
                hasSystemAPI: !!window.electronAPI?.system?.getSystemInfo,
                hasSystemAPISync: !!window.electronAPI?.system?.getSystemInfoSync,
                // Dados simulados para funcionalidades básicas
                totalMemory: this.estimateMemory(),
                freeMemory: this.estimateMemory() * 0.6, // Estimativa de 60% disponível
                nodeVersion: 'simulado',
                electronVersion: 'simulado',
                chromeVersion: 'simulado'
            };

            devLog('✅ API Service: Fallback enriquecido gerado com sucesso');
            return enhancedInfo;

        } catch (error) {
            console.error('❌ API Service: Erro no fallback enriquecido:', error);
            return {
                platform: 'error',
                error: error.message,
                timestamp: Date.now(),
                source: 'error'
            };
        }
    }

    // ✅ NOVA LÓGICA: Estimativa de memória baseada no ambiente
    estimateMemory() {
        try {
            // Tentar usar performance.memory se disponível
            if (window.performance && window.performance.memory) {
                return Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024);
            }

            // Estimativa baseada no ambiente
            if (this.capabilities?.isElectron) {
                return 256; // Estimativa conservadora para Electron
            } else {
                return 128; // Estimativa para navegador
            }
        } catch {
            return 64; // Valor mínimo seguro
        }
    }

    // ✅ NOVA LÓGICA: Verificação rápida de contexto de vídeo
    checkVideoContext(filePath) {
        try {
            if (!filePath || typeof filePath !== 'string') {
                return { valid: false, reason: 'Caminho do arquivo inválido' };
            }

            if (!window.electronAPI) {
                return { valid: false, reason: 'API do Electron não disponível' };
            }

            return { valid: true };

        } catch (error) {
            return { valid: false, reason: `Erro na verificação: ${error.message}` };
        }
    }

    // ✅ NOVA LÓGICA: Verificar se API de vídeo está pronta
    isVideoAPIReady() {
        try {
            if (!window.electronAPI?.video?.getVideoUrl) {
                return false;
            }

            if (typeof window.electronAPI.video.getVideoUrl !== 'function') {
                return false;
            }

            devLog('✅ API Service: API de vídeo verificada e pronta');
            return true;

        } catch (error) {
            devLog('⚠️ API Service: Erro na verificação da API de vídeo:', error.message);
            return false;
        }
    }

    // ✅ NOVA LÓGICA: Obter URL do vídeo via Electron com segurança máxima
    async getElectronVideoUrl(filePath) {
        try {
            devLog('🎥 API Service: Tentando obter URL via Electron...');

            // Verificação final de segurança
            if (typeof window.electronAPI.video.getVideoUrl !== 'function') {
                throw new Error('Função getVideoUrl não disponível');
            }

            // Delay mínimo para garantir contexto
            await new Promise(resolve => setTimeout(resolve, 50));

            const url = await window.electronAPI.video.getVideoUrl(filePath);

            // Validação da URL retornada
            if (url && typeof url === 'string' && url.startsWith('http://localhost:')) {
                devLog('✅ API Service: URL válida obtida:', url);
                return url;
            } else {
                throw new Error('URL inválida retornada pela API');
            }

        } catch (error) {
            devLog('⚠️ API Service: Erro ao obter URL do vídeo:', error.message);
            throw error;
        }
    }

    async getCpuUsage() {
        await this.waitUntilReady();
        if (this.capabilities.isElectron && window.electronAPI?.system?.getCpuUsage) {
            try {
                return await window.electronAPI.system.getCpuUsage();
            } catch (error) {
                devLog('💻 API Service: Erro ao obter uso de CPU:', error.message);
                return 'N/A';
            }
        }
        return 'N/A';
    }
}

// Criar instância global
const apiService = new ApiService();

// Exportar instância e funções convenientes
export default apiService;
export const getVideoUrl = (filePath) => apiService.getVideoUrl(filePath);
export const fileExists = (filePath) => apiService.fileExists(filePath);
export const getSystemInfo = () => apiService.getSystemInfo();
export const getCpuUsage = () => apiService.getCpuUsage();
export const forceQuitApp = () => apiService.forceQuitApp();
export const onAppClosing = (callback) => apiService.onAppClosing(callback);
export const getVideoSource = (filePath) => apiService.getVideoSource(filePath);
export const saveProject = (projectData, filePath) => apiService.saveProject(projectData, filePath);
export const getCapabilities = () => apiService.getCapabilities();
export const isApiReady = () => apiService.isReady();
export const getEnvironmentMessage = () => apiService.getEnvironmentMessage();