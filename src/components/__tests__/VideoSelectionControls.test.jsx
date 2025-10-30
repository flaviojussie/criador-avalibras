import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoSelectionControls from '../VideoSelectionControls';

// Mock dos hooks
const mockStateMachine = {
    currentState: 'idle',
    startTime: 0,
    endTime: 0,
    hasValidSelection: false,
    selectionDuration: 0,
    isProcessing: false,
    isSelected: false,
    isSelectionModeActive: false,
    hasError: false,
    error: null,
    canExecuteCut: false,
    canStartSelection: true,
    canCancel: false,
    activateSelection: jest.fn(),
    startSelection: jest.fn(),
    updateSelection: jest.fn(),
    endSelection: jest.fn(),
    executeCut: jest.fn(),
    cutSuccess: jest.fn(),
    cutError: jest.fn(),
    cancelSelection: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
    STATES: {},
    EVENTS: {}
};

const mockVideoProcessing = {
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    result: null,
    processVideoCut: jest.fn(),
    resetProcessing: jest.fn()
};

const mockVideoPlayerRef = {
    current: {
        duration: 100
    }
};

const mockSelectedQuestion = {
    video: 'test-video.mp4',
    originalIndex: 0
};

const mockQuestionsManager = {
    updateQuestion: jest.fn()
};

const mockVisualManager = {
    updateSelection: jest.fn(),
    updatePlayhead: jest.fn(),
    updateProgress: jest.fn()
};

const mockVideoEditor = {
    isSelectionModeActive: false,
    startTime: 0,
    endTime: 0,
    hasValidSelection: false
};

// Mock do console
const originalConsole = console;
beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
});

afterAll(() => {
    console = originalConsole;
});

describe('VideoSelectionControls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Renderização Inicial', () => {
        test('deve renderizar botão de corte padrão', () => {
            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('Cortar Vídeo');
        });

        test('deve não mostrar feedback de seleção inicialmente', () => {
            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            expect(screen.queryByText(/Seleção:/)).not.toBeInTheDocument();
            expect(screen.queryByText(/Duração:/)).not.toBeInTheDocument();
        });
    });

    describe('Botão Principal', () => {
        test('deve mostrar texto correto em cada estado', () => {
            const { rerender } = render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            // Estado inicial - IDLE
            let button = screen.getByRole('button');
            expect(button).toHaveTextContent('Cortar Vídeo');

            // Simular modo de seleção
            mockStateMachine.isSelectionModeActive = true;
            mockStateMachine.canExecuteCut = false;
            mockStateMachine.canStartSelection = false;

            rerender(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            button = screen.getByRole('button');
            expect(button).toHaveTextContent('Selecione um trecho...');

            // Simular seleção válida
            mockStateMachine.isSelected = true;
            mockStateMachine.hasValidSelection = true;
            mockStateMachine.canExecuteCut = true;
            mockStateMachine.canStartSelection = false;

            rerender(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            button = screen.getByRole('button');
            expect(button).toHaveTextContent('Processar Corte');
        });

        test('deve estar desabilitado durante processamento', () => {
            mockStateMachine.isProcessing = true;
            mockVideoProcessing.isProcessing = true;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            expect(button).toHaveTextContent('Processando...');
        });

        test('deve mostrar spinner durante processamento', () => {
            mockStateMachine.isProcessing = true;
            mockVideoProcessing.isProcessing = true;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        test('deve mostrar botão de reset em estado de erro', () => {
            mockStateMachine.hasError = true;
            mockStateMachine.currentState = 'error';
            mockStateMachine.error = 'Erro de processamento';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveTextContent('Tentar Novamente');
        });
    });

    describe('Feedback Visual', () => {
        test('deve mostrar informações da seleção quando selecionado', () => {
            mockStateMachine.isSelected = true;
            mockStateMachine.startTime = 10;
            mockStateMachine.endTime = 25;
            mockStateMachine.selectionDuration = 15;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            expect(screen.getByText(/Seleção:/)).toBeInTheDocument();
            expect(screen.getByText(/0:10 - 0:25/)).toBeInTheDocument();
            expect(screen.getByText(/Duração: 0:15/)).toBeInTheDocument();
        });

        test('deve mostrar indicador de progresso durante processamento', () => {
            mockStateMachine.isProcessing = true;
            mockVideoProcessing.isProcessing = true;
            mockVideoProcessing.progress = 45;
            mockVideoProcessing.stage = 'processando';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            expect(screen.getByText(/processando:/i)).toBeInTheDocument();
            expect(screen.getByText(/45%/)).toBeInTheDocument();
        });

        test('deve mostrar mensagem de erro', () => {
            mockStateMachine.hasError = true;
            mockStateMachine.error = 'Falha ao processar vídeo';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            expect(screen.getByText(/Falha ao processar vídeo/)).toBeInTheDocument();
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        test('deve mostrar mensagem de sucesso', () => {
            mockStateMachine.isSuccess = true;
            mockStateMachine.currentState = 'success';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={mockVideoEditor}
                />
            );

            expect(screen.getByText(/Vídeo cortado com sucesso!/)).toBeInTheDocument();
            expect(screen.getByTestId('success-icon')).toBeInTheDocument();
        });
    });

    describe('Botões de Ação', () => {
        test('deve mostrar botão cancelar quando disponível', () => {
            mockStateMachine.canCancel = true;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const cancelButton = screen.getByText('Cancelar');
            expect(cancelButton).toBeInTheDocument();
        });

        test('deve chamar cancelSelection ao clicar em cancelar', () => {
            mockStateMachine.canCancel = true;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const cancelButton = screen.getByText('Cancelar');
            fireEvent.click(cancelButton);

            expect(mockStateMachine.cancelSelection).toHaveBeenCalled();
        });

        test('deve chamar clearError ao clicar em limpar erro', () => {
            mockStateMachine.hasError = true;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const clearButton = screen.getByText('Limpar Erro');
            fireEvent.click(clearButton);

            expect(mockStateMachine.clearError).toHaveBeenCalled();
        });

        test('deve chamar reset ao clicar em continuar', () => {
            mockStateMachine.isSuccess = true;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const continueButton = screen.getByText('Continuar');
            fireEvent.click(continueButton);

            expect(mockStateMachine.reset).toHaveBeenCalled();
        });
    });

    describe('Formatação de Tempo', () => {
        test('deve formatar tempo corretamente', () => {
            expect(formatTime(125)).toBe('2:05');
            expect(formatTime(65.5)).toBe('1:05');
            expect(formatTime(0)).toBe('0:00');
            expect(formatTime(-10)).toBe('0:00'); // Trata valores inválidos
        });

        test('deve mostrar feedback de tempo em diferentes formatos', () => {
            mockStateMachine.isSelected = true;
            mockStateMachine.startTime = 125; // 2:05
            mockStateMachine.endTime = 130.75; // 2:10.75

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            expect(screen.getByText(/2:05 - 2:10/)).toBeInTheDocument();
            expect(screen.getByText(/Duração: 0:05/)).toBeInTheDocument();
        });
    });

    describe('Execução de Corte', () => {
        test('deve executar corte quando seleção é válida', async () => {
            mockStateMachine.isSelected = true;
            mockStateMachine.hasValidSelection = true;
            mockStateMachine.canExecuteCut = true;
            mockStateMachine.startTime = 10;
            mockStateMachine.endTime = 30;

            mockVideoProcessing.processVideoCut.mockResolved('cut_video.mp4');

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const button = screen.getByText('Processar Corte');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockStateMachine.executeCut).toHaveBeenCalledWith({
                    videoPath: 'test-video.mp4',
                    startTime: 10,
                    endTime: 30
                });
            });

            await waitFor(() => {
                expect(mockVideoProcessing.processVideoCut).toHaveBeenCalledWith(
                    'test-video.mp4',
                    10,
                    30
                );
            });

            await waitFor(() => {
                expect(mockQuestionsManager.updateQuestion).toHaveBeenCalledWith(
                    0,
                    { video: 'cut_video.mp4' }
                );
            });

            await waitFor(() => {
                expect(mockStateMachine.cutSuccess).toHaveBeenCalled();
            });
        });

        test('deve registrar erro quando processamento falha', async () => {
            mockStateMachine.isSelected = true;
            mockStateMachine.hasValidSelection = true;
            mockStateMachine.canExecuteCut = true;
            mockVideoProcessing.processVideoCut.mockRejected(new Error('Erro de processamento'));

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const button = screen.getByText('Processar Corte');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockStateMachine.cutError).toHaveBeenCalledWith('Erro de processamento');
            });

            expect(screen.getByText(/Erro de processamento/)).toBeInTheDocument();
        });

        test('deve não executar corte sem seleção válida', () => {
            mockStateMachine.isSelected = false;
            mockStateMachine.hasValidSelection = false;

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(mockStateMachine.executeCut).not.toHaveBeenCalled();
        });
    });

    describe('Debug Mode', () => {
        test('deve mostrar informações de debug em desenvolvimento', () => {
            // Simular ambiente de desenvolvimento
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const debugInfo = screen.getByText(/Debug Info/);
            expect(debugInfo).toBeInTheDocument();
            expect(debugInfo).toHaveClass('debug-info');

            // Restaurar ambiente
            process.env.NODE_ENV = originalNodeEnv;
        });

        test('não deve mostrar debug em produção', () => {
            // Simular ambiente de produção
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            expect(screen.queryByText(/Debug Info/)).not.toBeInTheDocument();

            // Restaurar ambiente
            process.env.NODE_ENV = originalNodeEnv;
        });

        test('deve expandir informações de debug', () => {
            process.env.NODE_ENV = 'development';
            mockStateMachine.currentState = 'selected';
            mockStateMachine.lastEvent = 'END_SELECTION';

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const debugInfo = screen.getByText(/Debug Info/);
            fireEvent.click(debugInfo.querySelector('summary'));

            expect(screen.getByText(/Estado:/)).toHaveTextContent('selected');
            expect(screen.getByText(/Último Evento:/)).toHaveTextContent('END_SELECTION');
        });
    });

    describe('Acessibilidade', () => {
        test('deve ter botões com texto descritivo', () => {
            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('title');
        });

        test('deve ter ARIA labels apropriados', () => {
            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label');
        });
    });

    describe('Responsividade', () => {
        test('deve ser responsivo a diferentes tamanhos', () => {
            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            const container = screen.getByRole('button').parentElement;
            expect(container).toHaveClass('video-selection-controls');
        });
    });

    describe('Performance', () => {
        test('deve renderizar sem warnings no console', () => {
            const originalError = console.error;
            console.error = jest.fn();

            render(
                <VideoSelectionControls
                    videoPlayerRef={mockVideoPlayerRef}
                    selectedQuestion={mockSelectedQuestion}
                    questionsManager={mockQuestionsManager}
                    visualManager={mockVisualManager}
                    videoEditor={videoEditor}
                />
            );

            // Verificar se não houve warnings de React
            expect(console.error).not.toHaveBeenCalled();

            // Restaurar console.error
            console.error = originalError;
        });
    });
});

// Helper function para formatação de tempo
function formatTime(time) {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}