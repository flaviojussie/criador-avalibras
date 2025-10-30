import React, { useState, useCallback, useRef, useEffect } from 'react';
import apiService, { onAppClosing, forceQuitApp } from './utils/apiService';

// Import hooks originais
import { useQuestions } from './hooks/useQuestions';
import { useOverlay } from './hooks/useOverlay';

const AppSimple = () => {
    console.log('🚀 AppSimple: Iniciando componente');

    // Existing state
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });

    // Original hooks
    const questionsManager = useQuestions();
    const videoPlayerRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayManager = useOverlay(canvasRef, videoPlayerRef);

    // Estado para verificar se APIs estão prontas
    const [apiReady, setApiReady] = useState(false);

    // Notification system
    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    // Inicializar APIs
    useEffect(() => {
        const initializeAPIs = async () => {
            try {
                await apiService.waitUntilReady();
                setApiReady(true);
                console.log('✅ APIs inicializadas com sucesso');
            } catch (error) {
                console.error('❌ Erro ao inicializar APIs:', error);
                setApiReady(true);
            }
        };

        initializeAPIs();
    }, []);

    // Listener para fechamento
    useEffect(() => {
        const removeListener = onAppClosing(() => {
            console.log('App fechando...');
        });

        return () => {
            if (removeListener) {
                removeListener();
            }
        };
    }, []);

    // Mostrar loading durante inicialização
    if (isLoading) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#1e1e1e',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '18px'
            }}>
                Carregando AvaLIBRAS...
            </div>
        );
    }

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#1e1e1e',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif',
            padding: '20px'
        }}>
            {/* BARRA DE TESTE VERMELHA */}
            <div style={{
                backgroundColor: '#ff0000',
                padding: '20px',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                borderRadius: '5px'
            }}>
                🧪 AVALIBRAS - TESTE VISUAL FUNCIONANDO!
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <h1>Sistema AvaLIBRAS</h1>
                <p>Aplicação carregada com sucesso!</p>

                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#333',
                    borderRadius: '5px'
                }}>
                    <h2>Status dos Componentes:</h2>
                    <ul>
                        <li>✅ React: Funcionando</li>
                        <li>✅ useQuestions: {questionsManager ? 'Carregado' : 'Não carregado'}</li>
                        <li>✅ useOverlay: {overlayManager ? 'Carregado' : 'Não carregado'}</li>
                        <li>✅ API Service: {apiReady ? 'Pronta' : 'Aguardando'}</li>
                    </ul>
                </div>

                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#444',
                    borderRadius: '5px'
                }}>
                    <h2>Informações do Sistema:</h2>
                    <p>Projetos: {questionsManager?.currentProject?.name || 'Nenhum'}</p>
                    <p>Questões: {questionsManager?.getQuestionCount() || 0}</p>
                    <p>Status: {isLoading ? 'Carregando' : 'Pronto'}</p>
                </div>

                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#555',
                    borderRadius: '5px'
                }}>
                    <h2>Ações Teste:</h2>
                    <button
                        onClick={() => showNotification('Teste de notificação!', 'success')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#0e639c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Testar Notificação
                    </button>

                    <button
                        onClick={() => questionsManager?.addQuestion()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Adicionar Questão
                    </button>
                </div>
            </div>

            {/* Notificação */}
            {notification.visible && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '15px 20px',
                    backgroundColor: notification.type === 'success' ? '#28a745' :
                                     notification.type === 'error' ? '#dc3545' : '#007bff',
                    color: 'white',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    zIndex: 1000
                }}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default AppSimple;