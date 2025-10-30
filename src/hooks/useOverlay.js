import { useState, useCallback, useEffect, useRef } from 'react';

export const useOverlay = (canvasRef, videoPlayerRef) => {
    const [overlays, setOverlays] = useState([]);
    const [loadedImages, setLoadedImages] = useState(new Map());
    const [activeOverlay, setActiveOverlay] = useState(null);
    const [videoState, setVideoState] = useState({
        isReady: false,
        duration: 0,
        currentTime: 0
    });

    const eventListenersRef = useRef(new Map());
    const animationFrameId = useRef(null);

    const emit = useCallback((event, data) => {
        if (eventListenersRef.current.has(event)) {
            eventListenersRef.current.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Erro no listener de evento ${event}:`, error);
                }
            });
        }
    }, []);

    const addOverlay = useCallback((overlay) => {
        const newOverlay = {
            ...overlay,
            id: overlay.id || `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        const loadImage = async () => {
            try {
                const imageUrl = await window.electronAPI.video.getVideoUrl(newOverlay.path);
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                    setLoadedImages(prev => new Map(prev).set(newOverlay.id, img));
                };
                img.onerror = () => {
                    console.error(`Failed to load overlay image from server: ${imageUrl}`);
                    emit('overlayError', { message: `Falha ao carregar imagem: ${newOverlay.path.split('/').pop()}` });
                };
            } catch (error) {
                console.error("Error getting overlay image URL:", error);
                emit('overlayError', { message: 'Erro ao obter URL da imagem.' });
            }
        };

        loadImage();
        setOverlays(prev => [...prev, newOverlay]);
        emit('overlayAdded', newOverlay);
        return newOverlay;
    }, [emit]);

    const removeOverlay = useCallback((id) => {
        setOverlays(prev => prev.filter(o => o.id !== id));
        setLoadedImages(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
        if (activeOverlay?.id === id) {
            setActiveOverlay(null);
        }
        emit('overlayRemoved', { id });
    }, [activeOverlay, emit]);

    const clearOverlays = useCallback(() => {
        setOverlays([]);
        setLoadedImages(new Map());
        setActiveOverlay(null);
        emit('overlaysCleared');
    }, [emit]);

    const updateVideoState = useCallback((videoPlayer) => {
        if (videoPlayer) {
            setVideoState({
                isReady: videoPlayer.readyState >= 2,
                duration: videoPlayer.duration || 0,
                currentTime: videoPlayer.currentTime || 0
            });
        }
    }, []);

    const calculateOverlayDimensions = useCallback((config, canvasSize) => {
        const sizePercent = config.size || 50;
        const img = loadedImages.get(config.id);

        if (!img || !img.naturalWidth || !img.naturalHeight) {
            // Fallback se a imagem não estiver carregada, usa uma aproximação simples
            return { width: (canvasSize.width * sizePercent) / 100, height: (canvasSize.height * sizePercent) / 100 };
        }

        // 1. Calcula as dimensões máximas possíveis baseadas no canvas e na porcentagem
        const maxWidth = canvasSize.width * (sizePercent / 100);
        const maxHeight = canvasSize.height * (sizePercent / 100);

        // 2. Obtém a proporção da imagem
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        // 3. Determina as dimensões finais usando a lógica "contain"
        let finalWidth = maxWidth;
        let finalHeight = finalWidth / aspectRatio;

        if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = finalHeight * aspectRatio;
        }

        return { width: finalWidth, height: finalHeight };
    }, [loadedImages]);

    const calculatePosition = useCallback((position, size, containerSize) => {
        const padding = 20;
        let x, y;
        switch (position) {
            case 'top-left': x = padding; y = padding; break;
            case 'top-center': x = (containerSize.width - size.width) / 2; y = padding; break;
            case 'top-right': x = containerSize.width - size.width - padding; y = padding; break;
            case 'center-left': x = padding; y = (containerSize.height - size.height) / 2; break;
            case 'center': default: x = (containerSize.width - size.width) / 2; y = (containerSize.height - size.height) / 2; break;
            case 'center-right': x = containerSize.width - size.width - padding; y = (containerSize.height - size.height) / 2; break;
            case 'bottom-left': x = padding; y = containerSize.height - size.height - padding; break;
            case 'bottom-center': x = (containerSize.width - size.width) / 2; y = containerSize.height - size.height - padding; break;
            case 'bottom-right': x = containerSize.width - size.width - padding; y = containerSize.height - size.height - padding; break;
        }
        return { x, y };
    }, []);

    const syncCanvasSize = useCallback(() => {
        const video = videoPlayerRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const videoRect = video.getBoundingClientRect();
        if (canvas.width !== videoRect.width || canvas.height !== videoRect.height) {
            canvas.width = videoRect.width;
            canvas.height = videoRect.height;
        }
    }, [videoPlayerRef, canvasRef]);

    const drawOverlays = useCallback(() => {
        const canvas = canvasRef.current;
        const video = videoPlayerRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentTime = video.currentTime;

        overlays.forEach(overlay => {
            if (currentTime >= overlay.startTime && currentTime <= overlay.startTime + overlay.duration) {
                const img = loadedImages.get(overlay.id);
                if (img) {
                    const { width, height } = calculateOverlayDimensions(overlay, { width: canvas.width, height: canvas.height });
                    const { x, y } = calculatePosition(overlay.position, { width, height }, { width: canvas.width, height: canvas.height });
                    ctx.globalAlpha = overlay.opacity / 100;
                    ctx.drawImage(img, x, y, width, height);
                }
            }
        });
    }, [overlays, loadedImages, canvasRef, videoPlayerRef, calculateOverlayDimensions, calculatePosition]);

    // Main render loop and event handling
    useEffect(() => {
        const video = videoPlayerRef.current;
        if (!video) return;

        let isActive = true;

        const renderLoop = () => {
            if (!isActive) return;
            drawOverlays();
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };

        const handlePlay = () => {
            if (isActive && !animationFrameId.current) {
                animationFrameId.current = requestAnimationFrame(renderLoop);
            }
        };

        const handlePauseOrEnd = () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };

        const handleLoadedMetadata = () => syncCanvasSize();

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePauseOrEnd);
        video.addEventListener('ended', handlePauseOrEnd);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        window.addEventListener('resize', syncCanvasSize);

        syncCanvasSize();
        drawOverlays();

        return () => {
            isActive = false;
            handlePauseOrEnd();
            if (video) {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePauseOrEnd);
                video.removeEventListener('ended', handlePauseOrEnd);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            }
            window.removeEventListener('resize', syncCanvasSize);
        };
    }, [drawOverlays, syncCanvasSize, videoPlayerRef]);

    return {
        // State
        overlays,
        activeOverlay,
        videoState,

        // Overlay management
        addOverlay,
        removeOverlay,
        clearOverlays,

        // Video state
        updateVideoState,

        // Active overlay
        setActiveOverlay,

        // Utilities
        calculateOverlayDimensions,
        calculatePosition
    };
};