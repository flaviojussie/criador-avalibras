import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import VideoControls from './VideoControls';
import Timeline from './Timeline';
import apiService, { getVideoSource } from '../utils/apiService';
import { isElectron, isWeb } from '../utils/environmentDetector';
import { useVideoEditor } from '../hooks/useVideoEditor';
import Icon, { faVideo } from './Icon';
import LoadingModal from './LoadingModal';

const Editor = ({
    selectedQuestion,
    videoPlayerRef,
    timelineRef,
    canvasRef,
    overlayManager,
    questionsManager,
    onOpenGabaritoModal,
    onOpenOverlayModal,
    onAddOverlay,
    onValidateQuestion,
    showNotification,
    removeMarkerAndSubsequent,
    removeOverlayFromQuestion
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const videoId = useMemo(() => selectedQuestion?.video || null, [selectedQuestion?.video]);

    // Handle marker time updates
    const handleMarkerTimeUpdate = useCallback((alternative, newTime) => {
        if (!selectedQuestion) return;

        const updatedMarkers = {
            ...selectedQuestion.markers,
            [alternative]: newTime
        };

        questionsManager.updateQuestion(selectedQuestion.originalIndex, {
            markers: updatedMarkers
        });
    }, [selectedQuestion, questionsManager]);

    const {
        playheadRef,
        progressRef,
        selectionAreaRef,
        timelineTrackRef,
        playheadPosition,
        progressPosition,
        ...videoEditor
    } = useVideoEditor(videoPlayerRef, questionsManager, selectedQuestion, handleMarkerTimeUpdate);

    // Sync overlay data with the overlay manager when the selected question changes
    const { clearOverlays, addOverlay } = overlayManager;
    useEffect(() => {
        clearOverlays();
        if (selectedQuestion?.overlays && selectedQuestion.overlays.length > 0) {
            selectedQuestion.overlays.forEach(overlay => addOverlay(overlay));
        }
    }, [selectedQuestion, clearOverlays, addOverlay]);

    // Listen for overlay errors and show notifications - Otimização: remover dependência do objeto overlayManager
    const { addEventListener } = overlayManager;

    // Update video player reference when selected question changes
    useEffect(() => {
        // A lógica de reset agora está dentro do useVideoEditor
        if (!videoId) {
            console.log('Editor: 📹 Nenhum vídeo disponível, resetando posições.');
            return;
        }

        // Evitar execução se não houver vídeo ou player
        if (!videoPlayerRef.current) {
            console.log('Editor: 📹 Nenhum player disponível');
            return;
        }

        // Evitar múltiplas inicializações do mesmo vídeo
        if (videoPlayerRef.current.src && videoId) {
            const currentSrc = videoPlayerRef.current.src;

            // Verificar se o vídeo atual já é o mesmo
            if (currentSrc.includes(videoId) || currentSrc === videoId) {
                console.log('Editor: 📹 Vídeo já carregado, ignorando recarregamento');
                return;
            }
        }

        const loadVideo = async () => {
            try {
                console.log('Editor: 🎥 Iniciando carregamento do vídeo:', videoId);
                console.log('Editor: 🖥️ Ambiente:', isElectron() ? 'Electron' : 'Web');

                // Obter fonte de vídeo usando o serviço centralizado
                const videoSource = await getVideoSource(videoId);
                console.log('Editor: 📹 Fonte de vídeo obtida:', videoSource);

                if (videoSource.requiresUpload) {
                    console.log('Editor: 📤 Upload de vídeo requerido para ambiente web');
                    console.log('Editor: ❌ Upload web não suportado - AvaLIBRAS é aplicação desktop');
                    if (typeof showNotification === 'function') {
                        showNotification('Upload de vídeo não disponível - use arquivos locais', 'error');
                    }
                    return;
                }

                // SOLUÇÃO ROBUSTA: Tratamento específico para erro do Electron
                if (videoSource.type === 'electron-error' && videoSource.error === 'FILE_URL_BLOCKED') {
                    console.error('Editor: 🚫 URLs file:// bloqueadas no Electron - servidor HTTP deve ser usado');
                    console.error('Editor: Problema:', videoSource.message);

                    // Usar a função showNotification recebida como prop
                    if (typeof showNotification === 'function') {
                        showNotification('Erro no carregamento de vídeo: servidor HTTP não disponível', 'error');
                    } else {
                        console.error('Editor: 💥 showNotification não está disponível como função');
                    }
                    return;
                }

                if (!videoSource.url) {
                    console.warn('Editor: ⚠️ Nenhuma URL de vídeo disponível');
                    console.warn('Editor: Tipo de fonte:', videoSource.type, 'Mensagem:', videoSource.message);
                    return;
                }

                // Carregar vídeo com retry simplificado
                await loadVideoWithRetry(videoSource.url, videoSource);

            } catch (error) {
                console.error('Editor: 💥 Erro no carregamento do vídeo:', error.message);
                // Mostrar mensagem amigável ao usuário em vez de quebrar
            }
        };

        // Função simplificada de retry
        const loadVideoWithRetry = async (videoUrl, sourceInfo) => {
            const maxRetries = 2;
            const retryDelay = 500;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // console.log(`Editor: 🔄 Tentativa ${attempt}/${maxRetries} - ${sourceInfo.source}`);

                    // Limpar estado anterior
                    if (videoPlayerRef.current.src) {
                        videoPlayerRef.current.pause();
                        videoPlayerRef.current.currentTime = 0;
                        videoPlayerRef.current.removeAttribute('src');
                    }

                    // Configurar nova fonte
                    videoPlayerRef.current.src = videoUrl;
                    console.log('Editor: 📹 Fonte definida:', videoUrl);

                    // Aguardar e carregar
                    await new Promise(resolve => setTimeout(resolve, 200));
                    await videoPlayerRef.current.load();

                    // Esperar sucesso ou erro com timeout
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Timeout ao carregar vídeo'));
                        }, 3000);

                        const handleCanPlay = () => {
                            console.log(`Editor: ✅ Vídeo pronto (tentativa ${attempt})`);
                            clearTimeout(timeout);
                            resolve();
                        };

                        const handleError = () => {
                            const errorMsg = videoPlayerRef.current.error?.message || 'Erro desconhecido';
                            console.error(`Editor: ❌ Erro ao carregar (tentativa ${attempt}):`, errorMsg);
                            clearTimeout(timeout);
                            reject(new Error(errorMsg));
                        };

                        videoPlayerRef.current.addEventListener('canplay', handleCanPlay, { once: true });
                        videoPlayerRef.current.addEventListener('error', handleError, { once: true });
                    });

                    console.log(`Editor: 🎉 Vídeo carregado com sucesso!`);
                    return true;

                } catch (error) {
                    console.error(`Editor: ❌ Falha na tentativa ${attempt}:`, error.message);

                    if (attempt < maxRetries) {
                        console.log(`Editor: ⏳ Aguardando ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        console.error('Editor: 💥 Todas as tentativas falharam');

                        // Mensagem informativa baseada no ambiente
                        if (isWeb()) {
                            console.log('Editor: 🌐 Em ambiente web, considere fazer upload do vídeo');
                        } else {
                            console.log('Editor: 🖥️ Verifique se o Electron está funcionando corretamente');
                        }
                        return false;
                    }
                }
            }
        };

        loadVideo();
    }, [videoId]); // Dependency array simplificado para evitar loops

    // Handle video player events for overlay state
    const handleVideoTimeUpdate = useCallback(() => {
        if (videoPlayerRef.current) {
            // A atualização da posição do playhead agora é gerenciada pelo useVideoEditor.
            // Mantemos esta função para o overlayManager.
            overlayManager.updateVideoState(videoPlayerRef.current);
        }
    }, [overlayManager, videoPlayerRef]);

    const handleVideoLoadedMetadata = useCallback(() => {
        if (videoPlayerRef.current) {
            overlayManager.updateVideoState(videoPlayerRef.current);
        }
    }, [overlayManager]);

    // Handle drag and drop
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!selectedQuestion) {
            console.log('Nenhuma questão selecionada');
            return;
        }

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            console.log('🎥 Arquivo recebido:', {
                name: file.name,
                type: file.type,
                size: file.size,
                path: file.path,
                lastModified: new Date(file.lastModified).toISOString()
            });

            // Verificar se é um vídeo
            if (file.type.startsWith('video/')) {
                try {
                    console.log('✅ Arquivo de vídeo detectado:', file.name);
                    console.log('🖥️ Ambiente:', isElectron() ? 'Electron' : 'Web');

                    if (isElectron()) {
                        // No Electron, obter o caminho do arquivo
                        const filePath = file.path; // Propriedade específica do Electron
                        if (filePath) {
                            console.log('📁 Caminho do arquivo (Electron):', filePath);
                            await questionsManager.updateQuestionVideo(selectedQuestion.id, filePath);
                        } else {
                            console.error('❌ Não foi possível obter o caminho do arquivo');
                        }
                    } else {
                        // No Web, converter para blob URL
                        console.log('🌐 Convertendo arquivo para blob URL...');
                        const blobUrl = URL.createObjectURL(file);
                        console.log('🔗 Blob URL criado:', blobUrl);
                        await questionsManager.updateQuestionVideo(selectedQuestion.id, blobUrl);
                        console.log('✅ Vídeo carregado como blob URL com sucesso');
                    }
                } catch (error) {
                    console.error('❌ Erro ao processar vídeo arrastado:', error);
                }
            } else {
                console.log('❌ Arquivo não é um vídeo:', file.type);
            }
        } else {
            console.log('❌ Nenhum arquivo recebido');
        }
    }, [selectedQuestion, questionsManager]);

    const handleFileSelect = useCallback(async () => {
        if (!selectedQuestion) return;

        try {
            if (isElectron()) {
                // No Electron, usar diálogo de arquivo
                const result = await window.electronAPI.showOpenDialog({
                    properties: ['openFile'],
                    filters: [
                        { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'webm', 'mkv'] }
                    ]
                });

                if (!result.canceled && result.filePaths.length > 0) {
                    const filePath = result.filePaths[0];
                    await questionsManager.updateQuestionVideo(selectedQuestion.id, filePath);
                }
            } else {
                // No Web, usar input de arquivo
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const blobUrl = URL.createObjectURL(file);
                        await questionsManager.updateQuestionVideo(selectedQuestion.id, blobUrl);
                    }
                };
                input.click();
            }
        } catch (error) {
            console.error('Erro ao selecionar arquivo:', error);
        }
    }, [selectedQuestion, questionsManager]);

    return (
        <section className="flex-1 flex flex-col bg-[var(--surface-primary)] min-w-[500px] p-1 gap-1">
            <header className="p-3 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-base font-semibold">
                        {questionsManager.currentProject?.name || 'Projeto sem Título'}
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Múltipla escolha • {questionsManager.currentProject?.totalAlternatives || 4} alternativas
                    </p>
                </div>
                <span className="text-xs">
                    {selectedQuestion ? selectedQuestion.label : 'Nenhuma questão selecionada'}
                </span>
            </header>

            <div className="flex-1 relative overflow-hidden rounded-lg border-2 border-dashed border-[var(--border-color)]
                transition-colors duration-200 cursor-pointer
                hover:border-[var(--accent-primary)]
                group"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileSelect}
            >
                {selectedQuestion ? (
                    selectedQuestion.video ? (
                        <>
                            <video
                                key={videoId}
                                ref={videoPlayerRef}
                                className="absolute top-0 left-0 w-full h-full object-contain"
                                onTimeUpdate={handleVideoTimeUpdate}
                                onLoadedMetadata={handleVideoLoadedMetadata}
                                preload="metadata"
                            >
                                Your browser does not support the video tag.
                            </video>
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                                style={{
                                    zIndex: 10,
                                    pointerEvents: 'none',
                                    mixBlendMode: 'normal'
                                }}
                            ></canvas>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)] cursor-pointer p-8" onClick={handleFileSelect}>
                            <div className="mb-4">
                                <Icon icon={faVideo} className="w-16 h-16 mx-auto text-[var(--text-tertiary)]" />
                            </div>
                            <p className="text-lg font-medium mb-2">Nenhum vídeo selecionado</p>
                            <p className="text-sm mb-2">Clique ou arraste um vídeo para esta questão</p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                {isWeb()
                                    ? "📁 Modo Web: Faça upload de arquivos de vídeo (MP4, WebM, AVI)"
                                    : "🖥️ Modo Desktop: Selecione arquivos locais"}
                            </p>
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)] p-8">
                        <div className="mb-4">
                            <Icon icon={faVideo} className="w-16 h-16 mx-auto text-[var(--text-tertiary)]" />
                        </div>
                        <p className="text-lg font-medium mb-2">Nenhuma questão selecionada</p>
                        <p className="text-sm">Selecione uma questão para adicionar um vídeo</p>
                    </div>
                )}

                {isDragOver && (
                    <div className="absolute inset-0 bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <i className="fas fa-video w-12 h-12 mx-auto mb-2 text-[var(--accent-primary)]"></i>
                            <p className="text-sm font-medium text-[var(--accent-primary)]">
                                Solte o vídeo aqui
                            </p>
                        </div>
                    </div>
                )}
            </div>

                        <> 
                            <VideoControls
                                videoPlayerRef={videoPlayerRef}
                                selectedQuestion={selectedQuestion}
                                questionsManager={questionsManager}
                                onOpenGabaritoModal={onOpenGabaritoModal}
                                onOpenOverlayModal={onOpenOverlayModal}
                                onAddOverlay={onAddOverlay}
                                onValidateQuestion={onValidateQuestion}
                                videoEditor={videoEditor}
                            />
                            <Timeline
                                ref={timelineRef}
                                videoPlayerRef={videoPlayerRef}
                                selectedQuestion={selectedQuestion}
                                overlayManager={overlayManager}
                                videoEditor={videoEditor}
                                removeMarkerAndSubsequent={removeMarkerAndSubsequent}
                                onOpenOverlayModal={onOpenOverlayModal}
                                removeOverlayFromQuestion={removeOverlayFromQuestion}
                                playheadPosition={playheadPosition}
                                progressPosition={progressPosition}
                                onUpdateMarkerTime={handleMarkerTimeUpdate}
                                // Pass down the new refs
                                playheadRef={playheadRef}
                                progressRef={progressRef}
                                selectionAreaRef={selectionAreaRef}
                                timelineTrackRef={timelineTrackRef}
                            />
                        </>
            {videoEditor.isCutting && (
                <LoadingModal isOpen={videoEditor.isCutting} message="Cortando vídeo, por favor aguarde..." />
            )}
        </section>
    );
};

export default Editor;