/**
 * Hook customizado para gerenciar estado de overlays
 * Centraliza a lógica e facilita manutenção
 */

import { useCallback } from 'react';

export const useOverlayManager = () => {
    const addOverlay = useCallback((overlay) => {
        console.log('🎯 OVERLAY MANAGER: Adicionando overlay via hook customizado:', overlay);
        // Lógica para adicionar overlay (será implementada conforme necessário)
    }, []);

    const removeOverlay = useCallback((overlayId) => {
        console.log('🗑️ OVERLAY MANAGER: Removendo overlay via hook customizado:', overlayId);
        // Lógica para remover overlay (será implementada conforme necessário)
    }, []);

    const clearOverlays = useCallback(() => {
        console.log('🧹 OVERLAY MANAGER: Limpando todos os overlays via hook customizado');
        // Lógica para limpar overlays (será implementada conforme necessário)
    }, []);

    return {
        addOverlay,
        removeOverlay,
        clearOverlays
    };
};