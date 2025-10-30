import React, { useState, useMemo, useEffect } from 'react';
import Icon, {
    faPlay,
    faPause,
    faChevronLeft,
    faChevronRight,
    faCut,
    faImage,
    faCheck,
    faEdit
} from './Icon';

const ControlButton = React.memo(({ title, icon, onClick, active = false, disabled = false }) => (
    <button
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-[6px] border border-[var(--border-color)] transition-all duration-200
            ${active ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-primary)]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--surface-quaternary)] hover:border-[var(--accent-primary)] hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(0,0,0,0.3)]'}
        `}
    >
        <Icon icon={icon} className="w-4 h-4" />
    </button>
));

const PlayPauseButton = React.memo(({ isPlaying, onClick }) => (
    <button
        title={isPlaying ? "Pausar" : "Reproduzir"}
        onClick={onClick}
        className="w-10 h-10 flex items-center justify-center rounded-[6px] transition-all duration-200 bg-[var(--accent-primary)] text-white shadow-[0_2px_8px_rgba(14,99,156,0.4)] hover:bg-[var(--accent-primary-hover)] hover:-translate-y-px"
    >
        <Icon
            icon={isPlaying ? faPause : faPlay}
            className="w-4 h-4"
        />
    </button>
));

const MarkerButton = React.memo(({ alternative, isActive, onClick, disabled = false }) => (
    <button
        onClick={() => onClick(alternative)}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-[6px] border border-[var(--border-color)] font-semibold transition-all duration-200
            ${isActive
                ? 'bg-[var(--accent-primary)] text-white -translate-y-px shadow-[0_2px_8px_rgba(14,99,156,0.2)]'
                : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] hover:border-[var(--accent-primary)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        {alternative}
    </button>
));

const VideoControls = ({ videoPlayerRef, selectedQuestion, questionsManager, onOpenGabaritoModal, onOpenOverlayModal, onAddOverlay, onValidateQuestion, videoEditor }) => {

        const [isPlaying, setIsPlaying] = useState(false);
    const [activeMarker, setActiveMarker] = useState(null);

    useEffect(() => {
        const video = videoPlayerRef.current;

        // Se não houver questão selecionada ou elemento de vídeo, reseta o estado.
        if (!selectedQuestion || !video) {
            setIsPlaying(false);
            return; // Sai mais cedo
        }

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        // Define o estado inicial para o vídeo atual
        setIsPlaying(!video.paused);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handlePause);

        // Limpa os listeners
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handlePause);
        };
    }, [videoPlayerRef, selectedQuestion]);

    // Otimização: Memoizar cálculos pesados para evitar re-renders
    const alternatives = useMemo(() => {
        return ['A', 'B', 'C', 'D', 'E'].slice(0, selectedQuestion ? questionsManager.currentProject?.totalAlternatives || 4 : 4);
    }, [selectedQuestion, questionsManager.currentProject?.totalAlternatives]);

    // Find the next marker to be activated
    const nextMarkerToActivate = useMemo(() => {
        if (!selectedQuestion?.markers) return null;
        // Find the first alternative that has a null time
        return alternatives.find(alt => selectedQuestion.markers[alt] === null);
    }, [selectedQuestion, alternatives]);

    const handlePlayPause = async () => {
        if (!videoPlayerRef.current) {
            console.warn('VideoControls: ⚠️ videoPlayerRef.current não está disponível');
            return;
        }

        // Verificar se o vídeo tem uma fonte válida
        if (!videoPlayerRef.current.src) {
            console.warn('VideoControls: ⚠️ Nenhuma fonte de vídeo definida');
            console.log('VideoControls: 📋 Estado atual do vídeo:', {
                src: videoPlayerRef.current.src,
                readyState: videoPlayerRef.current.readyState,
                networkState: videoPlayerRef.current.networkState,
                error: videoPlayerRef.current.error
            });
            return;
        }

        // Verificar se há erros no elemento de vídeo
        if (videoPlayerRef.current.error) {
            console.error('VideoControls: ❌ Vídeo com erro:', videoPlayerRef.current.error);
            return;
        }

        // Verificar se o vídeo está pronto para reprodução
        if (videoPlayerRef.current.readyState < 2) { // HAVE_CURRENT_DATA
            console.warn('VideoControls: ⏳ Vídeo não está pronto para reprodução (readyState:', videoPlayerRef.current.readyState + ')');

            // Esperar um pouco mais para o vídeo carregar (especialmente importante após as mudanças no Editor)
            try {
                console.log('VideoControls: 🔄 Aguardando carregamento do vídeo...');
                await new Promise(resolve => setTimeout(resolve, 500));

                // Verificar novamente o estado
                if (videoPlayerRef.current.readyState < 2) {
                    console.warn('VideoControls: ⚠️ Vídeo ainda não está pronto após espera');
                    return;
                }
            } catch (error) {
                console.error('VideoControls: ❌ Erro durante espera de carregamento:', error);
                return;
            }
        }

        // Verificar duração do vídeo
        if (isNaN(videoPlayerRef.current.duration) || videoPlayerRef.current.duration === 0) {
            console.warn('VideoControls: ⚠️ Duração do vídeo inválida:', videoPlayerRef.current.duration);
            console.log('VideoControls: 📊 Informações do vídeo:', {
                duration: videoPlayerRef.current.duration,
                readyState: videoPlayerRef.current.readyState,
                networkState: videoPlayerRef.current.networkState,
                videoWidth: videoPlayerRef.current.videoWidth,
                videoHeight: videoPlayerRef.current.videoHeight
            });
            return;
        }

        try {
            if (isPlaying) {
                videoPlayerRef.current.pause();
                console.log('VideoControls: ⏸️ Vídeo pausado');
                setIsPlaying(false);
            } else {
                console.log('VideoControls: ▶️ Iniciando reprodução');

                // Tentar reproduzir o vídeo com tratamento robusto
                const playPromise = videoPlayerRef.current.play();

                if (playPromise !== undefined) {
                    try {
                        await playPromise;
                        console.log('VideoControls: ✅ Vídeo iniciado com sucesso');
                        setIsPlaying(true);
                    } catch (playError) {
                        console.error('VideoControls: ❌ Erro na promise do play():', playError);

                        // Erros comuns e suas causas
                        if (playError.name === 'NotAllowedError') {
                            console.warn('VideoControls: 🚫 Reprodução não permitida (política do navegador)');
                        } else if (playError.name === 'NotSupportedError') {
                            console.warn('VideoControls: 🚫 Formato de vídeo não suportado');
                        } else if (playError.name === 'AbortError') {
                            console.warn('VideoControls: 🚫 Reprodução abortada');
                        }

                        setIsPlaying(false);
                    }
                } else {
                    // Fallback para browsers mais antigos
                    console.log('VideoControls: ✅ Vídeo iniciado (fallback)');
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error('VideoControls: ❌ Erro geral ao reproduzir/pausar vídeo:', error);
            console.error('VideoControls: 🐛 Detalhes do erro:', {
                name: error.name,
                message: error.message,
                videoState: {
                    src: videoPlayerRef.current.src,
                    readyState: videoPlayerRef.current.readyState,
                    networkState: videoPlayerRef.current.networkState,
                    error: videoPlayerRef.current.error
                }
            });
            // Não alterar o estado se houve erro
            setIsPlaying(false);
        }
    };

    const handleMarkerClick = (alternative) => {
        if (!videoPlayerRef.current || !selectedQuestion) {
            console.log('❌ Nenhum vídeo ou questão selecionada');
            return;
        }

        const currentTime = videoPlayerRef.current.currentTime;
        console.log(`📍 Marcador ${alternative} definido em: ${currentTime.toFixed(2)}s`);

        // Update question with marker time
        const updatedMarkers = {
            ...selectedQuestion.markers,
            [alternative]: currentTime
        };

        questionsManager.updateQuestion(selectedQuestion.originalIndex, {
            markers: updatedMarkers
        });

        setActiveMarker(alternative);

        // Visual feedback
        setTimeout(() => setActiveMarker(null), 1000);
    };

  

    return (
        <div className="flex-shrink-0 flex items-center justify-between p-3 bg-gradient-to-b from-[var(--surface-secondary)] to-[var(--surface-tertiary)] border-t border-[var(--border-color)] gap-2 flex-wrap">
            <div className="flex items-center gap-2">
                <ControlButton title="Adicionar Imagem" icon={faImage} onClick={onAddOverlay || onOpenOverlayModal} />
                
                {videoEditor.isSelectionModeActive ? (
                    <ControlButton
                        title="Confirmar Corte"
                        icon={faCut}
                        onClick={() => videoEditor.cutVideo(selectedQuestion.video, videoEditor.startTime, videoEditor.endTime, questionsManager, selectedQuestion)}
                        disabled={!(videoEditor.endTime > videoEditor.startTime)}
                        active={true}
                    />
                ) : (
                    <ControlButton
                        title="Cortar Vídeo"
                        icon={faCut}
                        onClick={videoEditor.toggleCutMode}
                        active={false}
                    />
                )}

                <ControlButton title="Validar Questão" icon={faCheck} onClick={onValidateQuestion} />
            </div>

            <div className="flex items-center gap-2">
                <ControlButton title="Frame Anterior" icon={faChevronLeft} onClick={() => videoEditor.nudgePlayhead(-1)} />
                <PlayPauseButton isPlaying={isPlaying} onClick={handlePlayPause} />
                <ControlButton title="Próximo Frame" icon={faChevronRight} onClick={() => videoEditor.nudgePlayhead(1)} />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">Marcadores:</span>
                <div className="flex items-center gap-1">
                    {alternatives.map(alt => (
                        <MarkerButton
                            key={alt}
                            alternative={alt}
                            isActive={selectedQuestion?.markers?.[alt] !== null && !isNaN(selectedQuestion?.markers?.[alt])}
                            onClick={handleMarkerClick}
                            disabled={alt !== nextMarkerToActivate}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-[var(--text-secondary)]">Gabarito:</span>
                    <ControlButton
                        title="Definir Gabarito"
                        icon={faEdit}
                        onClick={onOpenGabaritoModal}
                    />
                    {selectedQuestion?.correctAnswer && (
                        <span className="text-xs font-medium text-[var(--accent-primary)] ml-1">
                            ({selectedQuestion.correctAnswer})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(VideoControls);