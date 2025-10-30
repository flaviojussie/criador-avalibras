import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

const TimeInput = React.memo(({ time, onChange }) => {
    const [displayTime, setDisplayTime] = useState("00:00.000");

    useEffect(() => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const milliseconds = Math.round((time - Math.floor(time)) * 1000);
        setDisplayTime(
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
        );
    }, [time]);

    const handleBlur = (e) => {
        const input = e.target.value;
        const parts = input.split(/[:.]/);
        let seconds = 0;
        try {
            if (parts.length === 3) { // MM:SS.ms
                seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
            } else if (parts.length === 2) { // SS.ms
                seconds = parseInt(parts[0], 10) + parseInt(parts[1], 10) / 1000;
            } else if (parts.length === 1) { // seconds
                seconds = parseFloat(parts[0]);
            }
            if (!isNaN(seconds)) {
                onChange(seconds);
            }
        } catch (error) {
            console.error("Invalid time format");
        }
    };

    const handleChange = (e) => {
        setDisplayTime(e.target.value);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur(e);
            e.target.blur();
        }
    };

    return (
        <input
            type="text"
            value={displayTime}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-gray-800 font-mono w-24 text-center rounded-md border border-gray-700 focus:border-yellow-400 focus:ring-0 outline-none"
        />
    );
});

const TimelineRuler = React.memo(({ duration = 0 }) => {
    if (!duration || duration <= 0) {
        return (
            <div className="h-6 border-b border-[var(--border-color)] relative mb-1 flex items-center justify-center">
                <span className="text-xs text-[var(--text-tertiary)]">Nenhum vídeo carregado</span>
            </div>
        );
    }

    const ticks = [];
    const interval = 5;
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
});

const TimelineTrackComponent = ({ children, isMainTrack = false, hint }) => {
    return (
        <div className={`timeline-track relative rounded-[6px] shadow-inner ${isMainTrack ? 'h-12 bg-[var(--surface-primary)]' : 'h-10 bg-[var(--surface-tertiary)]'} group`}>
            {children}
            <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-0 transition-opacity text-xs text-[var(--text-tertiary)] pointer-events-none">
                {hint}
            </div>
        </div>
    );
};

const TimelineTrack = React.memo(TimelineTrackComponent);

const Timeline = forwardRef(({ 
    videoPlayerRef, 
    selectedQuestion, 
    overlayManager, 
    videoEditor, 
    removeMarkerAndSubsequent, 
    removeOverlayFromQuestion, 
    onOpenOverlayModal, 
    playheadPosition, 
    progressPosition, 
    onUpdateMarkerTime
}, ref) => {
    const timelineRef = useRef(null);

    useImperativeHandle(ref, () => timelineRef.current);

    useEffect(() => {
        if (timelineRef.current && overlayManager && selectedQuestion) {
            // Lógica de overlay pode ser mantida se necessário
        }
    }, [overlayManager, selectedQuestion]);

    const markersToDisplay = videoEditor.markerDragState.isDragging
        ? videoEditor.markerDragState.tempMarkers
        : selectedQuestion?.markers;

    const formatTime = (time) => {
        if (isNaN(time) || time < 0) return '0:00.0';
        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(1);
        return `${minutes}:${seconds.padStart(4, '0')}`;
    };

    
    console.log('🔍 DEBUG: Timeline renderizado - isSelectionModeActive:', videoEditor.isSelectionModeActive, 'selectionLeft:', videoEditor.selectionLeft, 'selectionWidth:', videoEditor.selectionWidth);
    
    return (
        <div ref={timelineRef} className="flex-shrink-0 p-1">
            <div className="cursor-crosshair relative overflow-hidden">
                <TimelineRuler duration={videoPlayerRef?.current?.duration || 0} />

                <div className="space-y-1">
                    <TimelineTrack isMainTrack={true} hint="Arraste para controlar o tempo de reprodução">
                        {!videoEditor.isSelectionModeActive && (
                            <div className="timeline-progress absolute top-0 left-0 h-full bg-blue-500/20" style={{ width: `${progressPosition}%` }}></div>
                        )}
                        {!videoEditor.isSelectionModeActive && (
                            <div className="playhead absolute top-0 h-full w-0.5 bg-red-500" style={{ left: `${playheadPosition}%` }}></div>
                        )}
                        {videoEditor.isSelectionModeActive && (
                            <div
                                className="selection-area absolute top-0 h-full"
                                style={{
                                    left: `${videoEditor.selectionLeft}%`,
                                    width: `${videoEditor.selectionWidth}%`,
                                    backgroundColor: 'rgba(59, 130, 246, 0.3)', // bg-blue-500/30
                                    borderLeft: '2px solid rgba(59, 130, 246, 1)', // border-blue-500
                                    borderRight: '2px solid rgba(59, 130, 246, 1)' // border-blue-500
                                }}
                                onMouseDown={(e) => videoEditor.startSelectionDrag(e)}
                            >
                                <div
                                    className={`selection-start absolute top-0 left-0 w-2 h-full bg-blue-700 cursor-ew-resize ${videoEditor.activeHandle === 'start' ? 'border-2 border-yellow-400' : ''}`}
                                    onMouseDown={(e) => videoEditor.startHandleDrag(e, 'start')}
                                    onClick={(e) => { e.stopPropagation(); videoEditor.setActiveHandle('start'); }}
                                ></div>
                                <div
                                    className={`selection-end absolute top-0 right-0 w-2 h-full bg-blue-700 cursor-ew-resize ${videoEditor.activeHandle === 'end' ? 'border-2 border-yellow-400' : ''}`}
                                    onMouseDown={(e) => videoEditor.startHandleDrag(e, 'end')}
                                    onClick={(e) => { e.stopPropagation(); videoEditor.setActiveHandle('end'); }}
                                ></div>
                            </div>
                        )}
                    </TimelineTrack>

                    <TimelineTrack hint="Arraste para mover marcadores existentes">
                        {markersToDisplay && Object.entries(markersToDisplay)
                            .filter(([key, value]) => value !== null && !isNaN(value))
                            .map(([key, value]) => {
                                const isSelected = videoEditor.selectedMarkerKey === key;
                                return (
                                    <React.Fragment key={key}>
                                        <div
                                            className={`marker-item absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 border-2 rounded-full cursor-pointer z-10 transition-all duration-150 ${isSelected ? 'border-yellow-300 scale-110' : 'border-yellow-700'}`}
                                            style={{ left: `${(value / videoPlayerRef?.current?.duration) * 100}%` }}
                                            data-marker-id={key}
                                            onClick={(e) => { e.stopPropagation(); videoEditor.setSelectedMarkerKey(key); }}
                                            onMouseDown={(e) => videoEditor.startMarkerDrag(e, key)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                removeMarkerAndSubsequent(selectedQuestion.originalIndex, key);
                                            }}
                                        >
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-1 rounded">{key}</span>
                                        </div>
                                        {videoEditor.markerDragState.isDragging && videoEditor.markerDragState.markerKey === key && (
                                            <div className="absolute top-full -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-20"
                                                style={{
                                                    left: `${(value / videoPlayerRef?.current?.duration) * 100}%`,
                                                    transform: 'translateX(-50%) translateY(8px)'
                                                }}
                                            >
                                                {formatTime(videoEditor.markerDragState.currentTime)}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                    </TimelineTrack>

                    <TimelineTrack hint="Clique para selecionar e editar segmentos">
                        {selectedQuestion?.overlays?.map(overlay => {
                            // Simplificar: usar tempo do arrasto apenas para o overlay sendo movido
                            const currentOverlayStartTime = videoEditor.overlayDragState.isDragging &&
                                videoEditor.overlayDragState.overlayId === overlay.id
                                ? videoEditor.overlayDragState.currentTime
                                : overlay.startTime;

                            const duration = videoPlayerRef?.current?.duration || 0;
                            const safeDuration = isFinite(duration) && duration > 0 ? duration : 1; // Evita divisão por zero/NaN

                            // Verificar se este overlay está sendo arrastado
                            const isDragging = videoEditor.overlayDragState.isDragging &&
                                videoEditor.overlayDragState.overlayId === overlay.id;

                            return (
                                <React.Fragment key={overlay.id}>
                                    <div
                                        className={`absolute top-1/2 -translate-y-1/2 h-3/4 border-2 rounded-md transition-colors ${
                                            isDragging
                                                ? 'bg-purple-600/80 border-purple-400 shadow-lg scale-105 z-30 cursor-move'
                                                : 'bg-purple-500/50 border-purple-700 cursor-move hover:bg-purple-500/70'
                                        }`}
                                        style={{
                                            left: `${(currentOverlayStartTime / safeDuration) * 100}%`,
                                            width: `${(overlay.duration / safeDuration) * 100}%`,
                                            userSelect: 'none',
                                        }}
                                        onMouseDown={(e) => videoEditor.startOverlayDrag(e, overlay)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            removeOverlayFromQuestion(selectedQuestion.originalIndex, overlay.id);
                                        }}
                                        onDoubleClick={() => onOpenOverlayModal(overlay)}
                                    >
                                    </div>
                                    {/* Mostrar tooltip apenas durante o arrasto */}
                                    {isDragging && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-md pointer-events-none z-20 transition-all duration-150 bg-purple-600 text-white shadow-lg">
                                            {formatTime(currentOverlayStartTime)}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </TimelineTrack>
                </div>
            </div>

            <div className="flex justify-between items-center text-xs mt-2 px-1 text-[var(--text-secondary)]">
                {videoEditor.isSelectionModeActive ? (
                    <span className="flex items-center gap-1 font-mono font-bold">
                        Início:
                        <TimeInput
                            time={videoEditor.startTime}
                            onChange={(newTime) => videoEditor.setSelectionTime({ start: newTime })}
                            className="bg-gray-800 font-mono w-24 text-center rounded-md border border-gray-700 focus:border-yellow-400 focus:ring-0 outline-none text-[var(--text-primary)]"
                        />
                    </span>
                ) : (
                    <span className="font-mono text-[var(--text-primary)]">
                        {videoPlayerRef?.current?.currentTime ?
                            `${Math.floor(videoPlayerRef.current.currentTime / 60)}:${(videoPlayerRef.current.currentTime % 60).toFixed(3).padStart(6, '0')}` :
                            '0:00.000'
                        }
                    </span>
                )}

                {videoEditor.isSelectionModeActive && (
                    <span className="font-bold text-[var(--text-primary)] font-mono">
                        Seleção: {Math.abs(videoEditor.endTime - videoEditor.startTime).toFixed(3)}s
                    </span>
                )}

                {videoEditor.isSelectionModeActive ? (
                    <span className="flex items-center gap-1 font-mono font-bold">
                        Fim:
                        <TimeInput
                            time={videoEditor.endTime}
                            onChange={(newTime) => videoEditor.setSelectionTime({ end: newTime })}
                            className="bg-gray-800 font-mono w-24 text-center rounded-md border border-gray-700 focus:border-yellow-400 focus:ring-0 outline-none text-[var(--text-primary)]"
                        />
                    </span>
                ) : (
                    <span>Duração:
                        <span className="font-mono text-[var(--text-primary)]">
                            {videoPlayerRef?.current?.duration ?
                                `${Math.floor(videoPlayerRef.current.duration / 60)}:${(videoPlayerRef.current.duration % 60).toFixed(3).padStart(6, '0')}` :
                                '0:00.000'
                            }
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
});

Timeline.displayName = 'Timeline';

export default React.memo(Timeline);
