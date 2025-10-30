// Forçando recarga para limpar cache do Vite.
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useVisualManager } from './useVisualManager';

export const useVideoEditor = (videoPlayerRef, timelineRef, questionsManager, selectedQuestion, handleMarkerTimeUpdate) => {
    const visualManager = useVisualManager();

    // Video editor state
    const [selectionState, setSelectionState] = useState({
        startTime: 0,
        endTime: 0,
        isSelecting: false,
        isDraggingHandle: null, // 'start' or 'end'
        isSelectionModeActive: false,
        isDraggingPlayhead: false
    });
    const [isCutting, setIsCutting] = useState(false);
    const [markerDragState, setMarkerDragState] = useState({ isDragging: false, markerKey: null, currentTime: 0, tempMarkers: null });
    const draggedMarkersRef = useRef(null);
    const [selectedMarkerKey, setSelectedMarkerKey] = useState(null);
    const [activeHandle, setActiveHandle] = useState(null); // Added for timeline
    const [overlayDragState, setOverlayDragState] = useState({ isDragging: false, overlayId: null, currentTime: 0 });
    const draggedOverlayTimeRef = useRef(0);
    const overlayDragDataRef = useRef(null);

    // Refs para otimização de requestAnimationFrame
    const rafIdRef = useRef(null);
    const markerAnimationRef = useRef(null);
    const overlayAnimationRef = useRef(null);
    const latestMouseEventRef = useRef(null);

    const lastRequestedTimeRef = useRef(0);

    const throttledSetCurrentTime = useCallback((time) => {
        if (!videoPlayerRef.current || time === lastRequestedTimeRef.current) return;

        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            if (videoPlayerRef.current) {
                videoPlayerRef.current.currentTime = time;
                lastRequestedTimeRef.current = time;
            }
            rafIdRef.current = null;
        });
    }, [videoPlayerRef]);

    const startOverlayDrag = useCallback((e, overlayToDrag) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedQuestion || !selectedQuestion.originalIndex || !videoPlayerRef.current || !timelineRef.current) {
            return;
        }
        const videoDuration = videoPlayerRef.current.duration;
        const timelineRect = timelineRef.current.getBoundingClientRect();
        if (!isFinite(videoDuration) || timelineRect.width <= 0) {
            return;
        }

        overlayDragDataRef.current = {
            overlayId: overlayToDrag.id,
            initialStartTime: overlayToDrag.startTime,
            duration: overlayToDrag.duration,
            initialMouseX: e.clientX,
            videoDuration: videoDuration,
            timelineWidth: timelineRect.width,
            questionOriginalIndex: selectedQuestion.originalIndex
        };

        setOverlayDragState({ isDragging: true, overlayId: overlayToDrag.id, currentTime: overlayToDrag.startTime });
        draggedOverlayTimeRef.current = overlayToDrag.startTime;

        const handleMouseMove = (moveEvent) => {
            latestMouseEventRef.current = moveEvent;
            if (!overlayAnimationRef.current) {
                overlayAnimationRef.current = requestAnimationFrame(() => {
                    const currentEvent = latestMouseEventRef.current;
                    const currentDragData = overlayDragDataRef.current;
                    if (!currentEvent || !currentDragData) {
                        overlayAnimationRef.current = null;
                        return;
                    }

                    const deltaX = currentEvent.clientX - currentDragData.initialMouseX;
                    const deltaTime = (deltaX / currentDragData.timelineWidth) * currentDragData.videoDuration;
                    let newStartTime = currentDragData.initialStartTime + deltaTime;
                    newStartTime = Math.max(0, Math.min(newStartTime, currentDragData.videoDuration - currentDragData.duration));

                    if (isFinite(newStartTime)) {
                        setOverlayDragState(prev => ({ ...prev, currentTime: newStartTime }));
                        draggedOverlayTimeRef.current = newStartTime;
                        throttledSetCurrentTime(newStartTime);
                    }

                    overlayAnimationRef.current = null;
                });
            }
        };

        const handleMouseUp = () => {
            if (overlayAnimationRef.current) {
                cancelAnimationFrame(overlayAnimationRef.current);
                overlayAnimationRef.current = null;
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            const finalStartTime = draggedOverlayTimeRef.current;
            const currentDragData = overlayDragDataRef.current;

            if (currentDragData && isFinite(finalStartTime)) {
                const currentQuestion = questionsManager.getQuestion(currentDragData.questionOriginalIndex);
                if (currentQuestion && currentQuestion.overlays) {
                    const updatedOverlays = currentQuestion.overlays.map(overlay =>
                        overlay.id === currentDragData.overlayId
                            ? { ...overlay, startTime: finalStartTime }
                            : overlay
                    );
                    questionsManager.updateQuestion(currentDragData.questionOriginalIndex, { overlays: updatedOverlays });
                }
            }

            setOverlayDragState({ isDragging: false, overlayId: null, currentTime: 0 });
            overlayDragDataRef.current = null;
            draggedOverlayTimeRef.current = 0;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

    }, [selectedQuestion, videoPlayerRef, timelineRef, questionsManager, throttledSetCurrentTime]);

    // Refs for event handlers
    const handlersRef = useRef({
        mouseMove: null,
        mouseUp: null,
        keyboardHandler: null
    });

    // Electron click detector state
    const electronClickDetectorRef = useRef({
        clicks: 0,
        lastClickTime: 0,
        pendingEvent: null,
        timer: null,
        doubleClickDelay: 200
    });

    // Performance measurement for adaptive click delay
    const setupAdaptiveClickDelay = useCallback(() => {
        const detector = electronClickDetectorRef.current;
        detector.doubleClickDelay = 200; // Default optimized delay

        // Try to use Electron API if available
        if (window.electronAPI && typeof window.electronAPI.getSystemDoubleClickTime === 'function') {
            try {
                window.electronAPI.getSystemDoubleClickTime().then(systemDelay => {
                    if (systemDelay && systemDelay > 0) {
                        // Apply optimization factor (75% of system delay for better UX)
                        detector.doubleClickDelay = Math.max(150, Math.min(400, systemDelay * 0.75));
                    }
                }).catch(error => {
                    console.error('⚡ ELECTRON: Erro ao obter delay do sistema, usando padrão:', error);
                });
            } catch (error) {
                console.error('⚡ ELECTRON: API de delay não disponível, usando padrão', error);
            }
        } else {
            // Calculate performance-based delay
            calculatePerformanceBasedDelay();
        }

        // Detect accessibility settings
        detectAccessibilitySettings();
    }, []);

    const calculatePerformanceBasedDelay = useCallback(() => {
        const start = performance.now();
        let iterations = 0;
        const maxIterations = 100000;

        while (iterations < maxIterations && performance.now() - start < 1) {
            iterations++;
        }

        const opsPerMs = iterations / (performance.now() - start);
        const detector = electronClickDetectorRef.current;

        // Adjust delay based on performance
        if (opsPerMs > 50000) {
            detector.doubleClickDelay = 150;
        } else if (opsPerMs > 20000) {
            detector.doubleClickDelay = 200;
        } else {
            detector.doubleClickDelay = 300;
        }
    }, []);

    const detectAccessibilitySettings = useCallback(() => {
        const detector = electronClickDetectorRef.current;

        // Check for reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            detector.doubleClickDelay += 100;
        }

        // Check for fine pointer preference
        if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
            detector.doubleClickDelay = Math.max(150, detector.doubleClickDelay - 50);
        }
    }, []);

    // Initialize electron click detector
    const initElectronDetector = useCallback(() => {
        const detector = electronClickDetectorRef.current;

        detector.detect = (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - detector.lastClickTime;
            const isDoubleClick = timeDiff < detector.doubleClickDelay;

            if (isDoubleClick) {
                detector.clicks++;
                detector.lastClickTime = currentTime;
            } else {
                detector.clicks = 1;
                detector.lastClickTime = currentTime;
            }

            // Clear previous timer
            if (detector.timer) {
                clearTimeout(detector.timer);
            }

            // Store pending event
            detector.pendingEvent = e;

            // Set timer for decision
            detector.timer = setTimeout(() => {
                if (detector.clicks === 2) {
                    performSelection(detector.pendingEvent);
                } else {
                    // If in selection mode, use click to mark END
                    if (selectionState.isSelectionModeActive) {
                        markSelectionEnd(detector.pendingEvent);
                    } else {
                        seekToClickPosition(detector.pendingEvent);
                    }
                }

                // Reset detector
                detector.clicks = 0;
                detector.pendingEvent = null;
            }, detector.doubleClickDelay);
        };
    }, [selectionState.isSelectionModeActive]);

    // Check if click can be processed
    const canProcessClick = useCallback((e) => {
        // Ignore clicks if video is not ready
        if (!videoPlayerRef.current || !videoPlayerRef.current.duration || videoPlayerRef.current.duration <= 0) {
            return false;
        }

        // Ignore if clicked on selection handles
        if (e.target.classList.contains('selection-start') || e.target.classList.contains('selection-end')) {
            return false;
        }

        // Ignore if clicked on playhead
        if (e.target.closest('.playhead') || e.target.closest('.playhead-hit-area')) {
            return false;
        }

        // Ignore if clicked on markers/overlays
        if (e.target.closest('.marker-item') || e.target.closest('.overlay-segment')) {
            return false;
        }

        // Allow only clicks on timeline areas
        const allowedTargets = ['timeline-track', 'timeline-progress', 'timeline-bar'];
        const isAllowedTarget = allowedTargets.some(selector =>
            e.target.classList.contains(selector) || e.target.closest(`.${selector}`)
        );

        if (!isAllowedTarget) {
            return false;
        }

        return true;
    }, [videoPlayerRef]);

    // Start selection process
    const startSelection = useCallback((e) => {
        if (!canProcessClick(e)) {
            return;
        }

        // Use electron click detector
        if (electronClickDetectorRef.current) {
            electronClickDetectorRef.current.detect(e);
        } else {
            seekToClickPosition(e);
        }
    }, [canProcessClick, selectionState.isSelectionModeActive]);

    // Seek to click position
    const seekToClickPosition = useCallback((e) => {
        if (!videoPlayerRef.current || !timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        const newTime = (percentage / 100) * videoPlayerRef.current.duration;

        if (videoPlayerRef.current.duration && isFinite(videoPlayerRef.current.duration)) {
            videoPlayerRef.current.currentTime = newTime;
            visualManager.updatePlayhead({ position: percentage });
        }
    }, [videoPlayerRef, timelineRef, visualManager]);

    // Perform selection
    const performSelection = useCallback((e) => {
        if (!timelineRef.current) {
            return;
        }

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const time = (percentage / 100) * (videoPlayerRef.current?.duration || 0);

        setSelectionState(prev => ({
            ...prev,
            startTime: time,
            endTime: time,
            isSelecting: true,
            isSelectionModeActive: true
        }));

        visualManager.updateSelection({
            left: percentage,
            width: 0,
            display: 'block',
            isActive: true
        });

        // Hide playhead and progress during selection
        visualManager.updatePlayhead({ display: 'none' });
        visualManager.updateProgress({ display: 'none' });

        // Add global listeners for selection
        document.addEventListener('mousemove', updateSelection);
        document.addEventListener('mouseup', endSelection);
    }, [timelineRef, videoPlayerRef, visualManager]);

    // Update selection
    const updateSelection = useCallback((e) => {
        if (!timelineRef.current || !selectionState.isSelecting) {
            return;
        }

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const time = (percentage / 100) * (videoPlayerRef.current?.duration || 0);

        const startTime = Math.min(selectionState.startTime, time);
        const endTime = Math.max(selectionState.startTime, time);

        setSelectionState(prev => ({
            ...prev,
            startTime,
            endTime
        }));

        // Removido: visualManager.updateSelection - agora usa renderização React direta
    }, [timelineRef, videoPlayerRef, selectionState.startTime, selectionState.isSelecting]);

    // End selection
    const endSelection = useCallback(() => {
        if (!selectionState.isSelecting) return;

        setSelectionState(prev => ({
            ...prev,
            isSelecting: false
        }));

        // Remove global listeners
        document.removeEventListener('mousemove', updateSelection);
        document.removeEventListener('mouseup', endSelection);

        // Keep selection mode active but show playhead again
        visualManager.updateTimeline({ interactionState: 'selection_active' });
    }, [selectionState.isSelecting, visualManager]);

    // Mark selection end
    const markSelectionEnd = useCallback((e) => {
        if (!timelineRef.current || !selectionState.isSelectionModeActive) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const time = (percentage / 100) * (videoPlayerRef.current?.duration || 0);

        const startTime = Math.min(selectionState.startTime, time);
        const endTime = Math.max(selectionState.startTime, time);

        setSelectionState(prev => ({
            ...prev,
            startTime,
            endTime,
            isSelecting: false
        }));

        // Removido: visualManager.updateSelection - agora usa renderização React direta
    }, [timelineRef, videoPlayerRef, selectionState.startTime, selectionState.isSelectionModeActive]);

    // Cancel selection
    const cancelSelection = useCallback(() => {
        if (!selectionState.isSelecting) return;

        setSelectionState(prev => ({
            ...prev,
            isSelecting: false,
            isSelectionModeActive: false,
            startTime: 0,
            endTime: 0
        }));

        // Removido: visualManager.updateSelection - agora usa renderização React direta

        visualManager.updatePlayhead({ display: 'block' });
        visualManager.updateProgress({ display: 'block' });
        visualManager.updateTimeline({ interactionState: 'idle' });

        // Remove global listeners
        document.removeEventListener('mousemove', updateSelection);
        document.removeEventListener('mouseup', endSelection);
    }, [selectionState.isSelecting, visualManager]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectionState(prev => ({
            ...prev,
            startTime: 0,
            endTime: 0,
            isSelecting: false,
            isSelectionModeActive: false
        }));

        // Removido: visualManager.updateSelection - agora usa renderização React direta

        visualManager.updatePlayhead({ display: 'block' });
        visualManager.updateProgress({ display: 'block' });
        visualManager.updateTimeline({ interactionState: 'idle' });
    }, [visualManager]);

    // Setup playhead dragging
    const setupPlayheadDragging = useCallback(() => {
        if (!timelineRef.current) return;

        const playhead = timelineRef.current.querySelector('.playhead');
        if (!playhead) {
            console.log('⚠️ Playhead não encontrado - arrastar agulha não ativado');
            return;
        }

        const handleMouseDown = (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (selectionState.isSelectionModeActive) {
                console.log('❌ Agulha desativada durante modo seleção');
                return;
            }

            console.log('🎯 Arrastar agulha iniciado');
            setSelectionState(prev => ({ ...prev, isDraggingPlayhead: true }));

            const handleMouseMove = (e) => handlePlayheadDrag(e);
            const handleMouseUp = () => endPlayheadDrag();

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Store handlers for cleanup
            handlersRef.current.mouseMove = handleMouseMove;
            handlersRef.current.mouseUp = handleMouseUp;
        };

        playhead.addEventListener('mousedown', handleMouseDown);

        return () => {
            playhead.removeEventListener('mousedown', handleMouseDown);
        };
    }, [timelineRef, selectionState.isSelectionModeActive]);

    // Handle playhead drag
    const handlePlayheadDrag = useCallback((e) => {
        if (!selectionState.isDraggingPlayhead || !videoPlayerRef.current || !timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        const newTime = (percentage / 100) * videoPlayerRef.current.duration;

        if (videoPlayerRef.current.duration && isFinite(videoPlayerRef.current.duration)) {
            throttledSetCurrentTime(newTime);
            visualManager.updatePlayhead({ position: percentage });
        }
    }, [selectionState.isDraggingPlayhead, videoPlayerRef, timelineRef, visualManager]);

    // End playhead drag
    const endPlayheadDrag = useCallback(() => {
        if (!selectionState.isDraggingPlayhead) return;

        console.log('🎯 Arrastar agulha finalizado');

        setSelectionState(prev => ({ ...prev, isDraggingPlayhead: false }));

        // Remove global listeners
        if (handlersRef.current.mouseMove) {
            document.removeEventListener('mousemove', handlersRef.current.mouseMove);
            handlersRef.current.mouseMove = null;
        }
        if (handlersRef.current.mouseUp) {
            document.removeEventListener('mouseup', handlersRef.current.mouseUp);
            handlersRef.current.mouseUp = null;
        }
    }, [selectionState.isDraggingPlayhead]);

    // Setup keyboard shortcuts
    const setupKeyboardShortcuts = useCallback(() => {
        const handleKeyDown = (e) => {
            // Ignore if in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'Escape':
                    if (selectionState.isSelecting || selectionState.isSelectionModeActive) {
                        e.preventDefault();
                        cancelSelection();
                    }
                    break;
                case 'Enter':
                    if (selectionState.isSelectionModeActive) {
                        e.preventDefault();
                        // Confirm selection logic here
                        console.log('✅ Seleção confirmada');
                    }
                    break;
                case 'Delete':
                    if (!selectionState.isSelecting && selectionState.startTime > 0 && selectionState.endTime > 0) {
                        e.preventDefault();
                        clearSelection();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        handlersRef.current.keyboardHandler = handleKeyDown;

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectionState.isSelecting, selectionState.isSelectionModeActive, selectionState.startTime, selectionState.endTime, cancelSelection, clearSelection]);

    const startHandleDrag = useCallback((e, handle) => {
        e.stopPropagation();
        setSelectionState(prev => ({ ...prev, isDraggingHandle: handle }));

        const handleMouseMove = (moveEvent) => {
            if (!timelineRef.current || !videoPlayerRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            const time = percentage * videoPlayerRef.current.duration;

            if (videoPlayerRef.current) {
                throttledSetCurrentTime(time);
            }

            setSelectionState(prev => {
                if (handle === 'start') {
                    const endTime = Math.max(time, prev.endTime);
                    return { ...prev, startTime: time, endTime };
                } else {
                    const startTime = Math.min(time, prev.startTime);
                    return { ...prev, startTime, endTime: time };
                }
            });
        };

        const handleMouseUp = () => {
            setSelectionState(prev => ({ ...prev, isDraggingHandle: null }));
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [timelineRef, videoPlayerRef]);

    const startSelectionDrag = useCallback((e) => {
        e.stopPropagation();
        if (e.target.classList.contains('selection-start') || e.target.classList.contains('selection-end')) {
            return;
        }

        const initialStartTime = selectionState.startTime;
        const initialEndTime = selectionState.endTime;
        const initialX = e.clientX;

        const handleMouseMove = (moveEvent) => {
            if (!timelineRef.current || !videoPlayerRef.current) return;

            const deltaX = moveEvent.clientX - initialX;
            const rect = timelineRef.current.getBoundingClientRect();
            const deltaTime = (deltaX / rect.width) * videoPlayerRef.current.duration;

            const newStartTime = initialStartTime + deltaTime;
            const newEndTime = initialEndTime + deltaTime;

            if (newStartTime >= 0 && newEndTime <= videoPlayerRef.current.duration) {
                setSelectionState(prev => ({ ...prev, startTime: newStartTime, endTime: newEndTime }));
                if (videoPlayerRef.current) {
                    throttledSetCurrentTime(newStartTime);
                }
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [selectionState.startTime, selectionState.endTime, timelineRef, videoPlayerRef]);

    const activateCutMode = useCallback(() => {
        setSelectionState(prev => ({ ...prev, isSelectionModeActive: true }));
        console.log('✂️ Modo de corte ativado');
    }, []);

    const cutVideo = useCallback(async (videoPath, startTime, endTime, questionsManager, selectedQuestion) => {
        // ✅ CORREÇÃO: Verificar o caminho correto da API
        if (!window.electronAPI || !window.electronAPI.video || typeof window.electronAPI.video.cutVideo !== 'function') {
            console.error('❌ API de corte de vídeo não disponível. Verificando:', {
                hasElectronAPI: !!window.electronAPI,
                hasVideoObject: !!window.electronAPI?.video,
                hasCutVideoFunction: typeof window.electronAPI?.video?.cutVideo
            });
            return;
        }

        setIsCutting(true);
        try {
            // ✅ CORREÇÃO: Usar o caminho correto da API
            const result = await window.electronAPI.video.cutVideo(videoPath, startTime, endTime);
            
            // O resultado pode ser um objeto com success e processedPath
            const newVideoPath = result?.processedPath || result;
            
            if (newVideoPath) {
                questionsManager.updateQuestion(selectedQuestion.originalIndex, { video: newVideoPath });
            } else {
                console.warn('⚠️ API de corte retornou resultado vazio:', result);
            }
        } catch (error) {
            console.error('❌ Erro ao cortar o vídeo:', error);
        } finally {
            setIsCutting(false);
            clearSelection();
        }
    }, [questionsManager, clearSelection]);

    const startMarkerDrag = useCallback((e, markerKey) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedQuestion || !selectedQuestion.originalIndex || !videoPlayerRef.current || !timelineRef.current) {
            return;
        }
        const videoDuration = videoPlayerRef.current.duration;
        const timelineRect = timelineRef.current.getBoundingClientRect();
        if (!isFinite(videoDuration) || timelineRect.width <= 0) {
            return;
        }

        const initialMouseX = e.clientX;
        const initialMarkerTimes = { ...selectedQuestion.markers };
        draggedMarkersRef.current = initialMarkerTimes;

        const alternatives = Array.from({ length: questionsManager.currentProject.totalAlternatives }, (_, i) => String.fromCharCode(65 + i));
        const markerIndex = alternatives.indexOf(markerKey);
        const affectedMarkers = alternatives.slice(markerIndex);
        const previousMarkerKey = markerIndex > 0 ? alternatives[markerIndex - 1] : null;

        setMarkerDragState({ isDragging: true, markerKey, tempMarkers: initialMarkerTimes, currentTime: initialMarkerTimes[markerKey] });

        const handleMouseMove = (moveEvent) => {
            latestMouseEventRef.current = moveEvent;
            if (!markerAnimationRef.current) {
                markerAnimationRef.current = requestAnimationFrame(() => {
                    const currentEvent = latestMouseEventRef.current;
                    if (!currentEvent) {
                        markerAnimationRef.current = null;
                        return;
                    }

                    const deltaX = currentEvent.clientX - initialMouseX;
                    const deltaTime = (deltaX / timelineRect.width) * videoDuration;
                    const newMarkers = { ...initialMarkerTimes };
                    const previousMarkerTime = previousMarkerKey ? initialMarkerTimes[previousMarkerKey] : 0;
                    let proposedNewTime = initialMarkerTimes[markerKey] + deltaTime;

                    if (isNaN(proposedNewTime)) {
                        proposedNewTime = initialMarkerTimes[markerKey];
                    }

                    const newAnchorTime = Math.max(previousMarkerTime ?? 0, proposedNewTime);
                    const actualDelta = newAnchorTime - initialMarkerTimes[markerKey];

                    affectedMarkers.forEach(key => {
                        const initialTime = initialMarkerTimes[key];
                        if (initialTime !== null && initialTime !== undefined) {
                            let newTime = initialTime + actualDelta;
                            if (isNaN(newTime)) newTime = initialTime;
                            newMarkers[key] = Math.min(newTime, videoDuration);
                        }
                    });

                    setMarkerDragState(prev => ({ ...prev, tempMarkers: newMarkers, currentTime: newMarkers[markerKey] }));
                    draggedMarkersRef.current = newMarkers;
                    throttledSetCurrentTime(newMarkers[markerKey]);

                    markerAnimationRef.current = null;
                });
            }
        };

        const handleMouseUp = () => {
            if (markerAnimationRef.current) {
                cancelAnimationFrame(markerAnimationRef.current);
                markerAnimationRef.current = null;
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (draggedMarkersRef.current) {
                questionsManager.updateQuestion(selectedQuestion.originalIndex, { markers: draggedMarkersRef.current });
            }

            setMarkerDragState({ isDragging: false, markerKey: null, currentTime: 0, tempMarkers: null });
            draggedMarkersRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

    }, [selectedQuestion, videoPlayerRef, timelineRef, questionsManager, throttledSetCurrentTime]);

    // Toggle cut mode function
    const toggleCutMode = useCallback(() => {
        setSelectionState(prev => ({
            ...prev,
            isSelectionModeActive: !prev.isSelectionModeActive
        }));
        if (!selectionState.isSelectionModeActive) {
            console.log('✂️ Modo de corte ativado');
        } else {
            console.log('✂️ Modo de corte desativado');
            // Reset selection when disabling cut mode
            setSelectionState(prev => ({
                ...prev,
                startTime: 0,
                endTime: 0,
                isSelecting: false
            }));
        }
    }, [selectionState.isSelectionModeActive]);

    // Nudge playhead function for frame-by-frame navigation
    const nudgePlayhead = useCallback((direction) => {
        if (!videoPlayerRef.current) return;

        const video = videoPlayerRef.current;
        const fps = 30; // Default fps if not available
        const frameDuration = 1 / fps;
        const newTime = Math.max(0, Math.min(video.duration, video.currentTime + (direction * frameDuration)));
        
        video.currentTime = newTime;
    }, [videoPlayerRef]);

    // Computed properties for timeline
    const selectionLeft = useMemo(() => {
        if (!videoPlayerRef.current?.duration) return 0;
        return (selectionState.startTime / videoPlayerRef.current.duration) * 100;
    }, [selectionState.startTime, videoPlayerRef.current?.duration]);

    const selectionWidth = useMemo(() => {
        if (!videoPlayerRef.current?.duration) return 0;
        return ((selectionState.endTime - selectionState.startTime) / videoPlayerRef.current.duration) * 100;
    }, [selectionState.startTime, selectionState.endTime, videoPlayerRef.current?.duration]);

    // Set selection time function for time input
    const setSelectionTime = useCallback(({ start, end }) => {
        setSelectionState(prev => ({
            ...prev,
            startTime: start !== undefined ? start : prev.startTime,
            endTime: end !== undefined ? end : prev.endTime
        }));
    }, []);

    // Efeito para lidar com o ajuste fino dos marcadores via teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedMarkerKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) {
                return;
            }

            e.preventDefault();

            const video = videoPlayerRef.current;
            if (!video || !selectedQuestion || !questionsManager) return;

            // Usa o FPS do vídeo para um ajuste preciso de 1 quadro, com um fallback
            const fps = selectedQuestion.videoInfo?.fps || 30;
            const increment = 1 / fps;
            const direction = e.key === 'ArrowRight' ? 1 : -1;
            const deltaTime = increment * direction;

            const alternatives = Array.from({ length: questionsManager.currentProject.totalAlternatives }, (_, i) => String.fromCharCode(65 + i));
            const markerIndex = alternatives.indexOf(selectedMarkerKey);
            const affectedMarkers = alternatives.slice(markerIndex);
            const previousMarkerKey = markerIndex > 0 ? alternatives[markerIndex - 1] : null;

            const currentMarkers = selectedQuestion.markers;
            const newMarkers = { ...currentMarkers };

            const previousMarkerTime = previousMarkerKey ? currentMarkers[previousMarkerKey] : 0;
            const proposedNewTime = currentMarkers[selectedMarkerKey] + deltaTime;

            // Garante que o marcador não ultrapasse o anterior nem os limites do vídeo
            const newAnchorTime = Math.max(previousMarkerTime ?? 0, proposedNewTime);
            const finalNewTime = Math.min(newAnchorTime, video.duration);

            const actualDelta = finalNewTime - currentMarkers[selectedMarkerKey];

            // Aplica o mesmo delta a todos os marcadores afetados
            affectedMarkers.forEach(key => {
                const initialTime = currentMarkers[key];
                if (initialTime !== null && initialTime !== undefined) {
                    const newTime = initialTime + actualDelta;
                    newMarkers[key] = Math.min(newTime, video.duration);
                }
            });

            // Atualiza o estado e o vídeo
            questionsManager.updateQuestion(selectedQuestion.originalIndex, { markers: newMarkers });
            video.currentTime = newMarkers[selectedMarkerKey];
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedMarkerKey, selectedQuestion, questionsManager, videoPlayerRef]);

    // Initialize video editor
    useEffect(() => {
        // Setup components
        setupAdaptiveClickDelay();
        initElectronDetector();

        // Setup event listeners when timeline is ready
        const cleanupPlayhead = setupPlayheadDragging();

        const handleKeyDown = (e) => {
            if (selectionState.isSelectionModeActive) {
                if (e.key === 'Enter') {
                    cutVideo(videoPlayerRef.current.src, selectionState.startTime, selectionState.endTime, questionsManager, selectedQuestion);
                } else if (e.key === 'Escape') {
                    cancelSelection();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Add timeline click listener
        const handleTimelineClick = (e) => startSelection(e);
        if (timelineRef.current) {
            timelineRef.current.addEventListener('mousedown', handleTimelineClick);
        }

        return () => {
            // Clear timers
            if (electronClickDetectorRef.current.timer) {
                clearTimeout(electronClickDetectorRef.current.timer);
            }

            // Remove event listeners
            if (timelineRef.current) {
                timelineRef.current.removeEventListener('mousedown', handleTimelineClick);
            }
            document.removeEventListener('keydown', handleKeyDown);

            // Cleanup handlers
            if (cleanupPlayhead) cleanupPlayhead();

            // Remove global listeners
            document.removeEventListener('mousemove', updateSelection);
            document.removeEventListener('mouseup', endSelection);
            if (handlersRef.current.mouseMove) {
                document.removeEventListener('mousemove', handlersRef.current.mouseMove);
            }
            if (handlersRef.current.mouseUp) {
                document.removeEventListener('mouseup', handlersRef.current.mouseUp);
            }
            if (handlersRef.current.keyboardHandler) {
                document.removeEventListener('keydown', handlersRef.current.keyboardHandler);
            }
        };
    }, [visualManager, selectionState.isSelectionModeActive, selectionState.startTime, selectionState.endTime, videoPlayerRef, questionsManager, selectedQuestion, cutVideo, cancelSelection]);

    // Retornar os métodos necessários para o video editor
    return {
        startSelection,
        startSelectionDrag,
        startHandleDrag,
        startMarkerDrag,
        clearSelection,
        cancelSelection,
        activateCutMode,
        toggleCutMode, // Added missing function
        cutVideo,
        nudgePlayhead, // Added missing function
        selectionState,
        markerDragState,
        isCutting,
        selectedMarkerKey,
        setSelectedMarkerKey,
        startOverlayDrag,
        overlayDragState,
        // Properties needed by Timeline.jsx and VideoControls.jsx
        selectionLeft,
        selectionWidth,
        activeHandle,
        setActiveHandle,
        setSelectionTime, // Added for TimeInput component
        // Direct access to selection mode for Timeline.jsx
        isSelectionModeActive: selectionState.isSelectionModeActive,
        // Direct access to startTime and endTime for VideoControls.jsx
        startTime: selectionState.startTime,
        endTime: selectionState.endTime
    };
};