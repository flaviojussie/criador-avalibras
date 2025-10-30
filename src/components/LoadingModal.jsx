import React from 'react';

const LoadingModal = ({ isOpen, message }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50 pointer-events-none"
        >
            <div className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] max-w-md w-full mx-4">
                {/* Header */}
                <div className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Processando</h2>
                </div>

                {/* Body */}
                <div className="p-6 flex items-center gap-4">
                    <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full"></div>
                    <span className="text-sm text-[var(--text-primary)]">{message || 'Por favor, aguarde...'}</span>
                </div>
            </div>
        </div>
    );
};

export default LoadingModal;