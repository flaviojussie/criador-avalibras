import React, { useEffect } from 'react';

const AboutModal = ({ isOpen, onClose, version = 'v2.0.0' }) => {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] w-full mx-4 max-w-md">
                {/* Header - estilo TitleBar */}
                <div className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Sobre o AvaLIBRAS</h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] rounded-[3px] transition-colors"
                        aria-label="Fechar"
                    >
                        <i className="fas fa-times w-4 h-4"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="text-center mb-4">
                        <div className="text-xl font-bold text-[var(--accent-primary)]">AvaLIBRAS</div>
                        <div className="text-[var(--text-secondary)] text-sm mt-1">Sistema de Videoprovas em Libras</div>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Versão:</span>
                            <span className="font-mono text-[var(--text-primary)]">{version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Status:</span>
                            <span className="text-green-500">Estável</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Plataforma:</span>
                            <span className="text-[var(--text-primary)]">Windows / Linux</span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-3">
                            O AvaLIBRAS é uma ferramenta desenvolvida para promover a inclusão e equidade
                            na avaliação educacional para estudantes surdos, permitindo a criação de
                            videoprovas em Língua Brasileira de Sinais (LIBRAS).
                        </p>

                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2">Desenvolvedor</h3>
                            <p className="text-[var(--text-secondary)] text-xs">
                                Flávio Jussiê Ribeiro Fernandes<br />
                                Programa de Pós-Graduação em Tecnologia Educacional<br />
                                Universidade Federal do Ceará (UFC)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border-color)] flex items-center justify-end gap-2 rounded-b-[6px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--surface-tertiary)] text-[var(--text-secondary)] text-xs font-medium rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-[6px] hover:bg-[var(--accent-primary-hover)] transition-colors duration-200 shadow-[0_2px_8px_rgba(14,99,156,0.4)] hover:-translate-y-px"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;