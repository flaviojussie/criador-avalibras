import React from 'react';
import { useElectron } from '../hooks/useElectron';
import Menu from './Menu';
import Icon, {
    faWindowMinimize,
    faWindowMaximize,
    faWindowRestore,
    faTimes
} from './Icon';
import '../styles/Menu.css';

const TitleBar = ({ menuItems }) => {
    const { isElectron, minimizeApp, maximizeApp, closeApp, isMaximized } = useElectron();

    if (!isElectron) {
        // Se não estiver no Electron, não renderiza a TitleBar customizada
        return null;
    }

    return (
        <header className="h-9 bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] flex items-center justify-between px-3 border-b border-[var(--border-color)] shadow-[0_1px_3px_rgba(0,0,0,0.2)] flex-shrink-0">
            <Menu items={menuItems} />
            <span className="text-xs text-[var(--text-secondary)]">Criador AvaLIBRAS</span>
            <div className="flex items-center h-full">
                 <div 
                    className="h-full w-12 flex items-center justify-center text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                    aria-label="Minimizar"
                    onClick={minimizeApp}
                 >
                    <Icon icon={faWindowMinimize} className="w-3 h-3" />
                 </div>
                 <div 
                    className="h-full w-12 flex items-center justify-center text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                    aria-label={isMaximized ? "Restaurar" : "Maximizar"}
                    onClick={maximizeApp}
                 >
                    <Icon icon={isMaximized ? faWindowRestore : faWindowMaximize} className="w-3 h-3" />
                 </div>
                 <div 
                    className="h-full w-12 flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--error)] hover:text-white transition-colors cursor-pointer"
                    aria-label="Fechar"
                    onClick={closeApp}
                 >
                    <Icon icon={faTimes} className="w-3 h-3" />
                 </div>
            </div>
        </header>
    );
};

export default TitleBar;