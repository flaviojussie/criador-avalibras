// Forçando recarga para limpar cache do Vite.
import React, { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Statusbar from './components/Statusbar';
import NewProjectModal from './components/NewProjectModal';
import GabaritoModal from './components/GabaritoModal';
import OverlayModal from './components/OverlayModal';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmModal from './components/ConfirmModal';
import AboutModal from './components/AboutModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import LoadingModal from './components/LoadingModal';
import SettingsModal from './components/SettingsModal';
import EncryptModal from './components/EncryptModal';
import apiService, { onAppClosing, forceQuitApp } from './utils/apiService';
import '@fortawesome/react-fontawesome';

// Import new hooks
import { useQuestions } from './hooks/useQuestions';
import { useOverlay } from './hooks/useOverlay';
import { useVideoEditor } from './hooks/useVideoEditor';
import { useFileAssociation } from './hooks/useFileAssociation';

const App = () => {
    // Existing state
    const [sidebarWidth, setSidebarWidth] = useState(480);
    const [isResizing, setIsResizing] = useState(false);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isGabaritoModalOpen, setIsGabaritoModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [overlayModalState, setOverlayModalState] = useState({ isOpen: false, mode: 'add', data: null });
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen] = useState(false);
    const [isPerformanceSettingsOpen, setIsPerformanceSettingsOpen] = useState(false);
    const [loadingState, setLoadingState] = useState({ isOpen: false, message: '' });
    const [appSettings, setAppSettings] = useState({}); // Novo estado para configurações do aplicativo
    const [encryptModalState, setEncryptModalState] = useState({ isOpen: false, exportType: null, question: null });
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });
    const mainRef = useRef(null);
    const sidebarRef = useRef(null);
    const canvasRef = useRef(null);

    // New hook integrations
    const questionsManager = useQuestions();
    const videoPlayerRef = useRef(null);
    const overlayManager = useOverlay(canvasRef, videoPlayerRef);
    const timelineRef = useRef(null);
    const videoEditor = useVideoEditor(videoPlayerRef, timelineRef, questionsManager, questionsManager.getActiveQuestion());

    // File association hook
    const fileAssociation = useFileAssociation(questionsManager);

    // Estado para verificar se APIs estão prontas
    const [apiReady, setApiReady] = useState(false);

    // Notification system - moved before other functions to avoid hoisting issues
    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, 3000);
    }, []);

    // Debug function to clear state (for development)
    const handleClearState = useCallback(() => {
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' && window.confirm('Tem certeza que deseja limpar todo o estado da aplicação? Isso irá limpar todos os projetos e questões.')) {
            questionsManager.clearAllState();
            showNotification('Estado da aplicação limpo com sucesso!', 'success');
        }
    }, [questionsManager, showNotification]);

    // Expose debug function in development
    useEffect(() => {
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            window.clearAppState = handleClearState;
        }
    }, [handleClearState]);

    // Check if should show modal on initial load
    useEffect(() => {
        // Show modal if it's the default project and no questions exist
        const currentProject = questionsManager.currentProject;
        if (currentProject.name === 'Projeto sem Título' &&
            currentProject.questions.length === 0 &&
            !currentProject.isDirty) {
            setIsNewProjectModalOpen(true);
        }
    }, [questionsManager.currentProject]);

    // Inicializar verificação das APIs
    useEffect(() => {
        const initializeAPIs = async () => {
            try {
                // Aguardar APIs ficarem prontas
                await apiService.waitUntilReady();
                setApiReady(true);
            } catch (error) {
                console.error('❌ Erro ao inicializar APIs:', error);
                // Ainda marcar como pronto para não travar a aplicação
                setApiReady(true);
            }
        };

        initializeAPIs();
    }, []);

    // Gerenciamento de Configurações
    useEffect(() => {
        // Carrega as configurações na montagem do componente
        const loadAppSettings = async () => {
            if (window.electronAPI?.settings) {
                try {
                    const settings = await window.electronAPI.settings.get();
                    setAppSettings(settings);
                } catch (error) {
                    console.error('Erro ao carregar configurações do aplicativo:', error);
                }
            }
        };
        loadAppSettings();
    }, []);

    useEffect(() => {
        // Salva as configurações sempre que elas mudam
        if (window.electronAPI?.settings && Object.keys(appSettings).length > 0) {
            window.electronAPI.settings.save(appSettings);
        }
    }, [appSettings]);

    // Listener para o evento de fechamento da aplicação
    useEffect(() => {
        const removeListener = onAppClosing(() => {
            setIsCloseModalOpen(true);
        });

        return () => {
            if (removeListener) {
                removeListener();
            }
        };
    }, []);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (isResizing && mainRef.current) {
            const newWidth = e.clientX - mainRef.current.offsetLeft;
            if (newWidth >= 350 && newWidth <= 700) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Project management event handlers
    const handleProjectSave = useCallback(async () => {
        if (!window.electronAPI) {
            showNotification('API Electron não disponível', 'error');
            return;
        }

        try {
            setLoadingState({ isOpen: true, message: 'Salvando projeto...' });
            let filePathToSave = questionsManager.currentProject.filePath;

            // If project has no path yet (new project), or if it's a 'Save As' scenario
            if (!filePathToSave) {
                const defaultPath = await window.electronAPI.path.join(appSettings.defaultSavePath || '', `${questionsManager.currentProject.name}.avaprojet`);
                const result = await window.electronAPI.showSaveDialog({
                    title: 'Salvar Projeto',
                    defaultPath: defaultPath,
                    filters: [
                        { name: 'AvaLIBRAS Projects', extensions: ['avaprojet'] },
                        { name: 'JSON Files', extensions: ['json'] }
                    ]
                });

                if (result.canceled || !result.filePath) {
                    setIsLoading(false);
                    return; // User canceled save dialog
                }
                filePathToSave = result.filePath;
            }

            const projectData = questionsManager.currentProject;
            const saveResult = await window.electronAPI.project.saveProject(projectData, filePathToSave);
            if (saveResult.success) {
                questionsManager.saveProject(filePathToSave); // Pass the new path to update state
                showNotification('Projeto salvo com sucesso!', 'success');
            } else {
                showNotification('Erro ao salvar projeto', 'error');
            }
        } finally {
            setLoadingState({ isOpen: false, message: '' });
        }
    }, [questionsManager, showNotification, appSettings.defaultSavePath]);

    const handleProjectSaveAs = useCallback(async () => {
        if (!window.electronAPI) {
            showNotification('API Electron não disponível', 'error');
            return;
        }

        try {
            setLoadingState({ isOpen: true, message: 'Salvando projeto...' });
            const defaultPath = await window.electronAPI.path.join(appSettings.defaultSavePath || '', `${questionsManager.currentProject.name}.avaprojet`);
            const result = await window.electronAPI.showSaveDialog({
                title: 'Salvar Projeto Como...',
                defaultPath: defaultPath,
                filters: [
                    { name: 'AvaLIBRAS Projects', extensions: ['avaprojet'] },
                    { name: 'JSON Files', extensions: ['json'] }
                ]
            });

            if (result.canceled || !result.filePath) {
                setIsLoading(false);
                return; // User canceled save dialog
            }

            const filePathToSave = result.filePath;
            const projectData = questionsManager.currentProject;
            const saveResult = await window.electronAPI.project.saveProject(projectData, filePathToSave);
            if (saveResult.success) {
                questionsManager.saveProject(filePathToSave); // Pass the new path to update state
                showNotification('Projeto salvo com sucesso como!', 'success');
            } else {
                showNotification('Erro ao salvar projeto como', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar projeto como:', error);
            showNotification('Erro ao salvar projeto como', 'error');
        } finally {
            setLoadingState({ isOpen: false, message: '' });
        }
    }, [questionsManager, showNotification, appSettings.defaultSavePath]);

    const handleProjectLoad = useCallback(async () => {
        if (!window.electronAPI) {
            showNotification('API Electron não disponível', 'error');
            return;
        }

        try {
            setLoadingState({ isOpen: true, message: 'Carregando projeto...' });
            const result = await window.electronAPI.showOpenDialog({
                title: 'Carregar Projeto',
                defaultPath: appSettings.defaultSavePath || '',
                filters: [
                    { name: 'AvaLIBRAS Projects', extensions: ['avaprojet'] },
                    { name: 'JSON Files', extensions: ['json'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const loadResult = await window.electronAPI.project.loadProject(result.filePaths[0]);
                if (loadResult.success) {
                    questionsManager.loadProject(loadResult.projectData);
                    showNotification('Projeto carregado com sucesso!', 'success');
                } else {
                    showNotification('Erro ao carregar projeto', 'error');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar projeto:', error);
            showNotification('Erro ao carregar projeto', 'error');
        } finally {
            setLoadingState({ isOpen: false, message: '' });
        }
    }, [questionsManager, showNotification, appSettings.defaultSavePath]);

    const handleProjectExport = useCallback(() => {
        setEncryptModalState({ isOpen: true, exportType: 'project', question: null });
    }, []);

    const handleExportQuestion = useCallback(async (question) => {
        if (!window.electronAPI) {
            showNotification('API Electron não disponível', 'error');
            return;
        }

        if (!question || !question.isCompleted) {
            showNotification('A questão precisa ser finalizada antes de exportar.', 'error');
            return;
        }

        try {
            const result = await window.electronAPI.showSaveDialog({
                title: 'Exportar Questão',
                defaultPath: `${question.label}.avaquest`,
                filters: [{ name: 'AvaLIBRAS Question Files', extensions: ['avaquest'] }]
            });

            if (result.canceled || !result.filePath) return;

            setLoadingState({ isOpen: true, message: 'Exportando questão...' });
            
            const compressionLevel = parseInt(appSettings.projectCompressionLevel || -1);
            const exportResult = await window.electronAPI.exportQuestion(question, result.filePath, compressionLevel);

            if (exportResult.success) {
                showNotification('Questão exportada com sucesso!', 'success');
            } else {
                showNotification('Erro ao exportar questão', 'error');
            }
        } catch (error) {
            console.error('Erro ao exportar questão:', error);
            showNotification('Erro ao exportar questão', 'error');
        } finally {
            setLoadingState({ isOpen: false, message: '' });
        }
    }, [appSettings, showNotification]);

    const handleProceedWithExport = useCallback(async (password) => {
        const { exportType } = encryptModalState;
        setEncryptModalState({ isOpen: false, exportType: null, question: null });

        if (exportType !== 'project') return;

        try {
            const result = await window.electronAPI.showSaveDialog({
                title: 'Exportar Prova',
                defaultPath: `${questionsManager.currentProject.name}.ava`,
                filters: [{ name: 'AvaLIBRAS Files', extensions: ['ava'] }]
            });

            if (result.canceled || !result.filePath) return;

            setLoadingState({ isOpen: true, message: 'Exportando projeto...' });

            const compressionLevel = parseInt(appSettings.projectCompressionLevel || -1);
            const exportResult = await window.electronAPI.exportProject(questionsManager.currentProject, result.filePath, compressionLevel, password);

            if (exportResult.success) {
                showNotification('Projeto exportado com sucesso!', 'success');
            } else {
                showNotification('Erro ao exportar projeto', 'error');
            }
        } catch (error) {
            console.error('Erro ao exportar projeto:', error);
            showNotification('Erro ao exportar projeto', 'error');
        } finally {
            setLoadingState({ isOpen: false, message: '' });
        }
    }, [encryptModalState, appSettings, questionsManager, showNotification]);

    const handleImportQuestion = useCallback(async () => {
        if (!window.electronAPI) {
            showNotification('API Electron não disponível', 'error');
            return;
        }

        try {
            setLoadingState({ isOpen: true, message: 'Importando questão...' });
            const result = await window.electronAPI.showOpenDialog({
                title: 'Importar Questão',
                filters: [
                    { name: 'AvaLIBRAS Question Files', extensions: ['avaquest'] },
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const avaFilePath = result.filePaths[0];
                // Determine project base path for storing media
                const projectBasePath = questionsManager.currentProject.filePath; // Pass current project's file path

                const importResult = await window.electronAPI.importQuestion(avaFilePath, projectBasePath);

                if (importResult.success) {
                    // Add the imported question to the current project
                    questionsManager.addQuestionFromImport(importResult.question);
                    showNotification('Questão importada com sucesso!', 'success');
                } else {
                    showNotification('Erro ao importar questão', 'error');
                }
            }
        } catch (error) {
            console.error('Erro ao importar questão:', error);
            showNotification('Erro ao importar questão', 'error');
        } finally {
            setLoadingState({ isOpen: false, message: '' });
        }
    }, [questionsManager, showNotification]);

    const handleValidateQuestion = useCallback(() => {
        const activeQuestion = questionsManager.getActiveQuestion();
        if (!activeQuestion) {
            showNotification('Nenhuma questão selecionada para validar.', 'error');
            return;
        }

        const result = questionsManager.validateAndFinalizeQuestion(activeQuestion.originalIndex);

        if (result.success) {
            showNotification(result.message, 'success');
            // Desseleciona a questão atual para limpar o editor
            questionsManager.setActiveQuestion(null);
        } else {
            showNotification(result.message, 'error');
        }
    }, [questionsManager, showNotification]);

    // Sync overlays with current project (handled internally by useQuestions hook)
    useEffect(() => {
        // The overlay sync is now handled internally in the useQuestions hook
        // through its currentProject state management
        console.log('Overlay sync handled by useQuestions hook');
    }, [overlayManager.overlays.length]);

    // Modal handlers
    const handleNewProject = useCallback(() => {
        setIsNewProjectModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsNewProjectModalOpen(false);
    }, []);

    const handleCreateProject = useCallback((projectData) => {
        questionsManager.createNewProject(projectData.name, projectData.totalAlternatives);
    }, [questionsManager]);

    // Gabarito modal handlers
    const handleOpenGabaritoModal = useCallback(() => {
        setIsGabaritoModalOpen(true);
    }, []);

    const handleCloseGabaritoModal = useCallback(() => {
        setIsGabaritoModalOpen(false);
    }, []);

    const handleConfirmClose = useCallback(() => {
        forceQuitApp();
    }, []);

    const handleCancelClose = useCallback(() => {
        setIsCloseModalOpen(false);
    }, []);

    const [isRemoveAllQuestionsModalOpen, setIsRemoveAllQuestionsModalOpen] = useState(false);

    const handleRemoveAllQuestions = useCallback(() => {
        setIsRemoveAllQuestionsModalOpen(true);
    }, []);

    const handleConfirmRemoveAllQuestions = useCallback(() => {
        questionsManager.removeAllQuestions();
        setIsRemoveAllQuestionsModalOpen(false);
        showNotification('Todas as questões foram removidas.', 'success');
    }, [questionsManager, showNotification]);

    const handleCancelRemoveAllQuestions = useCallback(() => {
        setIsRemoveAllQuestionsModalOpen(false);
    }, []);

    // Overlay modal handlers
    const handleOpenOverlayModal = useCallback((overlay) => {
        setOverlayModalState({ isOpen: true, mode: 'edit', data: overlay });
    }, []);

    // Handler direto para adicionar overlay com captura automática de tempo
    const handleAddOverlay = useCallback(() => {
        // 1. Pausar o vídeo se estiver reproduzindo
        if (videoPlayerRef?.current && !videoPlayerRef.current.paused) {
            videoPlayerRef.current.pause();
        }

        // 2. Capturar o tempo atual
        const currentTime = videoPlayerRef?.current?.currentTime || 0;

        // 3. Abrir o modal em modo 'add' com o tempo capturado
        setOverlayModalState({ isOpen: true, mode: 'add', data: { currentTime } });
    }, [videoPlayerRef]);

    const handleCloseOverlayModal = useCallback(() => {
        setOverlayModalState({ isOpen: false, mode: 'add', data: null });
    }, []);

    // Additional menu handlers
    const handleQuestionMenu = useCallback(() => {
        // Placeholder for question management functionality
        // Future: Open question management modal or panel
        showNotification('Gerenciamento de Questões em desenvolvimento', 'info');
    }, [showNotification]);

    const handleToolsMenu = useCallback(() => {
        // Placeholder for tools functionality
        // Future: Open tools menu or panel
        showNotification('Ferramentas em desenvolvimento', 'info');
    }, [showNotification]);

    const handleHelpMenu = useCallback(() => {
        setIsAboutModalOpen(true); // Abre o modal "Sobre" ao invés de apenas mostrar no console
    }, []);

    const handleOpenDocumentation = useCallback(() => {
        // Abre a documentação no navegador padrão
        if (window.electronAPI?.shell?.openExternal) {
            window.electronAPI.shell.openExternal('https://github.com/flaviojussie/criador-avalibras/blob/main/docs');
            showNotification('Abrindo documentação...', 'info');
        } else {
            showNotification('API Electron não disponível', 'error');
        }
    }, [showNotification]);

    const handleOpenKeyboardShortcuts = useCallback(() => {
        setIsKeyboardShortcutsModalOpen(true);
    }, []);

    const handleReportIssue = useCallback(() => {
        // Abre a página de issues do GitHub no navegador padrão
        if (window.electronAPI?.shell?.openExternal) {
            window.electronAPI.shell.openExternal('https://github.com/flaviojussie/criador-avalibras/issues');
            showNotification('Abrindo página de problemas...', 'info');
        } else {
            showNotification('API Electron não disponível', 'error');
        }
    }, [showNotification]);

  
    // Keyboard shortcut handler e listeners de menu nativo
    useEffect(() => {
        const isAnyModalOpen = () => {
            return isNewProjectModalOpen || isGabaritoModalOpen || isCloseModalOpen || overlayModalState.isOpen || isAboutModalOpen || isKeyboardShortcutsModalOpen || isPerformanceSettingsOpen || loadingState.isOpen || encryptModalState.isOpen || isRemoveAllQuestionsModalOpen;
        };

        const handleKeyDown = (e) => {
            if (isAnyModalOpen()) return;

            // General check for input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // File/Project Shortcuts (Ctrl)
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        handleNewProject();
                        break;
                    case 'o':
                        e.preventDefault();
                        handleProjectLoad();
                        break;
                    case 's':
                        e.preventDefault();
                        handleProjectSave();
                        break;
                    case 'e':
                        e.preventDefault();
                        handleProjectExport();
                        break;
                    case 'd':
                        e.preventDefault();
                        const activeForDup = questionsManager.getActiveQuestion();
                        if (activeForDup) questionsManager.duplicateQuestion(activeForDup.id);
                        break;
                }
            }

            // Question Navigation & Creation (Alt)
            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        questionsManager.previousQuestion();
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        questionsManager.nextQuestion();
                        break;
                    case 'n':
                        e.preventDefault();
                        if (sidebarRef.current) sidebarRef.current.handleAddQuestion();
                        break;
                }
            }

            // Playback and Editing Shortcuts (no modifiers)
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                const key = e.key.toUpperCase();
                const markerKeys = ['A', 'B', 'C', 'D', 'E'];

                if (markerKeys.includes(key)) {
                    e.preventDefault();
                    const video = videoPlayerRef.current;
                    const activeQuestion = questionsManager.getActiveQuestion();
                    if (video && activeQuestion) {
                        const currentTime = video.currentTime;
                        questionsManager.updateQuestion(activeQuestion.originalIndex, {
                            markers: { ...activeQuestion.markers, [key]: currentTime }
                        });
                        showNotification(`Marcador '${key}' definido em ${currentTime.toFixed(2)}s`, 'success');
                    }
                }

                switch (e.key) {
                    case ' ': // Spacebar
                        e.preventDefault();
                        if (videoPlayerRef.current) {
                            videoPlayerRef.current.paused ? videoPlayerRef.current.play() : videoPlayerRef.current.pause();
                        }
                        break;
                    case 'ArrowLeft':
                        if (e.shiftKey) {
                            e.preventDefault();
                            videoEditor.nudgePlayhead(-1);
                        }
                        break;
                    case 'ArrowRight':
                        if (e.shiftKey) {
                            e.preventDefault();
                            videoEditor.nudgePlayhead(1);
                        }
                        break;
                    case 'c':
                    case 'C':
                        e.preventDefault();
                        videoEditor.toggleCutMode();
                        break;
                    case 'i':
                    case 'I':
                        e.preventDefault();
                        handleAddOverlay();
                        break;
                    case 'Delete':
                        const activeForDel = questionsManager.getActiveQuestion();
                        if (activeForDel) {
                            e.preventDefault();
                            questionsManager.deleteQuestion(activeForDel.id);
                        }
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
        handleNewProject, handleProjectSave, handleProjectLoad, handleProjectExport, handleAddOverlay,
        questionsManager, videoEditor, videoPlayerRef, showNotification,
        isNewProjectModalOpen, isGabaritoModalOpen, isCloseModalOpen, overlayModalState.isOpen,
        isAboutModalOpen, isKeyboardShortcutsModalOpen, isPerformanceSettingsOpen,
        loadingState.isOpen, encryptModalState.isOpen, isRemoveAllQuestionsModalOpen
    ]);

    // Listeners para menus nativos do sistema
    useEffect(() => {
        if (!window.electronAPI) return;

        // Menu events
        const handleMenuNewProject = () => handleNewProject();
        const handleMenuOpenProject = () => handleProjectLoad();
        const handleMenuSaveProject = () => handleProjectSave();
        const handleMenuSaveProjectAs = () => handleProjectSave(); // Same as save for now
        const handleMenuExportProject = () => handleProjectExport();
        const handleMenuAddQuestion = () => {
            if (sidebarRef.current) {
                sidebarRef.current.handleAddQuestion();
            }
        };
        const handleMenuDuplicateQuestion = () => {
            const active = questionsManager.getActiveQuestion();
            if (active) {
                questionsManager.duplicateQuestion(active.id);
            }
        };
        const handleMenuDeleteQuestion = () => {
            const active = questionsManager.getActiveQuestion();
            if (active) {
                questionsManager.deleteQuestion(active.id);
            }
        };
        const handleMenuSettings = () => {
            showNotification('Configurações em desenvolvimento', 'info');
        };

        // Registrar listeners
        window.electronAPI.onMenuNewProject(handleMenuNewProject);
        window.electronAPI.onMenuOpenProject(handleMenuOpenProject);
        window.electronAPI.onMenuSaveProject(handleMenuSaveProject);
        window.electronAPI.onMenuSaveProjectAs(handleMenuSaveProjectAs);
        window.electronAPI.onMenuExportProject(handleMenuExportProject);
        window.electronAPI.onMenuAddQuestion(handleMenuAddQuestion);
        window.electronAPI.onMenuDuplicateQuestion(handleMenuDuplicateQuestion);
        window.electronAPI.onMenuDeleteQuestion(handleMenuDeleteQuestion);
        window.electronAPI.onMenuSettings(handleMenuSettings);

        // Cleanup
        return () => {
            window.electronAPI.removeAllListeners('menu-new-project');
            window.electronAPI.removeAllListeners('menu-open-project');
            window.electronAPI.removeAllListeners('menu-save-project');
            window.electronAPI.removeAllListeners('menu-save-project-as');
            window.electronAPI.removeAllListeners('menu-export-project');
            window.electronAPI.removeAllListeners('menu-add-question');
            window.electronAPI.removeAllListeners('menu-duplicate-question');
            window.electronAPI.removeAllListeners('menu-delete-question');
            window.electronAPI.removeAllListeners('menu-settings');
        };
    }, [handleNewProject, handleProjectLoad, handleProjectSave, handleProjectExport, questionsManager, showNotification]);

    const menuItems = [
        {
            label: 'Arquivo',
            submenu: [
                { label: 'Novo Projeto', action: handleNewProject },
                { label: 'Abrir...', action: handleProjectLoad },
                { separator: true },
                { header: 'Projetos Recentes' },
                // Recent projects will be added here dynamically
                { separator: true },
                { label: 'Salvar', action: handleProjectSave },
                { label: 'Salvar Como...', action: handleProjectSaveAs },
                { label: 'Exportar Prova...', action: handleProjectExport },
                { separator: true },
                { label: 'Sair', action: () => window.electronAPI.closeApp() },
            ]
        },
        {
            label: 'Questão',
            submenu: [
                { label: 'Adicionar Nova', action: () => sidebarRef.current?.handleAddQuestion() },
                { label: 'Importar...', action: handleImportQuestion },
                { separator: true },
                { label: 'Exportar Questão...', action: () => handleExportQuestion(questionsManager.getActiveQuestion()) },
                { separator: true },
                { label: 'Remover Todas as Questões', action: handleRemoveAllQuestions },
            ]
        },
                { // Novo menu de Configurações de nível superior
                    label: 'Configurações',
                    action: () => setIsPerformanceSettingsOpen(true)
                },
        {
            label: 'Ajuda',
            submenu: [
                { label: 'Documentação', action: handleOpenDocumentation },
                { separator: true },
                  { label: 'Reportar Problema', action: handleReportIssue },
                { separator: true },
                { label: 'Sobre o AvaLIBRAS', action: handleHelpMenu },
            ]
        },
    ];

      // O loading agora é um modal, não mais um render de tela inteira.

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-screen overflow-hidden bg-[var(--surface-primary)] text-[var(--text-primary)] text-[13px]">
                <TitleBar menuItems={menuItems} />
                <main ref={mainRef} className="flex flex-1 overflow-hidden">
                <Sidebar
                    ref={sidebarRef}
                    width={sidebarWidth}
                    questions={questionsManager.getAllQuestions()}
                    selectedQuestion={questionsManager.getActiveQuestion()}
                    onSelectQuestion={questionsManager.setActiveQuestion}
                    onAddQuestion={questionsManager.addQuestion}
                    onUpdateQuestion={questionsManager.updateQuestion}
                    onDeleteQuestion={questionsManager.deleteQuestion}
                    onExportQuestion={handleExportQuestion}
                    reorderQuestions={questionsManager.reorderQuestions}
                    currentProject={questionsManager.currentProject}
                    recentProjects={questionsManager.recentProjects}
                />
                <div
                    className="w-1 cursor-col-resize flex-shrink-0 bg-transparent hover:bg-[var(--accent-primary)] transition-colors duration-200"
                    onMouseDown={handleMouseDown}
                />
                <Editor
                    selectedQuestion={questionsManager.getActiveQuestion()}
                    videoPlayerRef={videoPlayerRef}
                    timelineRef={timelineRef}
                    canvasRef={canvasRef}
                    overlayManager={overlayManager}
                    videoEditor={videoEditor}
                    questionsManager={questionsManager}
                    onOpenGabaritoModal={handleOpenGabaritoModal}
                    onOpenOverlayModal={handleOpenOverlayModal}
                    onAddOverlay={handleAddOverlay}
                    onValidateQuestion={handleValidateQuestion}
                    showNotification={showNotification}
                    removeMarkerAndSubsequent={questionsManager.removeMarkerAndSubsequent}
                    removeOverlayFromQuestion={questionsManager.removeOverlayFromQuestion}
                />
            </main>
            <Statusbar
                questionCount={questionsManager.getQuestionCount()}
                totalQuestions={questionsManager.getQuestionCount()}
                currentProject={questionsManager.currentProject}
                overlayCount={overlayManager.overlays.length}
            />
            {isResizing && <div className="fixed inset-0 z-50 cursor-col-resize"></div>}

            {/* New Project Modal */}
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={handleCloseModal}
                onCreateProject={handleCreateProject}
            />

            {/* Gabarito Modal */}
            <GabaritoModal
                isOpen={isGabaritoModalOpen}
                onClose={handleCloseGabaritoModal}
                selectedQuestion={questionsManager.getActiveQuestion()}
                onUpdateQuestion={questionsManager.updateQuestion}
                questionsManager={questionsManager}
            />

            {/* Overlay Modal */}
            <OverlayModal
                isOpen={overlayModalState.isOpen}
                mode={overlayModalState.mode}
                initialData={overlayModalState.data}
                onClose={handleCloseOverlayModal}
                selectedQuestion={questionsManager.getActiveQuestion()}
                questionsManager={questionsManager}
              />

            {/* Close Confirmation Modal */}
            <ConfirmModal
                isOpen={isCloseModalOpen}
                onClose={handleCancelClose}
                onConfirm={handleConfirmClose}
                title="Confirmar Fechamento"
                message="Você tem certeza que deseja fechar o AvaLIBRAS? Qualquer trabalho não salvo será perdido."
                confirmText="Fechar"
            />

            {/* About Modal */}
            <AboutModal
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
                version="v2.0.0"
            />

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                isOpen={isKeyboardShortcutsModalOpen}
                onClose={() => setIsKeyboardShortcutsModalOpen(false)}
            />

            <EncryptModal
                isOpen={encryptModalState.isOpen}
                onClose={() => setEncryptModalState({ isOpen: false, exportType: null, question: null })}
                onConfirm={handleProceedWithExport}
            />

            {/* Loading Modal */}
            <LoadingModal
                isOpen={loadingState.isOpen}
                message={loadingState.message}
            />

            {/* Settings Modal */}
            <SettingsModal
                visible={isPerformanceSettingsOpen}
                onClose={() => setIsPerformanceSettingsOpen(false)}
                showNotification={showNotification}
                settings={appSettings}
                onSettingsChange={setAppSettings}
            />

            {/* Remove All Questions Confirmation Modal */}
            <ConfirmModal
                isOpen={isRemoveAllQuestionsModalOpen}
                onClose={handleCancelRemoveAllQuestions}
                onConfirm={handleConfirmRemoveAllQuestions}
                title="Confirmar Remoção"
                message="Você tem certeza que deseja remover TODAS as questões do projeto? Esta ação não pode ser desfeita."
                confirmText="Remover Tudo"
                cancelText="Cancelar"
            />

            {/* Notification Toast */}
            {notification.visible && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
                    notification.type === 'success'
                        ? 'bg-green-600 text-white'
                        : notification.type === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{notification.message}</span>
                    </div>
                </div>
            )}
        </div>
        </ErrorBoundary>
    );
};

export default App;