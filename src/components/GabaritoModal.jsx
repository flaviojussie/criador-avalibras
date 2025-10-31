import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggable } from '../hooks/useDraggable';

const GabaritoModal = ({ isOpen, onClose, selectedQuestion, onUpdateQuestion, questionsManager }) => {
    const { position, handleMouseDown } = useDraggable();

    const setHandleRef = useCallback(node => {
        if (node) {
            node.style.cursor = 'move';
            node.addEventListener('mousedown', handleMouseDown);
        }
        return () => {
            if (node) {
                node.removeEventListener('mousedown', handleMouseDown);
            }
        };
    }, [handleMouseDown]);

    const [selectedAnswer, setSelectedAnswer] = useState('');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSelectedAnswer(selectedQuestion?.correctAnswer || '');
        }
    }, [isOpen, selectedQuestion]);

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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedAnswer) {
            return;
        }

        // Update question with correct answer
        onUpdateQuestion(selectedQuestion.originalIndex, {
            correctAnswer: selectedAnswer
        });

        console.log(`✅ Gabarito definido: ${selectedAnswer} para ${selectedQuestion.label}`);
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !selectedQuestion) return null;

    const alternatives = ['A', 'B', 'C', 'D', 'E'].slice(0, questionsManager?.currentProject?.totalAlternatives || 4);

    const getRadioClasses = (alt) => {
        return selectedAnswer === alt
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
            : 'border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-secondary)]';
    };

    const getRadioInnerClasses = (alt) => {
        return `w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${selectedAnswer === alt ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--border-color)]'}`;
    };

    const getTextClasses = (alt) => {
        return `text-sm font-medium ${selectedAnswer === alt ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`;
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div 
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] max-w-md w-full mx-4">
                {/* Header - estilo TitleBar */}
                <div ref={setHandleRef} className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Definir Gabarito</h2>
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
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Questão: <span className="font-medium text-[var(--text-primary)]">{selectedQuestion.label}</span>
                        </p>

                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                            Resposta Correta
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {alternatives.map(alt => (
                                <label
                                    key={alt}
                                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${getRadioClasses(alt)}`}
                                >
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        value={alt}
                                        checked={selectedAnswer === alt}
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className={getRadioInnerClasses(alt)}>
                                        {selectedAnswer === alt && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className={getTextClasses(alt)}>
                                        Alternativa {alt}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

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
                            disabled={!selectedAnswer}
                            className={`px-4 py-2 text-xs font-medium rounded-[6px] transition-colors duration-200 shadow-[0_2px_8px_rgba(14,99,156,0.4)] hover:-translate-y-px
                                ${selectedAnswer
                                    ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
                                    : 'bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                                }
                            `}
                        >
                            Definir Gabarito
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GabaritoModal;