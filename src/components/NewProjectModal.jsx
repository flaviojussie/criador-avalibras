import React, { useState, useEffect, useRef } from 'react';

const NewProjectModal = ({ isOpen, onClose, onCreateProject }) => {
    const [projectName, setProjectName] = useState('');
    const [alternatives, setAlternatives] = useState(4);
    const [errors, setErrors] = useState({});
    const inputRef = useRef(null);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setProjectName('');
            setAlternatives(4);
            setErrors({});
            // Focus on project name input when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

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

    const validateForm = () => {
        const newErrors = {};

        if (!projectName.trim()) {
            newErrors.projectName = 'Nome do projeto é obrigatório';
        } else if (projectName.trim().length < 3) {
            newErrors.projectName = 'Nome deve ter pelo menos 3 caracteres';
        }

        if (alternatives < 2 || alternatives > 5) {
            newErrors.alternatives = 'Número de alternativas deve ser entre 2 e 5';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onCreateProject({
                name: projectName.trim(),
                totalAlternatives: alternatives
            });
            onClose();
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] max-w-md w-full mx-4">
                {/* Header - estilo TitleBar */}
                <div className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Novo Projeto</h2>
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
                    {/* Nome do Projeto */}
                    <div className="mb-4">
                        <label htmlFor="projectName" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Nome do Projeto
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className={`w-full px-3 py-2 bg-[var(--surface-secondary)] border rounded-[6px] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 transition-colors duration-200 ${
                                errors.projectName
                                    ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]'
                                    : 'border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]'
                            }`}
                            placeholder="Ex: Avaliação de Ciências - Corpo Humano"
                            maxLength={100}
                        />
                        {errors.projectName && (
                            <p className="mt-1 text-xs text-[var(--error)]">{errors.projectName}</p>
                        )}
                    </div>


                    {/* Número de Alternativas */}
                    <div className="mb-6">
                        <label htmlFor="alternatives" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Número de Alternativas por Questão
                        </label>
                        <select
                            id="alternatives"
                            value={alternatives}
                            onChange={(e) => setAlternatives(Number(e.target.value))}
                            className={`w-full px-3 py-2 bg-[var(--surface-secondary)] border rounded-[6px] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 transition-colors duration-200 ${
                                errors.alternatives
                                    ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]'
                                    : 'border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]'
                            }`}
                        >
                            <option value="2">2 (A-B)</option>
                            <option value="3">3 (A-B-C)</option>
                            <option value="4">4 (A-B-C-D)</option>
                            <option value="5">5 (A-B-C-D-E)</option>
                        </select>
                        {errors.alternatives && (
                            <p className="mt-1 text-xs text-[var(--error)]">{errors.alternatives}</p>
                        )}
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
                            className="px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-[6px] hover:bg-[var(--accent-primary-hover)] transition-colors duration-200 shadow-[0_2px_8px_rgba(14,99,156,0.4)] hover:-translate-y-px"
                        >
                            Criar Projeto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;