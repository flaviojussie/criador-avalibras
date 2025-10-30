import React, { useState, useEffect, useRef } from 'react';

const EncryptModal = ({ isOpen, onClose, onConfirm }) => {
    const [usePassword, setUsePassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const passwordInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setUsePassword(false);
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        // Focus password input when protection is enabled
        if (usePassword) {
            passwordInputRef.current?.focus();
        }
    }, [usePassword]);

    const handleConfirm = () => {
        if (usePassword) {
            if (!password) {
                setError('A senha não pode estar em branco.');
                return;
            }
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
        }
        // On confirm, pass the password (or null if not used)
        onConfirm(usePassword ? password : null);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[6px] max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Proteger Prova</h2>
                    <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] rounded-[3px] transition-colors" aria-label="Fechar">
                        <i className="fas fa-times w-4 h-4"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    <label className="flex items-center cursor-pointer mb-4">
                        <input
                            type="checkbox"
                            checked={usePassword}
                            onChange={(e) => setUsePassword(e.target.checked)}
                            className="mr-3 h-4 w-4"
                        />
                        <span className="text-sm text-[var(--text-primary)]">Proteger com senha?</span>
                    </label>

                    {usePassword && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                    Senha
                                </label>
                                <input
                                    ref={passwordInputRef}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--surface-secondary)] border rounded-[6px] text-sm text-[var(--text-primary)] border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                    Confirmar Senha
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--surface-secondary)] border rounded-[6px] text-sm text-[var(--text-primary)] border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                />
                            </div>
                            {error && <p className="text-xs text-[var(--error)] mt-2">{error}</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border-color)] flex items-center justify-end gap-2 rounded-b-[6px]">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-[var(--surface-tertiary)] text-[var(--text-secondary)] text-xs font-medium rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)] transition-colors duration-200">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-[6px] hover:bg-[var(--accent-primary-hover)] transition-colors duration-200 shadow-[0_2px_8px_rgba(14,99,156,0.4)] hover:-translate-y-px">
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EncryptModal;