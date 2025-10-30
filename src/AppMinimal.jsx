import React from 'react';

// App mínimo para debug
const AppMinimal = () => {
    console.log('🚀 AppMinimal: Renderizando componente mínimo');

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f0f0f0',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>
                🧪 AvaLIBRAS - Modo Debug
            </h1>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <h2>Aplicação Carregando com Sucesso!</h2>
                <p>Se você está vendo esta mensagem, o React está funcionando.</p>
                <p>O problema pode estar nos hooks ou componentes principais.</p>

                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '4px' }}>
                    <strong>Informações de Debug:</strong>
                    <ul>
                        <li>React: ✅ Funcionando</li>
                        <li>Render: ✅ Funcionando</li>
                        <li>Estilo CSS: ✅ Funcionando</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AppMinimal;