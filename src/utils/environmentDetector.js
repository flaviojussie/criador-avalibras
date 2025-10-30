import { devLog } from './devLog.js';
// environmentDetector.js - Utilitário centralizado para detecção de ambiente
devLog('🔍 Environment Detector: Inicializando...');

class EnvironmentDetector {
    constructor() {
        this.isElectron = null;
        this.capabilities = {};
        this.hasInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        if (this.hasInitialized) return this.capabilities;

        devLog('🔍 Environment Detector: Verificando ambiente...');

        // Detectar se está no Electron (método robusto)
        this.isElectron = this.detectElectron();
        devLog('🖥️ Environment Detector: É Electron?', this.isElectron);

        // Verificar capacidades disponíveis
        this.capabilities = {
            isElectron: this.isElectron,
            hasElectronAPI: !!(window.electronAPI),
            hasVideoAPI: !!(window.electronAPI?.video?.getVideoUrl),
            hasSystemAPI: !!(window.electronAPI?.system?.getSystemInfo),
            hasFileAPI: !!(window.electronAPI?.system?.fileExists),
            canAccessFiles: this.canAccessFiles(),
            isWeb: !this.isElectron,
            isDevelopment: typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
        };

        devLog('🔍 Environment Detector: Capacidades detectadas:', this.capabilities);
        this.hasInitialized = true;

        // ✅ SOLUÇÃO DEFINITIVA: Validação mínima inicial, validação completa em segundo plano
        if (this.isElectron) {
            // Validação assíncrona não bloqueante para não atrasar inicialização
            this.validateElectronAPIsAsync();
        }

        return this.capabilities;
    }

    detectElectron() {
        // Método robusto para detectar Electron
        const userAgent = navigator.userAgent.toLowerCase();
        const hasElectronUA = userAgent.indexOf('electron') > -1;

        // Verificar se o processo principal está disponível
        const hasProcess = typeof window !== 'undefined' && window.process && window.process.type;

        // Verificar se existe API específica do Electron
        const hasElectronAPI = !!(window.electronAPI && window.electronAPI.isElectron);

        devLog('🔍 Detection checks:', {
            userAgent: hasElectronUA,
            process: !!hasProcess,
            api: hasElectronAPI
        });

        return hasElectronUA || hasProcess || hasElectronAPI;
    }

    canAccessFiles() {
        // Verificar se pode acessar arquivos locais
        if (!this.isElectron) return false;

        // No Electron, verificar se as APIs de arquivo existem
        return !!(window.electronAPI?.system?.fileExists);
    }

    async validateElectronAPIs() {
        if (!this.isElectron) return;

        devLog('🔍 Environment Detector: Validando APIs do Electron...');

        // ✅ VALIDAÇÃO ROBUSTA: Apenas verificar existência, não executar
        try {
            if (window.electronAPI?.system?.getSystemInfoSync) {
                devLog('✅ getSystemInfoSync disponível (não executado)');
                this.capabilities.hasSystemAPI = true;
            } else if (window.electronAPI?.system?.getSystemInfo) {
                devLog('✅ getSystemInfo disponível (não executado)');
                this.capabilities.hasSystemAPI = true;
            } else {
                devLog('🔍 getSystemInfo não disponível imediatamente - será validado pelo apiService');
                // Não marcar como erro - deixar para o apiService decidir
            }
        } catch (error) {
            devLog('🔍 getSystemInfo não disponível - será tratado pelo apiService');
        }

        // Verificação de APIs de vídeo - abordagem não executiva
        if (window.electronAPI?.video?.getVideoUrl) {
            devLog('✅ getVideoUrl disponível no preload (não executado)');
            this.capabilities.hasVideoAPI = true;
        } else {
            devLog('🔍 getVideoUrl não disponível imediatamente - será validado pelo apiService');
            // Não marcar como erro - deixar para o apiService decidir
        }

        // Verificação de APIs de arquivo
        if (window.electronAPI?.system?.fileExistsSync) {
            devLog('✅ fileExistsSync disponível');
            this.capabilities.hasFileAPI = true;
        } else if (window.electronAPI?.system?.fileExists) {
            devLog('✅ fileExists disponível (assíncrono)');
            this.capabilities.hasFileAPI = true;
        }
    }

    // ✅ VALIDAÇÃO COMPLETAMENTE ASSÍNCRONA: Não executar durante inicialização crítica
    validateElectronAPIsAsync() {
        // Delay maior para garantir que o contexto IPC esteja totalmente estabelecido
        setTimeout(() => {
            this.validateElectronAPIs().then(() => {
                devLog('🔍 Environment Detector: Validação assíncrona concluída');
                devLog('🔍 Environment Detector: Capacidades finais:', this.capabilities);
            }).catch(error => {
                devLog('🔍 Environment Detector: Validação assíncrona não crítica falhou - será tratada pelo apiService');
            });
        }, 500); // Delay maior para máxima segurança
    }

    async getCapabilities() {
        await this.initPromise;
        return { ...this.capabilities };
    }

    async waitForElectronAPIs(maxWaitTime = 5000) {
        if (!this.isElectron) return false;

        devLog('⏳ Environment Detector: Aguardando APIs do Electron...');

        const startTime = Date.now();
        const checkInterval = 200;

        while (Date.now() - startTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));

            const hasAllAPIs = !!(window.electronAPI?.video?.getVideoUrl &&
                                 window.electronAPI?.system?.getSystemInfo &&
                                 window.electronAPI?.system?.fileExists);

            if (hasAllAPIs) {
                devLog('✅ Environment Detector: APIs do Electron disponíveis');
                return true;
            }
        }

        devLog('⏰ Environment Detector: Timeout aguardando APIs do Electron');
        return false;
    }

    getEnvironmentInfo() {
        return {
            isElectron: this.isElectron,
            isWeb: !this.isElectron,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hasInitialized: this.hasInitialized,
            capabilities: this.capabilities
        };
    }
}

// Criar instância global
const environmentDetector = new EnvironmentDetector();

// Exportar funções convenientes
export const isElectron = () => environmentDetector.isElectron;
export const isWeb = () => !environmentDetector.isElectron;
export const getCapabilities = () => environmentDetector.getCapabilities();
export const waitForElectronAPIs = (maxWaitTime) => environmentDetector.waitForElectronAPIs(maxWaitTime);
export const getEnvironmentInfo = () => environmentDetector.getEnvironmentInfo();

export default environmentDetector;