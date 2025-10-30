import React, { useEffect } from 'react';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

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

    const shortcuts = [
        { category: 'Arquivo', items: [
            { shortcut: 'Ctrl + N', description: 'Novo Projeto' },
            { shortcut: 'Ctrl + S', description: 'Salvar Projeto' },
            { shortcut: 'Ctrl + O', description: 'Abrir Projeto' },
            { shortcut: 'Ctrl + E', description: 'Exportar Prova' },
        ]},
        { category: 'Edição', items: [
            { shortcut: 'Ctrl + Z', description: 'Desfazer' },
            { shortcut: 'Ctrl + Shift + Z', description: 'Refazer' },
            { shortcut: 'Ctrl + A', description: 'Selecionar Tudo' },
        ]},
        { category: 'Questão', items: [
            { shortcut: 'Ctrl + Shift + N', description: 'Adicionar Nova Questão' },
            { shortcut: 'Ctrl + D', description: 'Duplicar Questão Atual' },
            { shortcut: 'Del', description: 'Remover Questão' },
        ]},
        { category: 'Vídeo', items: [
            { shortcut: 'Espaço', description: 'Play/Pause Vídeo' },
            { shortcut: 'Seta Esquerda', description: 'Frame Anterior' },
            { shortcut: 'Seta Direita', description: 'Próximo Frame' },
        ]},
        { category: 'Interface', items: [
            { shortcut: 'Esc', description: 'Fechar Modal/Cancelar' },
            { shortcut: 'F12', description: 'Developer Tools' },
            { shortcut: 'Ctrl + ,', description: 'Configurações' },
        ]}
    ];

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] w-full mx-4 max-w-lg">
                {/* Header - estilo TitleBar */}
                <div className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Atalhos de Teclado</h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] rounded-[3px] transition-colors"
                        aria-label="Fechar"
                    >
                        <i className="fas fa-times w-4 h-4"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[65vh]">
                    {shortcuts.map((category, index) => (
                        <div key={index} className="mb-6 last:mb-0">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-3 pb-1 border-b border-[var(--border-color)]">
                                {category.category}
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {category.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex justify-between items-center py-2 px-3 rounded hover:bg-[var(--surface-secondary)] transition-colors">
                                        <span className="font-mono text-[var(--text-secondary)] bg-[var(--surface-tertiary)] px-2 py-1 rounded text-sm">
                                            {item.shortcut}
                                        </span>
                                        <span className="text-[var(--text-primary)] text-sm flex-1 ml-3">
                                            {item.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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

export default KeyboardShortcutsModal;