import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useVisualManager } from './useVisualManager';

export const useVideoEditor = (videoPlayerRef, questionsManager, selectedQuestion, handleMarkerTimeUpdate) => {
    // --- Refs for DOM Elements ---
    const playheadRef = useRef(null);
    const progressRef = useRef(null);
    const selectionAreaRef = useRef(null);
    const timelineTrackRef = useRef(null);
    const bodyRef = useRef(document.body);

    // --- State Management ---
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [selectionState, setSelectionState] = useState({
        startTime: 0,
        endTime: 0,
        isSelecting: false,
        isDraggingHandle: null,
        isSelectionModeActive: false,
        isDraggingPlayhead: false,
        initialTime: 0,
    });
    const [isCutting, setIsCutting] = useState(false);
    const [markerDragState, setMarkerDragState] = useState({ isDragging: false, markerKey: null, currentTime: 0, tempMarkers: null });
    const draggedMarkersRef = useRef(null);
    const [selectedMarkerKey, setSelectedMarkerKey] = useState(null);
    const [activeHandle, setActiveHandle] = useState(null);
    const [overlayDragState, setOverlayDragState] = useState({ isDragging: false, overlayId: null, currentTime: 0 });
    const draggedOverlayTimeRef = useRef(0);
    const overlayDragDataRef = useRef(null);
    const rafIdRef = useRef(null);
    const latestMouseEventRef = useRef(null);
    const markerAnimationRef = useRef(null);

    // --- Computed values for rendering ---
    const selectionLeft = useMemo(() => {
        if (!videoPlayerRef.current?.duration) return 0;
        return (selectionState.startTime / videoPlayerRef.current.duration) * 100;
    }, [selectionState.startTime, videoPlayerRef.current?.duration]);

    const selectionWidth = useMemo(() => {
        if (!videoPlayerRef.current?.duration) return 0;
        return ((selectionState.endTime - selectionState.startTime) / videoPlayerRef.current.duration) * 100;
    }, [selectionState.startTime, selectionState.endTime, videoPlayerRef.current?.duration]);

    // --- Visual State Construction ---
    const visualState = useMemo(() => ({
        playhead: { position: playheadPosition, display: selectionState.isSelectionModeActive ? 'none' : 'block', isDragging: selectionState.isDraggingPlayhead },
        progress: { width: playheadPosition },
        selection: { left: selectionLeft, width: selectionWidth, display: selectionState.isSelectionModeActive ? 'block' : 'none', isActive: selectionState.isSelecting || selectionState.isSelectionModeActive, isMoving: !!selectionState.isDraggingHandle },
        timeline: { isSelecting: selectionState.isSelecting },
        body: { cursor: 'default' },
    }), [playheadPosition, selectionState, selectionLeft, selectionWidth]);

    const visualElements = { playheadRef, progressRef, selectionAreaRef, timelineTrackRef, bodyRef };

    // --- Hook Calls ---
    useVisualManager(visualElements, visualState);

    // --- Logic ---
    useEffect(() => {
        const video = videoPlayerRef.current;
        if (!video) return;
        const handleTimeUpdate = () => {
            if (video.duration) {
                setPlayheadPosition((video.currentTime / video.duration) * 100);
            }
        };
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [videoPlayerRef]);

    const throttledSetCurrentTime = useCallback((time) => {
        if (!videoPlayerRef.current) return;
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
            if (videoPlayerRef.current) {
                videoPlayerRef.current.currentTime = time;
            }
        });
    }, [videoPlayerRef]);

    const getClickPosition = useCallback((e) => {
        if (!timelineTrackRef.current || !videoPlayerRef.current?.duration) return null;
        const rect = timelineTrackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const time = percentage * videoPlayerRef.current.duration;
        return { percentage: percentage * 100, time };
    }, [videoPlayerRef]);

    const clearSelection = useCallback(() => {
        setSelectionState({ startTime: 0, endTime: 0, isSelecting: false, isDraggingHandle: null, isSelectionModeActive: false, isDraggingPlayhead: false, initialTime: 0 });
    }, []);

    const cutVideo = useCallback(async () => {
        if (!videoPlayerRef.current?.src || !selectedQuestion) return;
        const videoURL = videoPlayerRef.current.src;
        const videoPath = videoURL.startsWith('http') ? decodeURIComponent(videoURL.substring(videoURL.lastIndexOf('/') + 1)) : videoURL;
        setIsCutting(true);
        try {
            const result = await window.electronAPI.video.cutVideo(videoPath, selectionState.startTime, selectionState.endTime);
            const newVideoPath = result?.processedPath || result;
            if (newVideoPath) {
                questionsManager.updateQuestion(selectedQuestion.originalIndex, { video: newVideoPath });
            }
        } catch (error) {
            console.error('❌ Erro ao cortar o vídeo:', error);
        } finally {
            setIsCutting(false);
            clearSelection();
        }
    }, [selectionState.startTime, selectionState.endTime, videoPlayerRef, questionsManager, selectedQuestion, clearSelection]);

    const startMarkerDrag = useCallback((e, markerKey) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedQuestion || !videoPlayerRef.current || !timelineTrackRef.current) return;
        const videoDuration = videoPlayerRef.current.duration;
        const timelineRect = timelineTrackRef.current.getBoundingClientRect();
        if (!isFinite(videoDuration) || timelineRect.width <= 0) return;

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
                    if (!currentEvent) { markerAnimationRef.current = null; return; }

                    const deltaX = currentEvent.clientX - initialMouseX;
                    const deltaTime = (deltaX / timelineRect.width) * videoDuration;
                    const newMarkers = { ...initialMarkerTimes };
                    const previousMarkerTime = previousMarkerKey ? initialMarkerTimes[previousMarkerKey] : 0;
                    let proposedNewTime = initialMarkerTimes[markerKey] + deltaTime;
                    if (isNaN(proposedNewTime)) proposedNewTime = initialMarkerTimes[markerKey];

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
            if (markerAnimationRef.current) { cancelAnimationFrame(markerAnimationRef.current); markerAnimationRef.current = null; }
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
    }, [selectedQuestion, videoPlayerRef, timelineTrackRef, questionsManager, throttledSetCurrentTime]);

    const startHandleDrag = useCallback((e, handle) => {
        e.stopPropagation();
        setSelectionState(prev => ({ ...prev, isDraggingHandle: handle }));

        const handleMouseMove = (moveEvent) => {
            const pos = getClickPosition(moveEvent);
            if (!pos) return;

            throttledSetCurrentTime(pos.time);

            setSelectionState(prev => {
                if (handle === 'start') {
                    const endTime = Math.max(pos.time, prev.endTime);
                    return { ...prev, startTime: Math.min(pos.time, prev.endTime), endTime };
                } else { // handle === 'end'
                    const startTime = Math.min(pos.time, prev.startTime);
                    return { ...prev, startTime, endTime: Math.max(pos.time, prev.startTime) };
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
    }, [getClickPosition, throttledSetCurrentTime]);

    const startSelectionDrag = useCallback((e) => {
        e.stopPropagation();
        const initialStartTime = selectionState.startTime;
        const selectionDuration = selectionState.endTime - selectionState.startTime;
        const initialPos = getClickPosition(e);
        if (!initialPos) return;

        const handleMouseMove = (moveEvent) => {
            const currentPos = getClickPosition(moveEvent);
            if (!currentPos || !videoPlayerRef.current?.duration) return;

            const deltaTime = currentPos.time - initialPos.time;
            let newStartTime = initialStartTime + deltaTime;

            // Clamp to video bounds
            newStartTime = Math.max(0, newStartTime);
            newStartTime = Math.min(newStartTime, videoPlayerRef.current.duration - selectionDuration);
            
            const newEndTime = newStartTime + selectionDuration;

            setSelectionState(prev => ({ ...prev, startTime: newStartTime, endTime: newEndTime }));
            throttledSetCurrentTime(newStartTime);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [selectionState.startTime, selectionState.endTime, getClickPosition, videoPlayerRef, throttledSetCurrentTime]);

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                if (selectionState.isSelectionModeActive) {
                    e.preventDefault();
                    clearSelection();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectionState.isSelectionModeActive, clearSelection]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedMarkerKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
            e.preventDefault();
            const video = videoPlayerRef.current;
            if (!video || !selectedQuestion || !questionsManager || !handleMarkerTimeUpdate) return;

            const fps = selectedQuestion.videoInfo?.fps || 30;
            const increment = 1 / fps;
            const direction = e.key === 'ArrowRight' ? 1 : -1;
            const newTime = (selectedQuestion.markers[selectedMarkerKey] || 0) + (increment * direction);
            
            handleMarkerTimeUpdate(selectedMarkerKey, newTime);
            video.currentTime = newTime;
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedMarkerKey, selectedQuestion, questionsManager, videoPlayerRef, handleMarkerTimeUpdate]);

    // --- Main useEffect for event listeners ---
    useEffect(() => {
        const timelineEl = timelineTrackRef.current;
        const playheadEl = playheadRef.current;

        const handleTimelineMouseDown = (e) => {
            if (e.target.closest('.selection-area, .marker-item, .overlay-segment')) return;
            const pos = getClickPosition(e);
            if (pos) {
                setSelectionState(prev => ({ ...prev, isSelecting: true, isSelectionModeActive: true, startTime: pos.time, endTime: pos.time, initialTime: pos.time }));
            }
        };

        const handleSelectionDrag = (e) => {
            const pos = getClickPosition(e);
            if (pos) {
                setSelectionState(prev => ({ ...prev, startTime: Math.min(prev.initialTime, pos.time), endTime: Math.max(prev.initialTime, pos.time) }));
            }
        };

        const handlePlayheadMouseDown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (selectionState.isSelectionModeActive) return;
            setSelectionState(prev => ({ ...prev, isDraggingPlayhead: true }));
        };

        const handlePlayheadDrag = (e) => {
            const pos = getClickPosition(e);
            if (pos) { throttledSetCurrentTime(pos.time); }
        };

        const handleMouseUpGlobal = () => {
            setSelectionState(prev => ({ ...prev, isSelecting: false, isDraggingPlayhead: false }));
        };

        if (timelineEl) timelineEl.addEventListener('mousedown', handleTimelineMouseDown);
        if (playheadEl) playheadEl.addEventListener('mousedown', handlePlayheadMouseDown);

        if (selectionState.isSelecting) {
            document.addEventListener('mousemove', handleSelectionDrag);
            document.addEventListener('mouseup', handleMouseUpGlobal);
        } else if (selectionState.isDraggingPlayhead) {
            document.addEventListener('mousemove', handlePlayheadDrag);
            document.addEventListener('mouseup', handleMouseUpGlobal);
        }

        return () => {
            if (timelineEl) timelineEl.removeEventListener('mousedown', handleTimelineMouseDown);
            if (playheadEl) playheadEl.removeEventListener('mousedown', handlePlayheadMouseDown);
            document.removeEventListener('mousemove', handleSelectionDrag);
            document.removeEventListener('mousemove', handlePlayheadDrag);
            document.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }, [selectionState.isSelecting, selectionState.isDraggingPlayhead, getClickPosition, throttledSetCurrentTime]);

    return {
        isSelectionModeActive: selectionState.isSelectionModeActive,
        isCutting,
        selectionLeft,
        selectionWidth,
        playheadPosition,
        progressPosition: playheadPosition,
        startTime: selectionState.startTime,
        endTime: selectionState.endTime,
        activeHandle,
        markerDragState,
        overlayDragState,
        selectedMarkerKey,
        cutVideo,
        clearSelection,
        setSelectionTime: (times) => setSelectionState(prev => ({ ...prev, ...times })),
        setActiveHandle,
        setSelectedMarkerKey,
        startMarkerDrag,
        startOverlayDrag: () => console.warn('startOverlayDrag not fully refactored'),
        startHandleDrag,
        startSelectionDrag,
        playheadRef,
        progressRef,
        selectionAreaRef,
        timelineTrackRef,
    };
};