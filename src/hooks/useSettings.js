import { useState, useEffect, useCallback } from 'react';
import apiService from '../utils/apiService';

const DEFAULT_SETTINGS = {
  // Configurações Gerais
  autoSave: true,
  autoSaveInterval: 300000, // 5 minutos em ms
  recentProjectsLimit: 10,
  defaultProjectLocation: '',
  backupOnSave: false,

  // Configurações de Vídeo
  defaultVideoQuality: 'high', // low, medium, high
  maxVideoSize: 2147483648, // 2GB em bytes
  videoPreviewQuality: 'medium',
  videoCacheSize: 1073741824, // 1GB em bytes

  // Configurações de Interface
  theme: 'system', // light, dark, system
  language: 'pt-BR',
  sidebarWidth: 320,
  timelineHeight: 120,
  showKeyboardShortcuts: true,
  enableAnimations: true,
  reduceMotion: false,

  // Configurações de Exportação
  defaultExportFormat: 'ava',
  includeVideoInExport: true,
  compressionLevel: 'medium', // low, medium, high
  metadataInExport: true,

  // Configurações de Desenvolvimento
  enableDevTools: false,
  showDebugInfo: false,
  logLevel: 'info', // error, warn, info, debug
  enableDebugConsole: false,

  // Configurações de Privacidade
  enableTelemetry: false,
  enableUsageStats: false,
  enableCloudBackup: false,
  analyticsDataRetention: 90, // dias

  // Configurações de Performance
  maxConcurrentOperations: 3,
  enableHardwareAcceleration: true,
  memoryLimit: 2147483648, // 2GB
  enableMultiThreading: true,

  // Configurações de Acessibilidade
  enableScreenReader: false,
  enableHighContrast: false,
  fontSize: 'medium', // small, medium, large, extra-large
  enableFocusIndicator: true,
  announceChanges: false,

  // Configurações de Atalhos
  customShortcuts: {},
  enableGlobalShortcuts: false,
  shortcutConflicts: 'warn' // warn, block, allow
};

const SETTINGS_CATEGORIES = {
  general: {
    title: 'Configurações Gerais',
    icon: '⚙️',
    description: 'Configurações básicas da aplicação'
  },
  video: {
    title: 'Configurações de Vídeo',
    icon: '🎥',
    description: 'Processamento e qualidade de vídeo'
  },
  interface: {
    title: 'Configurações de Interface',
    icon: '🎨',
    description: 'Aparência e comportamento da interface'
  },
  export: {
    title: 'Configurações de Exportação',
    icon: '📤',
    description: 'Opções de exportação de projetos'
  },
  privacy: {
    title: 'Configurações de Privacidade',
    icon: '🔒',
    description: 'Privacidade e compartilhamento de dados'
  },
  performance: {
    title: 'Configurações de Performance',
    icon: '⚡',
    description: 'Otimização e uso de recursos'
  },
  accessibility: {
    title: 'Configurações de Acessibilidade',
    icon: '♿',
    description: 'Recursos de acessibilidade'
  },
  shortcuts: {
    title: 'Configurações de Atalhos',
    icon: '⌨️',
    description: 'Personalização de atalhos de teclado'
  }
};

const validateSetting = (key, value) => {
  const validations = {
    autoSave: (v) => typeof v === 'boolean',
    autoSaveInterval: (v) => typeof v === 'number' && v >= 60000, // mínimo 1 minuto
    recentProjectsLimit: (v) => typeof v === 'number' && v >= 1 && v <= 50,
    maxVideoSize: (v) => typeof v === 'number' && v >= 1048576, // mínimo 1MB
    videoCacheSize: (v) => typeof v === 'number' && v >= 104857600, // mínimo 100MB
    theme: (v) => ['light', 'dark', 'system'].includes(v),
    language: (v) => typeof v === 'string' && v.length >= 2,
    sidebarWidth: (v) => typeof v === 'number' && v >= 200 && v <= 600,
    timelineHeight: (v) => typeof v === 'number' && v >= 80 && v <= 200,
    maxConcurrentOperations: (v) => typeof v === 'number' && v >= 1 && v <= 10,
    memoryLimit: (v) => typeof v === 'number' && v >= 536870912, // mínimo 512MB
    analyticsDataRetention: (v) => typeof v === 'number' && v >= 7 && v <= 365
  };

  if (validations[key]) {
    return validations[key](value);
  }

  return true; // Para configurações sem validação específica
};

const sanitizeSetting = (key, value) => {
  const sanitizations = {
    defaultProjectLocation: (v) => v || '',
    customShortcuts: (v) => v || {},
    logLevel: (v) => ['error', 'warn', 'info', 'debug'].includes(v) ? v : 'info'
  };

  if (sanitizations[key]) {
    return sanitizations[key](value);
  }

  return value;
};

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Carregar configurações do armazenamento local
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Tentar carregar do armazenamento local do Electron
      if (apiService.isElectron && apiService.hasStorageAPI) {
        const savedSettings = await apiService.getSettings();
        if (savedSettings) {
          const validatedSettings = {};
          Object.keys(savedSettings).forEach(key => {
            if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
              const value = sanitizeSetting(key, savedSettings[key]);
              if (validateSetting(key, value)) {
                validatedSettings[key] = value;
              } else {
                console.warn(`Configuração inválida para ${key}:`, savedSettings[key]);
                validatedSettings[key] = DEFAULT_SETTINGS[key];
              }
            }
          });
          setSettings({ ...DEFAULT_SETTINGS, ...validatedSettings });
        }
      }

      // Fallback para localStorage do navegador
      else if (typeof window !== 'undefined' && window.localStorage) {
        const savedSettings = localStorage.getItem('avalibras-settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            const validatedSettings = {};
            Object.keys(parsed).forEach(key => {
              if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
                const value = sanitizeSetting(key, parsed[key]);
                if (validateSetting(key, value)) {
                  validatedSettings[key] = value;
                } else {
                  console.warn(`Configuração inválida para ${key}:`, parsed[key]);
                  validatedSettings[key] = DEFAULT_SETTINGS[key];
                }
              }
            });
            setSettings({ ...DEFAULT_SETTINGS, ...validatedSettings });
          } catch (err) {
            console.error('Erro ao carregar configurações:', err);
          }
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings = null) => {
    try {
      const settingsToSave = newSettings || settings;

      // Validar todas as configurações
      const validatedSettings = {};
      Object.keys(settingsToSave).forEach(key => {
        if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
          const value = sanitizeSetting(key, settingsToSave[key]);
          if (validateSetting(key, value)) {
            validatedSettings[key] = value;
          } else {
            console.warn(`Configuração inválida para ${key}:`, settingsToSave[key]);
            validatedSettings[key] = DEFAULT_SETTINGS[key];
          }
        }
      });

      // Salvar no armazenamento local do Electron
      if (apiService.isElectron && apiService.hasStorageAPI) {
        await apiService.saveSettings(validatedSettings);
      }

      // Fallback para localStorage do navegador
      else if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('avalibras-settings', JSON.stringify(validatedSettings));
      }

      setSettings(validatedSettings);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      return validatedSettings;
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError(err.message);
      throw err;
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    if (!DEFAULT_SETTINGS.hasOwnProperty(key)) {
      console.warn(`Chave de configuração desconhecida: ${key}`);
      return;
    }

    const sanitizedValue = sanitizeSetting(key, value);

    if (!validateSetting(key, sanitizedValue)) {
      console.warn(`Valor inválido para ${key}:`, sanitizedValue);
      return;
    }

    setSettings(prev => ({ ...prev, [key]: sanitizedValue }));
    setHasUnsavedChanges(true);
  }, []);

  const updateMultipleSettings = useCallback((updates) => {
    const validatedUpdates = {};

    Object.keys(updates).forEach(key => {
      if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
        const sanitizedValue = sanitizeSetting(key, updates[key]);
        if (validateSetting(key, sanitizedValue)) {
          validatedUpdates[key] = sanitizedValue;
        } else {
          console.warn(`Valor inválido para ${key}:`, updates[key]);
        }
      } else {
        console.warn(`Chave de configuração desconhecida: ${key}`);
      }
    });

    if (Object.keys(validatedUpdates).length > 0) {
      setSettings(prev => ({ ...prev, ...validatedUpdates }));
      setHasUnsavedChanges(true);
    }
  }, []);

  const resetSettings = useCallback(async (category = null) => {
    try {
      if (category) {
        // Resetar apenas uma categoria específica
        const categorySettings = Object.keys(DEFAULT_SETTINGS).filter(key =>
          key.startsWith(category)
        );
        const resetValues = {};
        categorySettings.forEach(key => {
          resetValues[key] = DEFAULT_SETTINGS[key];
        });
        await updateMultipleSettings(resetValues);
      } else {
        // Resetar todas as configurações
        await saveSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('Erro ao resetar configurações:', err);
      throw err;
    }
  }, [updateMultipleSettings, saveSettings]);

  const exportSettings = useCallback(() => {
    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avalibras-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.settings || typeof data.settings !== 'object') {
        throw new Error('Arquivo de configurações inválido');
      }

      await updateMultipleSettings(data.settings);
      return true;
    } catch (err) {
      console.error('Erro ao importar configurações:', err);
      throw err;
    }
  }, [updateMultipleSettings]);

  const getSetting = useCallback((key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }, [settings]);

  const getCategorySettings = useCallback((category) => {
    const categoryPrefixes = {
      general: ['autoSave', 'autoSaveInterval', 'recentProjectsLimit', 'defaultProjectLocation', 'backupOnSave'],
      video: ['defaultVideoQuality', 'maxVideoSize', 'videoPreviewQuality', 'videoCacheSize'],
      interface: ['theme', 'language', 'sidebarWidth', 'timelineHeight', 'showKeyboardShortcuts', 'enableAnimations', 'reduceMotion'],
      export: ['defaultExportFormat', 'includeVideoInExport', 'compressionLevel', 'metadataInExport'],
      privacy: ['enableTelemetry', 'enableUsageStats', 'enableCloudBackup', 'analyticsDataRetention'],
      performance: ['maxConcurrentOperations', 'enableHardwareAcceleration', 'memoryLimit', 'enableMultiThreading'],
      accessibility: ['enableScreenReader', 'enableHighContrast', 'fontSize', 'enableFocusIndicator', 'announceChanges'],
      shortcuts: ['customShortcuts', 'enableGlobalShortcuts', 'shortcutConflicts']
    };

    const keys = categoryPrefixes[category] || [];
    const categorySettings = {};

    keys.forEach(key => {
      categorySettings[key] = settings[key];
    });

    return categorySettings;
  }, [settings]);

  return {
    // Estado
    settings,
    isLoading,
    error,
    hasUnsavedChanges,
    lastSaved,

    // Constantes
    DEFAULT_SETTINGS,
    SETTINGS_CATEGORIES,

    // Métodos
    saveSettings,
    loadSettings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    exportSettings,
    importSettings,
    getSetting,
    getCategorySettings,

    // Utilitários
    isDirty: hasUnsavedChanges,
    canSave: !isLoading && !error,
    hasError: !!error
  };
};