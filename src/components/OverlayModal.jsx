import React, { useState, useEffect, useRef } from 'react';

const OverlayModal = ({ isOpen, onClose, selectedQuestion, questionsManager, mode, initialData }) => {
    const [overlayData, setOverlayData] = useState({
        id: null,
        imagePath: '',
        startTime: 0,
        duration: 5,
        position: 'center',
        size: 50,
        opacity: 100
    });

    const fileInputRef = useRef(null);

    // Set form state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                // Modo de edição: preenche o formulário com os dados do overlay existente
                setOverlayData({
                    id: initialData.id,
                    imagePath: initialData.path || '',
                    startTime: initialData.startTime ?? 0,
                    duration: initialData.duration ?? 5,
                    position: initialData.position || 'center',
                    size: initialData.size ?? 50,
                    opacity: initialData.opacity ?? 80,
                });
            } else if (mode === 'add' && initialData) {
                // Modo de adição: reseta o formulário e usa o tempo capturado
                setOverlayData({
                    id: null,
                    imagePath: '',
                    startTime: parseFloat((initialData.currentTime || 0).toFixed(1)),
                    duration: 5,
                    position: 'center',
                    size: 50,
                    opacity: 100
                });
            }
        }
    }, [isOpen, mode, initialData]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleFileSelect = async () => {
        if (!selectedQuestion) {
            console.log('Nenhuma questão selecionada');
            return;
        }

        try {
            const result = await window.electronAPI?.showOpenDialog({
                title: 'Selecionar Imagem',
                filters: [
                    { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
                    { name: 'Todos os arquivos', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                setOverlayData(prev => ({
                    ...prev,
                    imagePath: result.filePaths[0]
                }));
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!overlayData.imagePath) {
            console.log('❌ Nenhuma imagem selecionada');
            return;
        }

        // Create overlay object, preserving ID if it exists (edit mode)
        const overlay = {
            id: overlayData.id || `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            path: overlayData.imagePath,
            startTime: parseFloat(overlayData.startTime),
            duration: parseFloat(overlayData.duration),
            position: overlayData.position,
            size: parseInt(overlayData.size),
            opacity: parseInt(overlayData.opacity)
        };

        // The updateQuestion function in useQuestions is smart enough to handle both cases
        questionsManager.updateQuestion(selectedQuestion.originalIndex, { overlay: overlay });

        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const positions = [
        { value: 'top-left', label: 'Superior Esquerdo' },
        { value: 'top-center', label: 'Superior Centro' },
        { value: 'top-right', label: 'Superior Direito' },
        { value: 'center-left', label: 'Centro Esquerdo' },
        { value: 'center', label: 'Centro' },
        { value: 'center-right', label: 'Centro Direito' },
        { value: 'bottom-left', label: 'Inferior Esquerdo' },
        { value: 'bottom-center', label: 'Inferior Centro' },
        { value: 'bottom-right', label: 'Inferior Direito' }
    ];

    if (!isOpen || !selectedQuestion) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] max-w-lg w-full mx-4">
                {/* Header - estilo TitleBar */}
                <div className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Adicionar Imagem</h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] rounded-[3px] transition-colors"
                        aria-label="Fechar"
                    >
                        <i className="fas fa-times w-4 h-4"></i>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Imagem
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleFileSelect}
                                className="flex-1 px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-[6px] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-folder-open w-4 h-4"></i>
                                {overlayData.imagePath ? 'Alterar Imagem' : 'Selecionar Imagem'}
                            </button>
                        </div>
                        {overlayData.imagePath && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                                {overlayData.imagePath.split('/').pop()}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                Tempo de Início (segundos)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={overlayData.startTime}
                                onChange={(e) => setOverlayData(prev => ({ ...prev, startTime: parseFloat(e.target.value.replace(',', '.')) || 0 }))}
                                className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-[6px] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                Duração (segundos)
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={overlayData.duration}
                                onChange={(e) => setOverlayData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 1 }))}
                                className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-[6px] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Posição
                        </label>
                        <select
                            value={overlayData.position}
                            onChange={(e) => setOverlayData(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-[6px] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                        >
                            {positions.map(pos => (
                                <option key={pos.value} value={pos.value}>
                                    {pos.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                Tamanho (%)
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={overlayData.size}
                                onChange={(e) => setOverlayData(prev => ({ ...prev, size: parseInt(e.target.value) || 10 }))}
                                className="w-full"
                            />
                            <div className="text-center text-xs text-[var(--text-secondary)] mt-1">
                                {overlayData.size}%
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                Opacidade (%)
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={overlayData.opacity}
                                onChange={(e) => setOverlayData(prev => ({ ...prev, opacity: parseInt(e.target.value) || 10 }))}
                                className="w-full"
                            />
                            <div className="text-center text-xs text-[var(--text-secondary)] mt-1">
                                {overlayData.opacity}%
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    {overlayData.imagePath && (
                        <div className="mb-4 p-3 bg-[var(--surface-secondary)] rounded-[6px]">
                            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Preview:</p>
                            <div className="relative bg-black rounded-[4px] overflow-hidden" style={{ height: '120px' }}>
                                <img
                                    src={overlayData.imagePath}
                                    alt="Preview"
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{
                                        opacity: overlayData.opacity / 100,
                                        top: '50%',
                                        left: '50%',
                                        transform: `translate(-50%, -50%) scale(${overlayData.size / 100})`
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-4 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border-color)] flex items-center justify-end gap-2 rounded-b-[6px] -mx-4 -mb-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-[var(--surface-tertiary)] text-[var(--text-secondary)] text-xs font-medium rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!overlayData.imagePath}
                            className={`px-4 py-2 text-xs font-medium rounded-[6px] transition-colors duration-200 shadow-[0_2px_8px_rgba(14,99,156,0.4)] hover:-translate-y-px
                                ${overlayData.imagePath
                                    ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
                                    : 'bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                                }
                            `}
                        >
                            Adicionar Imagem
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OverlayModal;