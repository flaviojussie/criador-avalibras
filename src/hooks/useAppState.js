import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook centralizado para gerenciar o estado global da aplicação
 * Otimiza performance e centraliza estado sem alterar arquitetura existente
 */
export const useAppState = () => {
    // Cache para memoização de callbacks
    const cacheRef = useRef(new Map());

    /**
     * Memoiza callbacks de forma otimizada
     * @param {Function} fn - Função para memoizar
     * @param {Array} deps - Dependências
     * @param {string} key - Chave única para cache
     */
    const useOptimizedCallback = useCallback((fn, deps, key) => {
        // Usar cache baseado nas dependências
        const cacheKey = `${key}-${JSON.stringify(deps)}`;

        if (cacheRef.current.has(cacheKey)) {
            return cacheRef.current.get(cacheKey);
        }

        const memoizedFn = useCallback(fn, deps);
        cacheRef.current.set(cacheKey, memoizedFn);

        // Limpar cache quando necessário
        if (cacheRef.current.size > 50) {
            const firstKey = cacheRef.current.keys().next().value;
            cacheRef.current.delete(firstKey);
        }

        return memoizedFn;
    }, []);

    /**
     * Otimiza estado de notificações
     */
    const createNotificationState = useCallback((initialState = { message: '', type: '', visible: false }) => {
        const [notification, setNotification] = useState(initialState);

        const showNotification = useOptimizedCallback((message, type = 'info') => {
            setNotification({ message, type, visible: true });
            setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false }));
            }, 3000);
        }, [setNotification], 'showNotification');

        const hideNotification = useOptimizedCallback(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, [setNotification], 'hideNotification');

        return {
            notification,
            showNotification,
            hideNotification
        };
    }, [useOptimizedCallback]);

    /**
     * Otimiza estado de modais
     */
    const createModalState = useCallback((initialState = false) => {
        const [isOpen, setIsOpen] = useState(initialState);

        const open = useOptimizedCallback(() => setIsOpen(true), [setIsOpen], `modal-open-${initialState}`);
        const close = useOptimizedCallback(() => setIsOpen(false), [setIsOpen], `modal-close-${initialState}`);
        const toggle = useOptimizedCallback(() => setIsOpen(prev => !prev), [setIsOpen], `modal-toggle-${initialState}`);

        return {
            isOpen,
            open,
            close,
            toggle
        };
    }, [useOptimizedCallback]);

    /**
     * Otimiza estado de carregamento
     */
    const createLoadingState = useCallback((initialState = false) => {
        const [isLoading, setIsLoading] = useState(initialState);

        const startLoading = useOptimizedCallback(() => setIsLoading(true), [setIsLoading], `loading-start-${initialState}`);
        const stopLoading = useOptimizedCallback(() => setIsLoading(false), [setIsLoading], `loading-stop-${initialState}`);
        const setLoading = useOptimizedCallback((state) => setIsLoading(state), [setIsLoading], `loading-set-${initialState}`);

        return {
            isLoading,
            startLoading,
            stopLoading,
            setLoading
        };
    }, [useOptimizedCallback]);

    /**
     * Limpa cache quando componente desmonta
     */
    useEffect(() => {
        return () => {
            cacheRef.current.clear();
        };
    }, []);

    return {
        createNotificationState,
        createModalState,
        createLoadingState,
        useOptimizedCallback
    };
};

export default useAppState;