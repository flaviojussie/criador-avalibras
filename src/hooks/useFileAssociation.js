// useFileAssociation.js - Hook para gerenciar associação de arquivos
import { useState, useEffect, useCallback } from 'react';

export const useFileAssociation = (questionsManager) => {
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Processar arquivo recebido
    const processFileRequest = useCallback(async (event, { action, filePath, fileName }) => {
        console.log(`📂 Processando arquivo: ${fileName} (${action})`);

        try {
            setIsProcessing(true);

            switch (action) {
                case 'open-project':
                    // Abrir projeto existente
                    await handleOpenProject(filePath);
                    break;

                case 'open-exam':
                    // Abrir prova (para visualização - futuro)
                    await handleOpenExam(filePath);
                    break;

                case 'import-question':
                    // Importar questão
                    await handleImportQuestion(filePath);
                    break;

                default:
                    console.warn(`⚠️ Ação desconhecida: ${action}`);
            }

        } catch (error) {
            console.error('❌ Erro ao processar arquivo:', error);
            // TODO: Mostrar notificação de erro para o usuário
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Abrir projeto
    const handleOpenProject = async (filePath) => {
        try {
            // Ler o arquivo do projeto
            const fs = require('fs');
            const projectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Carregar projeto no questionsManager
            questionsManager.loadProject(projectData, filePath);

            console.log(`✅ Projeto aberto: ${filePath}`);
        } catch (error) {
            throw new Error(`Falha ao abrir projeto: ${error.message}`);
        }
    };

    // Abrir prova (futuro)
    const handleOpenExam = async (filePath) => {
        // TODO: Implementar quando o Aplicador AvaLIBRAS estiver pronto
        console.log('📋 Funcionalidade de abrir prova ainda não implementada');
    };

    // Importar questão
    const handleImportQuestion = async (filePath) => {
        try {
            // Usar API existente para importar questão
            const projectBasePath = questionsManager.currentProject.filePath;
            const result = await window.electronAPI.project.importQuestion(filePath, projectBasePath);

            if (result.success) {
                questionsManager.addQuestion(result.question);
                console.log(`✅ Questão importada: ${filePath}`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            throw new Error(`Falha ao importar questão: ${error.message}`);
        }
    };

    // Verificar se pode abrir arquivo
    const canOpenFile = useCallback(async (filePath) => {
        try {
            return await window.electronAPI.fileAssociation.canOpenFile(filePath);
        } catch (error) {
            console.error('❌ Erro ao verificar arquivo:', error);
            return { canOpen: false, error: error.message };
        }
    }, []);

    // Abrir arquivos via API
    const openFiles = useCallback(async (filePaths) => {
        try {
            setIsProcessing(true);
            const results = await window.electronAPI.fileAssociation.openFiles(filePaths);
            console.log('📂 Resultados da abertura:', results);
            return results;
        } catch (error) {
            console.error('❌ Erro ao abrir arquivos:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Configurar listener para eventos de abertura
    useEffect(() => {
        if (window.electronAPI?.fileAssociation?.onOpenFileRequest) {
            window.electronAPI.fileAssociation.onOpenFileRequest(processFileRequest);
        }

        return () => {
            if (window.electronAPI?.fileAssociation?.removeOpenFileListener) {
                window.electronAPI.fileAssociation.removeOpenFileListener();
            }
        };
    }, [processFileRequest]);

    // Verificar se há arquivos pendentes ao iniciar
    useEffect(() => {
        // Verificar se há arquivos na fila
        if (pendingFiles.length > 0) {
            console.log('📂 Processando arquivos pendentes:', pendingFiles);
            openFiles(pendingFiles);
            setPendingFiles([]);
        }
    }, [pendingFiles, openFiles]);

    return {
        // Estado
        isProcessing,
        pendingFiles,

        // Ações
        canOpenFile,
        openFiles,

        // Interno
        processFileRequest
    };
};