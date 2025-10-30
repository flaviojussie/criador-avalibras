import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useVideoStateMachine } from '../hooks/useVideoStateMachine';
import { useSelectionVisualization } from '../hooks/useSelectionVisualization';

/**
 * Componente de régua da timeline
 */
const TimelineRuler = ({ duration = 0 }) => {
    if (!duration || duration <= 0) {
        return (
            <div className="h-6 border-b border-[var(--border-color)] relative mb-1 flex items-center justify-center">
                <span className="text-xs text-[var(--text-tertiary)]">Nenhum vídeo carregado</span>
            </div>
        );
    }

    const ticks = [];
    const interval = 5; // Mostrar tick a cada 5 segundos
    const numTicks = Math.ceil(duration / interval);

    for (let i = 0; i <= numTicks; i++) {
        const time = i * interval;
        const position = (time / duration) * 100;
        const isMainTick = i % 2 === 0;

        if (time <= duration) {
            ticks.push(
                <React.Fragment key={i}>
                    <div
                        className={`absolute bottom-0 w-px ${isMainTick ? 'h-2' : 'h-1'} bg-[var(--text-tertiary)] opacity-50`}
                        style={{ left: `${position}%` }}
                    />
                    {isMainTick && (
                        <span
                            className="absolute top-0.5 transform -translate-x-1/2 text-xs text-[var(--text-secondary)]"
                            style={{ left: `${position}%` }}
                        >
                            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                        </span>
                    )}
                </React.Fragment>
            );
        }
    }

    return (
        <div className="h-6 border-b border-[var(--border-color)] relative mb-1">
            {ticks}
        </div>
    );
};

/**
 * Componente de faixa da timeline
 */
const TimelineTrack = ({ children, isMainTrack = false, hint, ...props }) => (
    <div
        className={`relative rounded-[6px] shadow-inner whitespace-nowrap ${
            isMainTrack ? 'h-12 bg-[var(--surface-primary)]' : 'h-10 bg-[var(--surface-tertiary)]'
        } group`}
        {...props}
    >
        {children}
        <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-0 transition-opacity text-xs text-[var(--text-tertiary)] pointer-events-none">
            {hint}
        </div>
    </div>
);

/**
 * Componente principal da Timeline - Versão Refatorada
 */
const TimelineRefactored = forwardRef(({
    videoPlayerRef,
    selectedQuestion,
    overlayManager,
    videoEditor,
    removeMarkerAndSubsequent,
    removeOverlayFromQuestion,
    onOpenOverlayModal
}, ref) => {
    const timelineRef = useRef(null);
    const stateMachine = useVideoStateMachine();
    const selectionViz = useSelectionVisualization(null, videoPlayerRef, timelineRef);

    // Sincronizar visualManager com seleçãoViz
    useEffect(() => {
        if (selectionViz.selectionVisual.isActive) {
            selectionViz.updateSelectionPosition(
                stateMachine.startTime,
                stateMachine.endTime,
                videoPlayerRef.current?.duration || 0
            );
        }
    }, [stateMachine.startTime, stateMachine.endTime, selectionViz, videoPlayerRef]);

    useImperativeHandle(ref, () => {
        if (!timelineRef.current) {
            return null;
        }
        timelineRef.current.selectionViz = selectionViz;
        timelineRef.current.stateMachine = stateMachine;
        return timelineRef.current;
    }, [selectionViz, stateMachine]);

    /**
     * Formata tempo para exibição
     */
    const formatTime = (time) => {
        if (isNaN(time) || time < 0) return '0:00.0';
        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(1);
        return `${minutes}:${seconds.padStart(4, '0')}`;
    };

    /**
     * Formata tempo com milissegundos
     */
    const formatPreciseTime = (time) => {
        if (isNaN(time) || time < 0) return '0:00.000';
        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(3).padStart(6, '0');
        return `${minutes}:${seconds}`;
    };

    /**
     * Lida com clique na timeline
     */
    const handleTimelineClick = (e) => {
        if (!videoPlayerRef.current || !timelineRef.current || videoPlayerRef.current.duration <= 0) {
            return;
        }

        const timelineRect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - timelineRect.left;
        const timelineWidth = timelineRect.width;
        const progress = Math.max(0, Math.min(1, clickX / timelineWidth));
        const newTime = progress * videoPlayerRef.current.duration;

        videoPlayerRef.current.currentTime = newTime;
        selectionViz.syncPlayheadWithVideo();
    };

    /**
     * Lida com duplo clique na timeline
     */
    const handleTimelineDoubleClick = (e) => {
        if (!videoPlayerRef.current || !timelineRef.current) return;

        const timelineRect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - timelineRect.left;
        const timelineWidth = timelineRect.width;
        const percentage = (clickX / timelineWidth) * 100;
        const time = (percentage / 100) * videoPlayerRef.current.duration;

        // Iniciar seleção via state machine
        if (stateMachine.canStartSelection) {
            stateMachine.activateSelection();
            stateMachine.startSelection(time);

            // Atualizar visualização
            selectionViz.showSelection(percentage, 0);
            selectionViz.hidePlayhead();
            selectionViz.hideProgress();
        }
    };

    /**
     * Renderiza marcadores
     */
    const renderMarkers = () => {
        const markersToDisplay = videoEditor?.markerDragState?.isDragging
            ? videoEditor.markerDragState.tempMarkers
            : selectedQuestion?.markers;

        if (!markersToDisplay) return null;

        return Object.entries(markersToDisplay)
            .filter(([key, value]) => value !== null && !isNaN(value))
            .map(([key, value]) => {
                const isSelected = videoEditor?.selectedMarkerKey === key;
                const percentage = (value / (videoPlayerRef.current?.duration || 1)) * 100;

                return (
                    <React.Fragment key={key}>
                        <div
                            className={`marker-item absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 border-2 rounded-full cursor-pointer z-10 transition-all duration-150 ${
                                isSelected ? 'border-yellow-300 scale-110' : 'border-yellow-700'
                            }`}
                            style={{ left: `${percentage}%` }}
                            data-marker-id={key}
                            onClick={(e) => {
                                e.stopPropagation();
                                videoEditor?.setSelectedMarkerKey?.(key);
                            }}
                            onMouseDown={(e) => videoEditor?.startMarkerDrag?.(e, key)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                removeMarkerAndSubsequent?.(selectedQuestion.originalIndex, key);
                            }}
                        >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-1 rounded">
                                {key}
                            </span>
                        </div>
                        {videoEditor?.markerDragState?.isDragging &&
                         videoEditor?.markerDragState?.markerKey === key && (
                            <div
                                className="absolute top-full -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-20"
                                style={{
                                    left: `${percentage}%`,
                                    transform: 'translateX(-50%) translateY(8px)'
                                }}
                            >
                                {formatTime(videoEditor.markerDragState.currentTime)}
                            </div>
                        )}
                    </React.Fragment>
                );
            });
    };

    /**
     * Renderiza overlays
     */
    const renderOverlays = () => {
        if (!selectedQuestion?.overlays) return null;

        return selectedQuestion.overlays.map(overlay => {
            let currentOverlayStartTime = overlay.startTime;

            if (videoEditor?.overlayDragState?.isDragging &&
                videoEditor?.overlayDragState?.updatedOverlays?.[overlay.id]) {
                currentOverlayStartTime = videoEditor.overlayDragState.updatedOverlays[overlay.id];
            } else if (videoEditor?.overlayDragState?.isDragging &&
                       videoEditor?.overlayDragState?.overlayId === overlay.id) {
                currentOverlayStartTime = videoEditor.overlayDragState.currentTime;
            }

            const duration = videoPlayerRef?.current?.duration || 0;
            const safeDuration = isFinite(duration) && duration > 0 ? duration : 1;
            const left = (currentOverlayStartTime / safeDuration) * 100;
            const width = (overlay.duration / safeDuration) * 100;

            const isDragging = videoEditor?.overlayDragState?.isDragging &&
                              videoEditor?.overlayDragState?.overlayId === overlay.id;

            return (
                <React.Fragment key={overlay.id}>
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 h-3/4 ${}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onMouseDown={(e) => videoEditor?.startOverlayDrag?.(e, overlay)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            removeOverlayFromQuestion?.(selectedQuestion.originalIndex, overlay.id);
                        }}
                        onDoubleClick={() => onOpenOverlayModal?.(overlay)}
                    />
                    {isDragging && (
                        <div
                            className="absolute top-full -translate-y-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-20 transition-all duration-150 shadow-lg"
                            style={{
                                left: `${left}%`,
                                transform: 'translateX(-50%) translateY(8px)'
                            }}
                        >
                            {formatTime(currentOverlayStartTime)}
                        </div>
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <div ref={timelineRef} className="flex-shrink-0 p-1">
            <div className="cursor-crosshair relative overflow-hidden">
                {/* Régua de tempo */}
                <TimelineRuler duration={videoPlayerRef?.current?.duration || 0} />

                {/* Faixas da timeline */}
                <div className="space-y-1">
                    {/* Faixa principal de vídeo */}
                    <TimelineTrack
                        isMainTrack={true}
                        hint="Duplo clique para selecionar trecho de corte"
                        onDoubleClick={handleTimelineDoubleClick}
                        onClick={handleTimelineClick}
                    >
                        {/* Progresso do vídeo */}
                        <div
                            className="timeline-progress absolute top-0 left-0 h-full bg-blue-500/20"
                            style={{ width: `${selectionViz.progressVisual.width}%` }}
                        />

                        {/* Playhead */}
                        <div
                            className="playhead absolute top-0 h-full w-0.5 bg-red-500"
                            style={{ left: `${selectionViz.playheadVisual.position}%` }}
                        />

                        {/* Área de seleção */}
                        {stateMachine.isSelectionModeActive && (
                            <div
                                className="selection-area absolute top-0 h-full bg-blue-500/30 border-x-2 border-blue-500"
                                style={{
                                    left: `${selectionViz.selectionVisual.left}%`,
                                    width: `${selectionViz.selectionVisual.width}%`,
                                    display: selectionViz.selectionVisual.display,
                                    opacity: selectionViz.selectionVisual.opacity
                                }}
                            />
                        )}
                    </TimelineTrack>

                    {/* Faixa de marcadores */}
                    <TimelineTrack hint="Arraste para mover marcadores existentes">
                        {renderMarkers()}
                    </TimelineTrack>

                    {/* Faixa de overlays */}
                    <TimelineTrack hint="Clique para selecionar e editar segmentos">
                        {renderOverlays()}
                    </TimelineTrack>
                </div>
            </div>

            {/* Informações de tempo */}
            <div className="flex justify-between items-center text-xs mt-2 px-1 text-[var(--text-secondary)]">
                <span className="font-mono text-[var(--text-primary)]">
                    {videoPlayerRef?.current?.currentTime ?
                        formatPreciseTime(videoPlayerRef.current.currentTime) :
                        '0:00.000'
                    }
                </span>
                <span>
                    Duração:
                    <span className="font-mono text-[var(--text-primary)] ml-1">
                        {videoPlayerRef?.current?.duration ?
                            formatPreciseTime(videoPlayerRef.current.duration) :
                            '0:00.000'
                        }
                    </span>
                </span>
            </div>

            {/* Feedback visual da seleção */}
            {stateMachine.isSelectionModeActive && stateMachine.startTime > 0 && (
                <div className="flex justify-center items-center text-xs mt-1 px-1 text-[var(--accent-primary)] font-mono bg-[var(--surface-secondary)] rounded py-1">
                    <span className="font-semibold">Seleção:</span>
                    <span className="ml-1 text-[var(--text-primary)]">
                        {formatTime(stateMachine.startTime)} - {formatTime(stateMachine.endTime)}
                    </span>
                    <span className="ml-2 text-[var(--text-secondary)]">
                        (Duração: {formatTime(stateMachine.selectionDuration)})
                    </span>
                </div>
            )}
        </div>
    );
});

TimelineRefactored.displayName = 'TimelineRefactored';

export default TimelineRefactored;