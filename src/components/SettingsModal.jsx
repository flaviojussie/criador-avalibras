import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import Icon from './Icon';
import { faFolderOpen, faTimes } from '@fortawesome/free-solid-svg-icons';

const SettingsModal = ({ visible = false, onClose, showNotification, settings, onSettingsChange }) => {
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
    const [activeTab, setActiveTab] = useState('general');

    const handleSettingChange = (key, value) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const handleBrowseDefaultSavePath = async () => {
        if (window.electronAPI?.showOpenDialog) {
            const result = await window.electronAPI.showOpenDialog({
                title: 'Selecionar Pasta Padrão para Salvar Projetos',
                properties: ['openDirectory']
            });
            if (!result.canceled && result.filePaths.length > 0) {
                handleSettingChange('defaultSavePath', result.filePaths[0]);
            }
        }
    };

    const handleClearTempFiles = async () => {
        if (!showNotification) {
            console.error('showNotification não está disponível.');
            return;
        }
        if (window.electronAPI?.system?.clearTempFiles) { // Supondo que esta API exista ou será criada
            const result = await window.electronAPI.system.clearTempFiles();
            if (result.success) {
                showNotification('Arquivos temporários limpos com sucesso!', 'success');
            } else {
                showNotification('Erro ao limpar arquivos temporários: ' + result.error, 'error');
            }
        } else {
            showNotification('Funcionalidade de limpeza de arquivos temporários não disponível.', 'error');
        }
    };

    const videoQualityPresets = {
        draft: { name: 'Rascunho (Arquivo Menor)', description: 'Qualidade mais baixa, processamento mais rápido. Ideal para testes.' },
        balanced: { name: 'Balanceado (Recomendado)', description: 'Equilíbrio entre qualidade e tamanho do arquivo.' },
        high: { name: 'Alta Qualidade (Arquivo Maior)', description: 'Melhor qualidade visual, processamento mais lento.' }
    };

    const tabs = [
        { id: 'general', label: 'Geral' },
        { id: 'qualityExport', label: 'Qualidade e Exportação' },
    ];

    const renderGeneralTab = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Pasta Padrão para Salvar Projetos
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={settings.defaultSavePath}
                        readOnly
                        className="flex-1 p-2 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-color)] text-sm"
                        placeholder="Nenhuma pasta selecionada"
                    />
                    <button
                        onClick={handleBrowseDefaultSavePath}
                        className="px-3 py-2 bg-[var(--accent-primary)] text-white text-sm rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        <Icon icon={faFolderOpen} className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.autoUpdateCheck}
                        onChange={(e) => handleSettingChange('autoUpdateCheck', e.target.checked)}
                        className="mr-2"
                    />
                    <span className="text-sm">Verificar atualizações automaticamente ao iniciar</span>
                </label>
              </div>

            <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Gerenciamento de Cache</h4>
                <button
                    onClick={handleClearTempFiles}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                    Limpar Arquivos Temporários
                </button>
            </div>
        </div>
    );

    const renderQualityExportTab = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Qualidade do Vídeo (ao aplicar overlays)
                </label>
                <div className="grid grid-cols-1 gap-3">
                    {Object.entries(videoQualityPresets).map(([key, preset]) => (
                        <button
                            key={key}
                            onClick={() => handleSettingChange('videoQuality', key)}
                            className={`p-4 text-left border rounded-md transition-all duration-200 text-sm
                                ${settings.videoQuality === key
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/30'
                                    : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--surface-quaternary)]/50'
                                }`
                            }
                        >
                            <div className="font-semibold text-[var(--text-primary)]">{preset.name}</div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1">{preset.description}</div>
                        </button>
                    ))}
                </div>
            </div>

  
            <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Compressão de Projeto (.ava)</h4>
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                    Controla o nível de compressão dos arquivos de projeto ao exportar. Níveis mais altos resultam em arquivos menores, mas podem levar mais tempo.
                </p>
                <select
                    value={settings.projectCompressionLevel}
                    onChange={(e) => handleSettingChange('projectCompressionLevel', e.target.value)}
                    className="w-full p-2 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-color)] text-sm"
                >
                    <option value="-1">Padrão (Equilibrado)</option>
                    <option value="0">Nenhuma (Mais Rápido)</option>
                    <option value="1">Baixa (Rápido)</option>
                    <option value="5">Média</option>
                    <option value="9">Melhor (Mais Lento)</option>
                </select>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralTab();
            case 'qualityExport':
                return renderQualityExportTab();
            default:
                return renderGeneralTab();
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50" onClick={onClose}>
            <div 
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                className="bg-[var(--surface-primary)] border border-[var(--border-color)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-lg w-full mx-4 max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div ref={setHandleRef} className="bg-gradient-to-b from-[#3c3c3c] to-[#2d2d2d] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between rounded-t-[6px]">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Configurações do AvaLIBRAS</h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-quaternary)] rounded-sm transition-colors"
                        aria-label="Fechar"
                    >
                        <i className="fas fa-times w-4 h-4"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-color)]">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 max-h-[calc(90vh-160px)] overflow-y-auto"> {/* Adjusted max-height */}
                    {renderTabContent()}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border-color)] flex items-center justify-end gap-2 rounded-b-[6px]">
                     <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--surface-tertiary)] text-xs text-[var(--text-secondary)] font-medium rounded-md border border-[var(--border-color)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
