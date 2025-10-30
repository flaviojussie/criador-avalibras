import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Atualiza o state para que o próximo render mostre a UI alternativa
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Você pode registrar o erro em um serviço de relatório de erros
        console.error('🚨 ErrorBoundary: Erro capturado:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Em desenvolvimento, mostrar mais detalhes
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            console.group('🐛 Detalhes do Erro');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Component Stack:', errorInfo.componentStack);
            console.groupEnd();
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Você pode renderizar qualquer UI alternativa
            return (
                <div className="min-h-screen bg-[var(--surface-primary)] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[var(--surface-secondary)] rounded-lg shadow-lg p-6 text-center">
                        <div className="mb-4">
                            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle w-8 h-8 text-red-600"></i>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            Ocorreu um erro inesperado
                        </h2>

                        <p className="text-[var(--text-secondary)] mb-6">
                            {typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
                                ? 'Detalhes do erro disponíveis no console.'
                                : 'A aplicação encontrou um problema e precisa ser recarregada.'}
                        </p>

                        {typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mb-4 p-3 bg-red-50 rounded border border-red-200">
                                <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                                    Detalhes do erro (desenvolvimento)
                                </summary>
                                <div className="mt-2 text-xs text-red-700">
                                    <p className="font-mono break-all mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-opacity-90 transition-colors"
                            >
                                Tentar novamente
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-[var(--surface-tertiary)] text-[var(--text-primary)] rounded-md hover:bg-opacity-80 transition-colors"
                            >
                                Recarregar página
                            </button>
                        </div>

                        {typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'development' && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-4">
                                Se o problema persistir, entre em contato com o suporte técnico.
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;