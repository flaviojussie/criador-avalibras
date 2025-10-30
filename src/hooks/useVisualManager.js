import { useState, useCallback, useRef, useEffect } from 'react';
import { devLog } from '../utils/devLog.js';

export const useVisualManager = () => {
    // Initial state based on the original VisualStateManager
    const initialState = {
        // Playhead state
        playhead: {
            position: 0, // percentage (0-100)
            display: 'block',
            isDragging: false,
            isHidden: false,
            cursor: 'grab'
        },

        // Progress bar state
        progress: {
            width: 0, // percentage (0-100)
            display: 'block',
            isHidden: false
        },

        // Selection state
        selection: {
            left: 0, // percentage (0-100)
            width: 0, // percentage (0-100)
            display: 'none',
            isActive: false,
            isSelectionMode: false,
            isMoving: false
        },

        // Timeline state
        timeline: {
            cursor: 'default',
            isSelecting: false,
            interactionState: 'idle'
        },

        // Markers and overlays state
        markers: new Map(),
        overlays: new Map(),

        // Body state
        body: {
            cursor: 'default'
        },

        // Performance flags
        transitionEnabled: true,
        batchUpdatePending: false
    };

    const [state, setState] = useState(initialState);
    const elementsRef = useRef({
        playhead: null,
        progress: null,
        selectionArea: null,
        timelineTrack: null,
        body: document.body
    });

    const batchUpdateRef = useRef(null);
    const mutationObserverRef = useRef(null);

    // Cache DOM elements
    const cacheElements = useCallback(() => {
        // Safety check - ensure document is ready
        if (typeof document === 'undefined') {
            devLog('📦 Document não disponível para cache de elementos');
            return;
        }

        const playhead = document.querySelector('.playhead');
        const progress = document.querySelector('.timeline-progress');
        const selectionArea = document.querySelector('.selection-area');
        const timelineTrack = document.querySelector('.timeline-track');

        console.log('🔍 DEBUG: cacheElements - playhead encontrado:', !!playhead);
        console.log('🔍 DEBUG: cacheElements - progress encontrado:', !!progress);
        console.log('🔍 DEBUG: cacheElements - selectionArea encontrado:', !!selectionArea);
        console.log('🔍 DEBUG: cacheElements - timelineTrack encontrado:', !!timelineTrack);

        elementsRef.current = {
            playhead,
            progress,
            selectionArea,
            timelineTrack,
            body: document.body
        };
        devLog('📦 Elementos DOM cacheados:',
            Object.keys(elementsRef.current).filter(k => elementsRef.current[k]));
    }, []);

    // Main state update method
    const updateState = useCallback((updates, batch = false) => {
        if (batch) {
            // Batch update for performance
            if (!batchUpdateRef.current) {
                batchUpdateRef.current = requestAnimationFrame(() => {
                    setState(prevState => {
                        const newState = { ...prevState };
                        applyStateUpdates(newState, updates);
                        return newState;
                    });
                    batchUpdateRef.current = null;
                });
            } else {
                // Queue another update
                setState(prevState => {
                    const newState = { ...prevState };
                    applyStateUpdates(newState, updates);
                    return newState;
                });
            }
        } else {
            setState(prevState => {
                const newState = { ...prevState };
                applyStateUpdates(newState, updates);
                return newState;
            });
        }
    }, []);

    // Apply state updates helper
    const applyStateUpdates = (state, updates) => {
        if (updates.playhead) {
            state.playhead = { ...state.playhead, ...updates.playhead };
        }
        if (updates.progress) {
            state.progress = { ...state.progress, ...updates.progress };
        }
        if (updates.selection) {
            state.selection = { ...state.selection, ...updates.selection };
        }
        if (updates.timeline) {
            state.timeline = { ...state.timeline, ...updates.timeline };
        }
        if (updates.body) {
            state.body = { ...state.body, ...updates.body };
        }
        if (updates.markers) {
            updates.markers.forEach((data, id) => {
                state.markers.set(id, { ...state.markers.get(id), ...data });
            });
        }
        if (updates.overlays) {
            updates.overlays.forEach((data, id) => {
                state.overlays.set(id, { ...state.overlays.get(id), ...data });
            });
        }
    };

    // Apply state to DOM
    const applyStateToDOM = useCallback(() => {
        // Safety check - ensure elementsRef is available
        if (!elementsRef.current) {
            return;
        }

        const { elements } = elementsRef.current;

        // Apply playhead state
        if (elements?.playhead) {
            const { playhead } = state;
            setCSSProperty('--playhead-position', `${playhead.position}%`);
            setCSSProperty('--playhead-display', playhead.display);
            toggleClass(elements.playhead, 'dragging', playhead.isDragging);
            toggleClass(elements.playhead, 'hidden', playhead.isHidden);
            toggleClass(elements.playhead, 'hover', playhead.cursor === 'grab' && !playhead.isDragging);
            toggleClass(elements.playhead, 'grabbing', playhead.cursor === 'grabbing');
        }

        // Apply progress state
        if (elements?.progress) {
            const { progress } = state;
            setCSSProperty('--progress-width', `${progress.width}%`);
            setCSSProperty('--progress-display', progress.display);
            toggleClass(elements.progress, 'hidden', progress.isHidden);
        }

        // Apply selection state
        if (elements?.selectionArea) {
            const { selection } = state;
            console.log('🔍 DEBUG: useVisualManager - Aplicando estado de seleção ao DOM:', selection);
            console.log('🔍 DEBUG: useVisualManager - Elemento selectionArea encontrado:', elements.selectionArea);
            setCSSProperty('--selection-left', `${selection.left}%`);
            setCSSProperty('--selection-width', `${selection.width}%`);
            setCSSProperty('--selection-display', selection.display);
            toggleClass(elements.selectionArea, 'active', selection.isActive);
            toggleClass(elements.selectionArea, 'moving', selection.isMoving);
        } else {
            console.log('❌ DEBUG: useVisualManager - Elemento selectionArea NÃO encontrado no DOM');
        }

        // Apply timeline state
        if (elements?.timelineTrack) {
            const { timeline } = state;
            document.body.setAttribute('data-interaction-state', timeline.interactionState || 'idle');
            setCSSProperty('--cursor-state', timeline.cursor);
            toggleClass(elements.timelineTrack, 'selecting', timeline.isSelecting);
            toggleClass(elements.timelineTrack, 'selection-mode', timeline.isSelectionMode);
        }

        // Apply body state
        if (elements?.body) {
            const { body } = state;
            elements.body.classList.remove('cursor-grabbing', 'cursor-ew-resize', 'cursor-col-resize', 'cursor-row-resize');
            if (body.cursor !== 'default') {
                elements.body.classList.add(`cursor-${body.cursor}`);
            }
        }

        // Apply marker states
        state.markers.forEach((markerData, id) => {
            const markerEl = document.querySelector(`[data-marker-id="${id}"]`) ||
                           document.getElementById(`marker-${id}`);
            if (markerEl) {
                toggleClass(markerEl, 'selected', markerData.selected);
                toggleClass(markerEl, 'dragging', markerData.dragging);
                toggleClass(markerEl, 'disabled', markerData.disabled);
            }
        });

        // Apply overlay states
        state.overlays.forEach((overlayData, id) => {
            const overlayEl = document.querySelector(`[data-overlay-id="${id}"]`) ||
                           document.getElementById(`overlay-${id}`);
            if (overlayEl) {
                setCSSProperty('--overlay-left', `${overlayData.left}%`);
                setCSSProperty('--overlay-width', `${overlayData.width}%`);
                toggleClass(overlayEl, 'active', overlayData.active);
                toggleClass(overlayEl, 'dragging', overlayData.dragging);
                toggleClass(overlayEl, 'disabled', overlayData.disabled);
            }
        });
    }, [state]);

    // Utility functions
    const setCSSProperty = useCallback((property, value) => {
        // Safety check - ensure document is available
        if (typeof document === 'undefined' || !document.documentElement) {
            return;
        }

        const root = document.documentElement;
        if (root.style.setProperty) {
            root.style.setProperty(property, value);
        }
    }, []);

    const toggleClass = useCallback((element, className, force) => {
        if (!element) return;
        if (force === undefined) {
            element.classList.toggle(className);
        } else if (force) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }, []);

    // Convenience methods for specific state updates
    const updatePlayhead = useCallback((updates) => {
        updateState({ playhead: updates });
    }, [updateState]);

    const updateProgress = useCallback((updates) => {
        updateState({ progress: updates });
    }, [updateState]);

    const updateSelection = useCallback((updates) => {
        console.log('🔍 DEBUG: useVisualManager.updateSelection chamado com:', updates);
        updateState({ selection: updates });
    }, [updateState]);

    const updateTimeline = useCallback((updates) => {
        updateState({ timeline: updates });
    }, [updateState]);

    const updateBody = useCallback((updates) => {
        updateState({ body: updates });
    }, [updateState]);

    const updateMarker = useCallback((id, updates) => {
        const markers = new Map();
        markers.set(id, updates);
        updateState({ markers });
    }, [updateState]);

    const updateOverlay = useCallback((id, updates) => {
        const overlays = new Map();
        overlays.set(id, updates);
        updateState({ overlays });
    }, [updateState]);

    // Batch update method
    const batchUpdate = useCallback((updates) => {
        updateState(updates, true);
    }, [updateState]);

    // Performance control
    const setTransitionEnabled = useCallback((enabled) => {
        const root = document.documentElement;
        root.style.setProperty('--state-transition', enabled ?
            'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none');
        updateState({ transitionEnabled: enabled });
    }, [updateState]);

    // Setup mutation observer
    const setupMutationObserver = useCallback(() => {
        if (typeof MutationObserver !== 'undefined') {
            mutationObserverRef.current = new MutationObserver((mutations) => {
                // Only recache elements if DOM changed significantly for timeline elements
                let shouldRecache = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        // Check if relevant timeline elements were added/removed
                        const addedNodes = Array.from(mutation.addedNodes);
                        const removedNodes = Array.from(mutation.removedNodes);

                        const relevantChanges = [...addedNodes, ...removedNodes].some(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                return node.classList?.contains('timeline-track') ||
                                       node.classList?.contains('playhead') ||
                                       node.classList?.contains('timeline-progress') ||
                                       node.classList?.contains('selection-area') ||
                                       node.querySelector?.('.timeline-track, .playhead, .timeline-progress, .selection-area');
                            }
                            return false;
                        });

                        if (relevantChanges) {
                            shouldRecache = true;
                        }
                    }
                });

                if (shouldRecache) {
                    cacheElements();
                }
            });

            mutationObserverRef.current.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }, [cacheElements]);

    // Initialize
    useEffect(() => {
        devLog('🎯 Inicializando useVisualManager...');

        // Delay initialization to ensure DOM is ready
        const initTimer = setTimeout(() => {
            cacheElements();
            setupMutationObserver();
            applyStateToDOM();
            devLog('✅ useVisualManager inicializado com sucesso');
        }, 100);

        return () => {
            devLog('🧹 Limpando useVisualManager...');

            // Clear initialization timer
            clearTimeout(initTimer);

            // Clear mutation observer
            if (mutationObserverRef.current) {
                mutationObserverRef.current.disconnect();
            }

            // Clear batch update
            if (batchUpdateRef.current) {
                cancelAnimationFrame(batchUpdateRef.current);
            }

            devLog('✅ useVisualManager limpo');
        };
    }, []);

    // Apply state changes to DOM whenever state updates
    useEffect(() => {
        // Only apply DOM changes if elements are cached
        if (elementsRef.current) {
            applyStateToDOM();
        }
    }, [state, applyStateToDOM]);

    return {
        // Current state
        state,

        // Update methods
        updateState,
        updatePlayhead,
        updateProgress,
        updateSelection,
        updateTimeline,
        updateBody,
        updateMarker,
        updateOverlay,
        batchUpdate,

        // Performance control
        setTransitionEnabled,

        // Utility methods
        cacheElements,
        setCSSProperty,
        toggleClass
    };
};