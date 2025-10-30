import { useCallback, useEffect, useState } from 'react';

export const useElectron = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Verificar se está rodando no Electron
    if (window.electronAPI && window.electronAPI.isElectron()) {
      // Configurar listeners para eventos da janela
      const handleMaximize = () => setIsMaximized(true);
      const handleUnmaximize = () => setIsMaximized(false);

      window.electronAPI.onWindowMaximize(handleMaximize);
      window.electronAPI.onWindowUnmaximize(handleUnmaximize);

      // Limpar listeners ao desmontar
      return () => {
        window.electronAPI.removeAllListeners('window-maximize');
        window.electronAPI.removeAllListeners('window-unmaximize');
      };
    }
  }, []);

  return {
    // Status do ambiente
    isElectron: window.electronAPI?.isElectron?.() || false,
    platform: window.electronAPI?.platform || 'web',
    isMaximized,

    // Controles da janela
    minimizeApp: () => {
      if (window.electronAPI?.minimizeApp) {
        window.electronAPI.minimizeApp();
      }
    },
    maximizeApp: () => {
      if (window.electronAPI?.maximizeApp) {
        window.electronAPI.maximizeApp();
      }
    },
    closeApp: () => {
      if (window.electronAPI?.closeApp) {
        window.electronAPI.closeApp();
      }
    },

    // Diálogos
    showOpenDialog: async (options) => {
      if (window.electronAPI?.showOpenDialog) {
        return await window.electronAPI.showOpenDialog(options);
      }
      return { canceled: true };
    },
    showSaveDialog: async (options) => {
      if (window.electronAPI?.showSaveDialog) {
        return await window.electronAPI.showSaveDialog(options);
      }
      return { canceled: true };
    },
  };
};