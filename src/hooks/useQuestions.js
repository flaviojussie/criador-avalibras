import { useState, useCallback, useEffect } from 'react';

export const useQuestions = () => {
    // Project state
    const [currentProject, setCurrentProject] = useState({
        name: "Projeto sem Título",
        type: "multiple_choice",
        totalAlternatives: 4,
        questions: [],
        isDirty: false,
        overlays: [],
        filePath: null, // New: Store the path where the project is saved
        mediaFolderPath: null // New: Store the base path for project media
    });

    // Recent projects state
    const [recentProjects, setRecentProjects] = useState([]);

    // Active question index
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(-1);

    // Initialize recent projects from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('avalibras_recent_projects');
        if (saved) {
            try {
                setRecentProjects(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading recent projects:', error);
                setRecentProjects([]);
            }
        }
    }, []);

    // Save recent projects to localStorage
    const saveRecentProjects = useCallback((projects) => {
        try {
            localStorage.setItem('avalibras_recent_projects', JSON.stringify(projects));
        } catch (error) {
            console.error('Error saving recent projects:', error);
        }
    }, []);

    // Get next question number
    const getNextQuestionNumber = useCallback(() => {
        if (currentProject.questions.length === 0) return 1;
        const maxIndex = Math.max(...currentProject.questions.map(q => q.originalIndex));
        return maxIndex + 1;
    }, [currentProject.questions]);

    // Validate question data
    const validateQuestion = useCallback((question, isStrict = false) => {
        // Always validate markers if they exist
        if (!question.markers) {
            throw new Error("Marcadores são obrigatórios.");
        }

        const expectedAlternatives = Array.from(
            { length: currentProject.totalAlternatives },
            (_, i) => String.fromCharCode(65 + i)
        );

        // Strict validation for complete questions (e.g., when saving/exporting)
        if (isStrict) {
            if (!question.video) {
                throw new Error("Vídeo é obrigatório.");
            }
            if (!question.correctAnswer) {
                throw new Error("Gabarito é obrigatório.");
            }
            for (const marker of expectedAlternatives) {
                const markerValue = question.markers[marker];
                if (markerValue === null || markerValue === undefined || isNaN(markerValue)) {
                    throw new Error(`Marcador para alternativa ${marker} é inválido ou ausente.`);
                }
            }
        }
    }, [currentProject.totalAlternatives]);

    // Normalize markers (round to 2 decimal places)
    const normalizeMarkers = useCallback((markers) => {
        return Object.fromEntries(
            Object.entries(markers).map(([key, value]) => {
                if (value === null || value === undefined) {
                    return [key, null]; // Preserve null/undefined
                }
                return [key, parseFloat(parseFloat(value).toFixed(2))];
            })
        );
    }, []);

    // Add new question
    const addQuestion = useCallback((videoUrl, markers, correctAnswer) => {
        console.log('🎯 addQuestion chamado com:', { videoUrl, markers, correctAnswer });

        if (currentProject.questions.length >= 90) {
            throw new Error("O limite de 90 questões por projeto foi atingido.");
        }

        // ALWAYS create fresh markers with null values, ignoring the 'markers' argument for new questions.
        const finalMarkers = Array.from(
            { length: currentProject.totalAlternatives },
            (_, i) => String.fromCharCode(65 + i)
        ).reduce((acc, key) => {
            acc[key] = null;
            return acc;
        }, {});

        const questionData = { video: videoUrl, markers: finalMarkers, correctAnswer };
        // Use non-strict validation when creating new questions
        validateQuestion(questionData, false);

        const questionNumber = getNextQuestionNumber();
        const newQuestion = {
            label: `Questão ${questionNumber.toString().padStart(2, "0")}`,
            small_label: `${questionNumber.toString().padStart(2, "0")}`,
            video: videoUrl,
            markers: finalMarkers,
            correctAnswer: null, // Always start with a null correct answer
            overlays: [], // Changed from overlay: null
            isCompleted: false, // Nova propriedade para rastrear o estado de finalização
            originalIndex: questionNumber
        };

        console.log('🆕 Nova questão criada:', newQuestion);

        setCurrentProject(prev => {
            const newQuestions = [...prev.questions, newQuestion];
            setActiveQuestionIndex(newQuestions.length - 1);
            return {
                ...prev,
                questions: newQuestions,
                isDirty: true
            };
        });

        console.log('✅ Questão adicionada com sucesso:', newQuestion);
        return newQuestion;
    }, [currentProject.questions, currentProject.totalAlternatives, validateQuestion, getNextQuestionNumber]);

    const addQuestionFromImport = useCallback((importedQuestion) => {
        if (currentProject.questions.length >= 90) {
            throw new Error("O limite de 90 questões por projeto foi atingido.");
        }

        const questionNumber = getNextQuestionNumber();
        const newQuestion = {
            ...importedQuestion,
            label: `Questão ${questionNumber.toString().padStart(2, "0")}`,
            small_label: `${questionNumber.toString().padStart(2, "0")}`,
            originalIndex: questionNumber,
            // Ensure overlays is an array, even if importedQuestion.overlays is undefined
            overlays: importedQuestion.overlays || [],
            isCompleted: false // Imported questions start as not completed
        };

        // Validate the imported question (strict validation)
        validateQuestion(newQuestion, true);

        setCurrentProject(prev => {
            const newQuestions = [...prev.questions, newQuestion];
            setActiveQuestionIndex(newQuestions.length - 1);
            return {
                ...prev,
                questions: newQuestions,
                isDirty: true
            };
        });

        console.log('✅ Questão importada e adicionada com sucesso:', newQuestion);
        return newQuestion;
    }, [currentProject.questions, validateQuestion, getNextQuestionNumber]);

    // Update existing question
    const updateQuestion = useCallback((originalIndex, updatedData, isStrict = false) => {
        let updatedQuestion = null;

        setCurrentProject(prev => {
            const questionToUpdate = prev.questions.find(q => q.originalIndex === originalIndex);
            if (!questionToUpdate) return prev;

            let processedData = { ...updatedData };

            // Handle the new multi-overlay logic
            if (processedData.overlay) {
                const newOverlay = processedData.overlay;
                const existingOverlays = questionToUpdate.overlays || [];
                console.log('🔄 UPDATE OVERLAY: Overlays existentes:', existingOverlays);
                console.log('🔄 UPDATE OVERLAY: Novo overlay a ser adicionado/atualizado:', newOverlay);
                const existingIndex = existingOverlays.findIndex(o => o.id === newOverlay.id);

                let finalOverlays;
                if (existingIndex > -1) {
                    // Update existing overlay
                    finalOverlays = [...existingOverlays];
                    finalOverlays[existingIndex] = newOverlay;
                } else {
                    // Add new overlay
                    finalOverlays = [...existingOverlays, newOverlay];
                }
                
                // Replace single overlay object with the new overlays array
                delete processedData.overlay;
                processedData.overlays = finalOverlays;
                console.log('🔄 UPDATE OVERLAY: Array final de overlays:', finalOverlays);
            }

            const questionData = {
                ...processedData,
                markers: processedData.markers ? normalizeMarkers(processedData.markers) : questionToUpdate.markers
            };

            // Use strict or non-strict validation based on the isStrict parameter
            validateQuestion(questionData, isStrict);

            updatedQuestion = {
                ...questionToUpdate,
                ...questionData
            };

            return {
                ...prev,
                questions: prev.questions.map(q =>
                    q.originalIndex === originalIndex ? updatedQuestion : q
                ),
                isDirty: true
            };
        });

        console.log('✅ Questão atualizada:', updatedQuestion);
        return updatedQuestion;
    }, [validateQuestion, normalizeMarkers]);

    // Delete question
    const deleteQuestion = useCallback((originalIndex) => {
        let deleted = false;

        setCurrentProject(prev => {
            const indexToDelete = prev.questions.findIndex(q => q.originalIndex === originalIndex);
            if (indexToDelete > -1) {
                deleted = true;
                return {
                    ...prev,
                    questions: prev.questions.filter(q => q.originalIndex !== originalIndex),
                    isDirty: true
                };
            }
            return prev;
        });

        if (deleted) {
            console.log('🗑️ Questão removida:', originalIndex);
            // Update active index if necessary
            setActiveQuestionIndex(prev => {
                if (prev >= currentProject.questions.length - 1) {
                    return Math.max(0, currentProject.questions.length - 2);
                }
                return prev;
            });
        }

        return deleted;
    }, [currentProject.questions.length]);

    // Get question by index
    const getQuestion = useCallback((originalIndex) => {
        return currentProject.questions.find(q => q.originalIndex === originalIndex);
    }, [currentProject.questions]);

    // Get question by array index
    const getQuestionByIndex = useCallback((index) => {
        return currentProject.questions[index] || null;
    }, [currentProject.questions]);

    // Get all questions
    const getAllQuestions = useCallback(() => {
        return [...currentProject.questions];
    }, [currentProject.questions]);

    // Set active question
    const setActiveQuestion = useCallback((originalIndex) => {
        if (originalIndex === null || originalIndex === undefined) {
            setActiveQuestionIndex(-1); // Desseleciona a questão
            return;
        }
        const index = currentProject.questions.findIndex(q => q.originalIndex === originalIndex);
        if (index > -1) {
            setActiveQuestionIndex(index);
        }
    }, [currentProject.questions]);

    // Get active question
    const getActiveQuestion = useCallback(() => {
        return activeQuestionIndex >= 0 ? currentProject.questions[activeQuestionIndex] : null;
    }, [activeQuestionIndex, currentProject.questions]);

    // Project management
    const createNewProject = useCallback((name = "Projeto sem Título", totalAlternatives = 4) => {
        const newProject = {
            name,
            type: "multiple_choice",
            totalAlternatives,
            questions: [],
            isDirty: false,
            overlays: []
        };

        setCurrentProject(newProject);
        setActiveQuestionIndex(-1);
        console.log('✅ Novo projeto criado:', newProject);
        return newProject;
    }, []);

    const loadProject = useCallback((projectData) => {
        let mediaFolderPath = null;
        if (projectData.filePath) {
            const projectDir = window.electronAPI.path.dirname(projectData.filePath);
            mediaFolderPath = window.electronAPI.path.join(projectDir, 'media');
        }

        let questionsWithAbsolutePaths = [];
        if (projectData.questions) {
            questionsWithAbsolutePaths = projectData.questions.map(question => {
                let updatedQuestion = { ...question };
                if (question.video && mediaFolderPath) {
                    updatedQuestion.video = window.electronAPI.path.join(mediaFolderPath, question.video);
                }
                if (question.overlays && question.overlays.length > 0 && mediaFolderPath) {
                    updatedQuestion.overlays = question.overlays.map(overlay => ({
                        ...overlay,
                        path: window.electronAPI.path.join(mediaFolderPath, overlay.path)
                    }));
                }
                return updatedQuestion;
            });
        }

        setCurrentProject({
            ...projectData,
            isDirty: false,
            mediaFolderPath: mediaFolderPath,
            questions: questionsWithAbsolutePaths
        });
        setActiveQuestionIndex(0);
        console.log('✅ Projeto carregado:', projectData.name);

        // Add to recent projects
        addToRecentProjects(projectData);
    }, []);

    const saveProject = useCallback(async (filePath) => {
        if (!filePath) {
            console.error('❌ saveProject: filePath é obrigatório.');
            throw new Error('filePath é obrigatório para salvar o projeto.');
        }

        const projectDir = window.electronAPI.path.dirname(filePath);
        const mediaFolderPath = window.electronAPI.path.join(projectDir, 'media');

        // Ensure media folder exists
        await window.electronAPI.system.ensureDirectory(mediaFolderPath);

        let updatedQuestions = [];
        for (const question of currentProject.questions) {
            let updatedQuestion = { ...question };

            // Process video file
            if (question.video) {
                const videoFileName = window.electronAPI.path.basename(question.video);
                const newVideoPath = window.electronAPI.path.join(mediaFolderPath, videoFileName);
                
                // Only copy if the file is not already in the media folder
                if (window.electronAPI.path.dirname(question.video) !== mediaFolderPath) {
                    await window.electronAPI.system.copyFile(question.video, newVideoPath);
                }
                updatedQuestion.video = window.electronAPI.path.relative(mediaFolderPath, newVideoPath); // Store relative path
            }

            // Process overlay files
            if (question.overlays && question.overlays.length > 0) {
                updatedQuestion.overlays = await Promise.all(question.overlays.map(async (overlay) => {
                    const overlayFileName = window.electronAPI.path.basename(overlay.path);
                    const newOverlayPath = window.electronAPI.path.join(mediaFolderPath, overlayFileName);

                    if (window.electronAPI.path.dirname(overlay.path) !== mediaFolderPath) {
                        await window.electronAPI.system.copyFile(overlay.path, newOverlayPath);
                    }
                    return { ...overlay, path: window.electronAPI.path.relative(mediaFolderPath, newOverlayPath) }; // Store relative path
                }));
            }
            updatedQuestions.push(updatedQuestion);
        }

        const projectToSave = {
            ...currentProject,
            filePath: filePath,
            mediaFolderPath: mediaFolderPath, // Store absolute media folder path
            questions: updatedQuestions, // Questions with relative paths
            isDirty: false
        };

        setCurrentProject(projectToSave);
        addToRecentProjects(projectToSave);
        console.log('💾 Projeto salvo:', projectToSave.name);
        return projectToSave;
    }, [currentProject]);

    const addToRecentProjects = useCallback((project) => {
        setRecentProjects(prev => {
            const updated = [project, ...prev.filter(p => p.name !== project.name)].slice(0, 5);
            saveRecentProjects(updated);
            return updated;
        });
    }, [saveRecentProjects]);

    const removeFromRecentProjects = useCallback((projectName) => {
        setRecentProjects(prev => {
            const updated = prev.filter(p => p.name !== projectName);
            saveRecentProjects(updated);
            return updated;
        });
    }, [saveRecentProjects]);

    const clearRecentProjects = useCallback(() => {
        setRecentProjects([]);
        saveRecentProjects([]);
    }, [saveRecentProjects]);

    // Clear all application state (for debugging state issues)
    const clearAllState = useCallback(() => {
        console.log('🧹 Limpando todo o estado da aplicação...');

        // Clear current project
        createNewProject("Projeto sem Título", 4);

        // Clear recent projects from localStorage
        localStorage.removeItem('avalibras_recent_projects');
        setRecentProjects([]);

        // Clear any other potential storage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('avalibras_') || key.includes('question') || key.includes('project')) {
                    console.log('🗑️ Removendo chave do localStorage:', key);
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('⚠️ Erro ao limpar localStorage:', error);
        }

        console.log('✅ Estado da aplicação limpo com sucesso');
    }, [createNewProject]);

    const removeAllQuestions = useCallback(() => {
        setCurrentProject(prev => ({
            ...prev,
            questions: [],
            isDirty: true
        }));
        setActiveQuestionIndex(-1);
        console.log('🗑️ Todas as questões foram removidas.');
    }, []);

    // Question navigation
    const nextQuestion = useCallback(() => {
        if (activeQuestionIndex < currentProject.questions.length - 1) {
            setActiveQuestionIndex(prev => prev + 1);
        }
    }, [activeQuestionIndex, currentProject.questions.length]);

    const previousQuestion = useCallback(() => {
        if (activeQuestionIndex > 0) {
            setActiveQuestionIndex(prev => prev - 1);
        }
    }, [activeQuestionIndex]);

    const goToQuestion = useCallback((index) => {
        if (index >= 0 && index < currentProject.questions.length) {
            setActiveQuestionIndex(index);
        }
    }, [currentProject.questions.length]);

    // Utility methods
    const getQuestionCount = useCallback(() => {
        return currentProject.questions.length;
    }, [currentProject.questions]);

    const isProjectDirty = useCallback(() => {
        return currentProject.isDirty;
    }, [currentProject.isDirty]);

    const markProjectDirty = useCallback(() => {
        setCurrentProject(prev => ({ ...prev, isDirty: true }));
    }, []);

    const markProjectClean = useCallback(() => {
        setCurrentProject(prev => ({ ...prev, isDirty: false }));
    }, []);

    const removeMarkerAndSubsequent = useCallback((originalIndex, markerLabel) => {
        setCurrentProject(prev => {
            const questionToUpdate = prev.questions.find(q => q.originalIndex === originalIndex);
            if (!questionToUpdate) return prev;

            const alternatives = Array.from({ length: prev.totalAlternatives }, (_, i) => String.fromCharCode(65 + i));
            const markerIndex = alternatives.indexOf(markerLabel);

            if (markerIndex === -1) return prev; // Marker not found

            const updatedMarkers = { ...questionToUpdate.markers };
            for (let i = markerIndex; i < alternatives.length; i++) {
                updatedMarkers[alternatives[i]] = null;
            }

            const updatedQuestion = {
                ...questionToUpdate,
                markers: updatedMarkers
            };

            return {
                ...prev,
                questions: prev.questions.map(q =>
                    q.originalIndex === originalIndex ? updatedQuestion : q
                ),
                isDirty: true
            };
        });
    }, []);

    const removeOverlayFromQuestion = useCallback((originalIndex, overlayId) => {
        setCurrentProject(prev => {
            const questionToUpdate = prev.questions.find(q => q.originalIndex === originalIndex);
            if (!questionToUpdate || !questionToUpdate.overlays) return prev;

            const updatedOverlays = questionToUpdate.overlays.filter(o => o.id !== overlayId);

            const updatedQuestion = {
                ...questionToUpdate,
                overlays: updatedOverlays
            };

            return {
                ...prev,
                questions: prev.questions.map(q =>
                    q.originalIndex === originalIndex ? updatedQuestion : q
                ),
                isDirty: true
            };
        });
    }, []);

    const validateAndFinalizeQuestion = useCallback((originalIndex) => {
        const question = getQuestion(originalIndex);
        if (!question) {
            return { success: false, message: 'Questão não encontrada.' };
        }

        // 1. Verificar se há um vídeo
        if (!question.video) {
            return { success: false, message: 'Falta associar um vídeo a esta questão.' };
        }

        // 2. Verificar se o gabarito foi definido
        if (!question.correctAnswer) {
            return { success: false, message: 'Falta definir o gabarito (resposta correta).' };
        }

        // 3. Verificar se todos os marcadores foram posicionados
        const expectedAlternatives = Array.from({ length: currentProject.totalAlternatives }, (_, i) => String.fromCharCode(65 + i));
        for (const alt of expectedAlternatives) {
            const markerTime = question.markers[alt];
            if (markerTime === null || markerTime === undefined || isNaN(markerTime)) {
                return { success: false, message: `Falta posicionar o marcador para a alternativa ${alt}.` };
            }
        }

        // Se todas as validações passaram, marcar como completa
        updateQuestion(originalIndex, { isCompleted: true });
        return { success: true, message: 'Questão validada e finalizada com sucesso!', originalIndex };

    }, [getQuestion, updateQuestion, currentProject.totalAlternatives]);

    const reorderQuestions = useCallback((startIndex, endIndex) => {
        console.log(`🔄 reorderQuestions chamado: de ${startIndex} para ${endIndex}`);
        setCurrentProject(prev => {
            const newQuestions = Array.from(prev.questions);
            const [removed] = newQuestions.splice(startIndex, 1);
            newQuestions.splice(endIndex, 0, removed);

            // Adjust activeQuestionIndex if the active question moved
            let newActiveQuestionIndex = prev.activeQuestionIndex;
            if (prev.activeQuestionIndex === startIndex) {
                newActiveQuestionIndex = endIndex;
            } else if (prev.activeQuestionIndex > startIndex && prev.activeQuestionIndex <= endIndex) {
                newActiveQuestionIndex--;
            } else if (prev.activeQuestionIndex < startIndex && prev.activeQuestionIndex >= endIndex) {
                newActiveQuestionIndex++;
            }

            return {
                ...prev,
                questions: newQuestions,
                isDirty: true
            };
        });
        // Update active question index after state update
        setActiveQuestionIndex(newActiveQuestionIndex);
        console.log(`✅ Questões reordenadas de ${startIndex} para ${endIndex}`);
    }, [activeQuestionIndex]); // Depend on activeQuestionIndex to ensure correct adjustment

    return {
        // Project state
        currentProject,
        recentProjects,
        activeQuestionIndex,

        // Question CRUD
        addQuestion,
        addQuestionFromImport,
        updateQuestion,
        deleteQuestion,
        getQuestion,
        getQuestionByIndex,
        getAllQuestions,

        // Active question management
        setActiveQuestion,
        getActiveQuestion,

        // Project management
        createNewProject,
        loadProject,
        saveProject,

        // Recent projects
        addToRecentProjects,
        removeFromRecentProjects,
        clearRecentProjects,
        clearAllState,
        removeAllQuestions,

        // Navigation
        nextQuestion,
        previousQuestion,
        goToQuestion,

        // Utilities
        getQuestionCount,
        isProjectDirty,
        markProjectDirty,
        markProjectClean,
        removeMarkerAndSubsequent,
        removeOverlayFromQuestion,
        validateAndFinalizeQuestion,
        reorderQuestions, // Export the new function
        getNextQuestionNumber,
        validateQuestion,
        normalizeMarkers
    };
};