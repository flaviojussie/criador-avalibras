import React from 'react';
import { getEnvironmentMessage } from '../utils/apiService';

const LoadingSpinner = ({ message = "Carregando...", showEnvironmentInfo = false }) => {
    return (
        <div className="min-h-screen bg-[var(--surface-primary)] flex items-center justify-center p-4">
            <div className="text-center">
                <div className="mb-6">
                    {/* Spinner animado */}
                    <div className="inline-block w-12 h-12 border-4 border-[var(--border-color)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                </div>

                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {message}
                </h2>

                <p className="text-[var(--text-secondary)] mb-4">
                    Por favor, aguarde...
                </p>

                {showEnvironmentInfo && (
                    <div className="mt-6 p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <p className="text-xs text-[var(--text-secondary)]">
                            {getEnvironmentMessage()}
                        </p>
                    </div>
                )}

                {/* Loading dots */}
                <div className="flex justify-center gap-1 mt-4">
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(LoadingSpinner);