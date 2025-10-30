/**
 * Hook customizado para gerenciar captura de tempo do vídeo
 * Centraliza a lógica e facilita manutenção
 */

import { useRef, useCallback } from 'react';

export const useVideoTime = (videoPlayerRef) => {
    const currentTimeRef = useRef(null);

    const getCurrentTime = useCallback(() => {
        if (videoPlayerRef?.current) {
            const time = videoPlayerRef.current.currentTime;
            currentTimeRef.current = time;
            console.log('🎯 VIDEO TIME: Tempo capturado via hook customizado:', time);
            return time || 0;
        }
        return currentTimeRef.current || 0;
    }, [videoPlayerRef]);

    const updateVideoTime = useCallback((newTime) => {
        if (videoPlayerRef?.current && newTime !== undefined) {
            videoPlayerRef.current.currentTime = newTime;
            currentTimeRef.current = newTime;
            console.log('⏰ VIDEO TIME: Tempo atualizado via hook:', newTime);
        }
    }, [videoPlayerRef]);

    return {
        getCurrentTime,
        updateVideoTime,
        currentTimeRef
    };
};