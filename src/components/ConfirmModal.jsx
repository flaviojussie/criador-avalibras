import React, { useEffect, useRef, useCallback } from 'react';
import { useDraggable } from '../hooks/useDraggable';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
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

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div 
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] max-w-md w-full mx-4">
                {/* Header */}
                <div ref={setHandleRef} className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle w-4 h-4 text-yellow-400"></i>
                        {title}
                    </h2>
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
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border-color)] flex items-center justify-end gap-2 rounded-b-[6px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--surface-tertiary)] text-[var(--text-secondary)] text-xs font-medium rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 text-xs font-medium rounded-[6px] transition-colors duration-200 shadow-[0_2px_8px_rgba(220,38,38,0.4)] hover:-translate-y-px bg-red-600 text-white hover:bg-red-700`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;