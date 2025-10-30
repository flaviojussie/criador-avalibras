import React, { useCallback } from 'react';
import { useVideoStateMachine } from '../hooks/useVideoStateMachine';
import { useVideoProcessing } from '../hooks/useVideoProcessing';

/**
 * Componente de controles de seleção de vídeo
 * Arquitetura limpa com separação clara de responsabilidades
 */
const VideoSelectionControls = ({
    videoPlayerRef,
    selectedQuestion,
    questionsManager,
    visualManager,
    videoEditor
}) => {
    const stateMachine = useVideoStateMachine();
    const videoProcessing = useVideoProcessing();

    /**
     * Executa a ação principal baseada no estado atual
     */
    const handlePrimaryAction = useCallback(async () => {
        console.log('🎯 Ação principal - Estado atual:', stateMachine.currentState);

        if (stateMachine.canExecuteCut) {
            // Executar corte
            await executeCut();
        } else if (stateMachine.canStartSelection) {
            // Ativar modo de seleção
            stateMachine.activateSelection();
        } else {
            console.warn('❌ Nenhuma ação disponível no estado atual');
        }
    }, [stateMachine]);

    /**
     * Executa o processo de corte
     */
    const executeCut = useCallback(async () => {
        if (!selectedQuestion?.video) {
            console.error('❌ Nenhum vídeo selecionado');
            return;
        }

        try {
            stateMachine.executeCut({
                videoPath: selectedQuestion.video,
                startTime: stateMachine.startTime,
                endTime: stateMachine.endTime
            });

            const result = await videoProcessing.processVideoCut(
                selectedQuestion.video,
                stateMachine.startTime,
                stateMachine.endTime
            );

            // Atualizar questão com novo vídeo
            questionsManager.updateQuestion(selectedQuestion.originalIndex, {
                video: result
            });

            stateMachine.cutSuccess(result);
            console.log('✅ Vídeo atualizado com sucesso');

        } catch (error) {
            stateMachine.cutError(error.message);
            console.error('❌ Falha no corte:', error);
        }
    }, [stateMachine, videoProcessing, selectedQuestion, questionsManager]);

    /**
     * Cancela a operação atual
     */
    const handleCancel = useCallback(() => {
        if (stateMachine.canCancel) {
            stateMachine.cancelSelection();
            console.log('❌ Seleção cancelada');
        }
    }, [stateMachine]);

    /**
     * Limpa erros
     */
    const handleClearError = useCallback(() => {
        stateMachine.clearError();
        console.log('🧹 Erro limpo');
    }, [stateMachine]);

    /**
     * Obtém as props do botão principal
     */
    const getPrimaryButtonProps = () => {
        if (stateMachine.isProcessing) {
            return {
                text: 'Processando...',
                disabled: true,
                loading: true,
                variant: 'processing'
            };
        }

        if (stateMachine.isSelectionModeActive) {
            return {
                text: 'Selecione um trecho...',
                disabled: true,
                loading: false,
                variant: 'waiting'
            };
        }

        if (stateMachine.isSelected) {
            return {
                text: 'Processar Corte',
                disabled: false,
                loading: false,
                variant: 'primary'
            };
        }

        if (stateMachine.hasError) {
            return {
                text: 'Tentar Novamente',
                disabled: false,
                loading: false,
                variant: 'error'
            };
        }

        return {
            text: 'Cortar Vídeo',
            disabled: false,
            loading: false,
            variant: 'default'
        };
    };

    const buttonProps = getPrimaryButtonProps();

    /**
     * Formata tempo para exibição
     */
    const formatTime = (time) => {
        if (isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="video-selection-controls">
            {/* Botão principal */}
            <button
                onClick={handlePrimaryAction}
                disabled={buttonProps.disabled}
                className={`
                    cut-button
                    ${buttonProps.variant}
                    ${buttonProps.loading ? 'loading' : ''}
                    ${stateMachine.isSelectionModeActive ? 'active' : ''}
                    ${stateMachine.hasError ? 'error' : ''}
                `}
                title={buttonProps.text}
            >
                {buttonProps.loading && <LoadingSpinner />}
                <span className="button-text">{buttonProps.text}</span>
            </button>

            {/* Botão de cancelar (quando disponível) */}
            {stateMachine.canCancel && (
                <button
                    onClick={handleCancel}
                    className="cancel-button"
                    title="Cancelar seleção"
                >
                    Cancelar
                </button>
            )}

            {/* Feedback de seleção */}
            {stateMachine.isSelected && (
                <div className="selection-feedback">
                    <div className="selection-times">
                        <span className="label">Seleção:</span>
                        <span className="times">
                            {formatTime(stateMachine.startTime)} - {formatTime(stateMachine.endTime)}
                        </span>
                        <span className="duration">
                            (Duração: {formatTime(stateMachine.selectionDuration)})
                        </span>
                    </div>
                </div>
            )}

            {/* Indicador de processamento */}
            {videoProcessing.isProcessing && (
                <div className="processing-indicator">
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${videoProcessing.progress}%` }}
                            />
                        </div>
                        <span className="progress-text">
                            {videoProcessing.stage}: {videoProcessing.progress}%
                        </span>
                    </div>
                </div>
            )}

            {/* Mensagem de erro */}
            {stateMachine.hasError && (
                <div className="error-message">
                    <div className="error-content">
                        <i className="fas fa-times-circle w-5 h-5 text-red-500"></i>
                        <span className="error-text">{stateMachine.error}</span>
                    </div>
                    <div className="error-actions">
                        <button onClick={handleClearError} className="clear-error-button">
                            Limpar Erro
                        </button>
                        <button onClick={() => stateMachine.reset()} className="reset-button">
                            Resetar
                        </button>
                    </div>
                </div>
            )}

            {/* Mensagem de sucesso */}
            {stateMachine.isSuccess && (
                <div className="success-message">
                    <i className="fas fa-check-circle w-5 h-5 text-green-500"></i>
                    <span className="success-text">
                        Vídeo cortado com sucesso!
                    </span>
                    <button onClick={() => stateMachine.reset()} className="continue-button">
                        Continuar
                    </button>
                </div>
            )}

            {/* Debug info (em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
                <details className="debug-info">
                    <summary>Debug Info</summary>
                    <div className="debug-content">
                        <p><strong>Estado:</strong> {stateMachine.currentState}</p>
                        <p><strong>Último Evento:</strong> {stateMachine.lastEvent}</p>
                        <p><strong>Seleção:</strong> {stateMachine.startTime}s - {stateMachine.endTime}s</p>
                        <p><strong>Duração:</strong> {stateMachine.selectionDuration}s</p>
                        <p><strong>Válida:</strong> {stateMachine.hasValidSelection ? 'Sim' : 'Não'}</p>
                        <details>
                            <summary>State Machine</summary>
                            <pre>{JSON.stringify(stateMachine.getStateHistory(), null, 2)}</pre>
                        </details>
                    </div>
                </details>
            )}
        </div>
    );
};

/**
 * Componente de loading spinner
 */
const LoadingSpinner = () => (
    <div className="loading-spinner">
        <div className="spinner"></div>
    </div>
);

export default VideoSelectionControls;