/**
 * Sistema centralizado de tratamento de erros
 * Fornece handling consistente para toda a aplicação
 */

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.listeners = [];
    }

    /**
     * Registra um erro
     * @param {Error|string} error - Erro para registrar
     * @param {Object} context - Contexto adicional do erro
     */
    log(error, context = {}) {
        const errorObj = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            message: error?.message || String(error),
            stack: error?.stack,
            context,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            url: typeof window !== 'undefined' ? window.location?.href : 'Unknown'
        };

        // Adicionar ao início do array (mais recentes primeiro)
        this.errors.unshift(errorObj);

        // Manter apenas os erros mais recentes
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Log no console
        console.group('🚨 Erro Registrado');
        console.error('Mensagem:', errorObj.message);
        console.error('Contexto:', context);
        if (errorObj.stack) {
            console.error('Stack:', errorObj.stack);
        }
        console.groupEnd();

        // Notificar listeners
        this.notifyListeners(errorObj);

        return errorObj;
    }

    /**
     * Trata erro de forma assíncrona
     * @param {Function} fn - Função que pode lançar erro
     * @param {Object} context - Contexto do erro
     */
    async safeAsync(fn, context = {}) {
        try {
            return await fn();
        } catch (error) {
            this.log(error, context);
            throw error; // Re-lançar para tratamento adicional
        }
    }

    /**
     * Trata erro de forma síncrona
     * @param {Function} fn - Função que pode lançar erro
     * @param {Object} context - Contexto do erro
     */
    safe(fn, context = {}) {
        try {
            return fn();
        } catch (error) {
            this.log(error, context);
            throw error; // Re-lançar para tratamento adicional
        }
    }

    /**
     * Adiciona listener para novos erros
     * @param {Function} listener - Função para receber notificações de erro
     */
    addListener(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notifica todos os listeners sobre novo erro
     * @param {Object} error - Objeto de erro
     */
    notifyListeners(error) {
        this.listeners.forEach(listener => {
            try {
                listener(error);
            } catch (e) {
                console.error('Erro no listener de tratamento de erros:', e);
            }
        });
    }

    /**
     * Obtém erros recentes
     * @param {number} limit - Número máximo de erros para retornar
     */
    getRecentErrors(limit = 10) {
        return this.errors.slice(0, limit);
    }

    /**
     * Limpa histórico de erros
     */
    clear() {
        this.errors = [];
    }

    /**
     * Obtém estatísticas dos erros
     */
    getStats() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recentErrors = this.errors.filter(e =>
            new Date(e.timestamp).getTime() > last24h
        );

        return {
            total: this.errors.length,
            last24h: recentErrors.length,
            lastError: this.errors[0]?.timestamp || null
        };
    }

    /**
     * Cria um wrapper para funções de API
     * @param {Function} apiFunction - Função de API para envolver
     * @param {string} operation - Nome da operação
     */
    wrapApiCall(apiFunction, operation) {
        return async (...args) => {
            return this.safeAsync(
                () => apiFunction(...args),
                {
                    operation,
                    args: args.length > 0 ? '[args ocultos]' : undefined,
                    type: 'api_call'
                }
            );
        };
    }

    /**
     * Cria um wrapper para handlers de eventos
     * @param {Function} handler - Handler de evento
     * @param {string} eventName - Nome do evento
     */
    wrapEventHandler(handler, eventName) {
        return (...args) => {
            return this.safe(
                () => handler(...args),
                {
                    eventName,
                    args: args.length > 0 ? '[args ocultos]' : undefined,
                    type: 'event_handler'
                }
            );
        };
    }
}

// Instância global
const errorHandler = new ErrorHandler();

// Interceptador de erros não capturados
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        errorHandler.log(event.error, {
            type: 'uncaught_error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        errorHandler.log(event.reason, {
            type: 'unhandled_promise_rejection',
            promise: event.promise
        });
    });
}

export default errorHandler;
export { ErrorHandler };