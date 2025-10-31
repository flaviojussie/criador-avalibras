import React, { useState, useCallback, useEffect } from 'react';
import Icon, { faPlus } from './Icon';
import QuestionContextMenu from './QuestionContextMenu';

const QuestionGrid = ({ questions, selectedQuestion, onSelect, onAddQuestion, onContextMenu, onDragStart, onDragEnter, onDragEnd, onDragOver, onDrop, onDragLeave, draggedItemIndex, hoveredItemIndex }) => (
    <div className="flex flex-wrap gap-2 p-1">
        {questions.map((q, index) => (
            <button
                key={q.originalIndex}
                onClick={() => onSelect(q.originalIndex)}
                onContextMenu={(e) => onContextMenu(e, q)}
                draggable="true"
                onDragStart={(e) => onDragStart(e, index)}
                onDragEnter={(e) => onDragEnter(e, index)}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, index)}
                onDragLeave={(e) => onDragLeave(e, index)}
                title={q.isCompleted ? "Questão Finalizada" : "Questão Incompleta"}
                className={`w-10 h-10 flex items-center justify-center rounded-[6px] font-semibold text-sm transition-all duration-200
                    ${draggedItemIndex === index ? 'opacity-50 border-dashed border-2 border-[var(--accent-primary)]' : ''}
                    ${hoveredItemIndex === index && draggedItemIndex !== index ? 'border-2 border-dashed border-[var(--accent-primary)]' : ''}
                    ${
                        selectedQuestion?.originalIndex === q.originalIndex
                            ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_0_2px_rgba(14,99,156,0.3)]' // Estado Selecionado
                            : q.isCompleted
                                ? 'bg-[var(--surface-tertiary)] text-[var(--text-secondary)] border-2 border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10' // Estado Finalizado
                                : 'bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)]' // Estado Padrão
                    }`
                }
            >
                {(index + 1).toString().padStart(2, '0')}
            </button>
        ))}
        <button
            onClick={onAddQuestion}
            className="w-10 h-10 flex items-center justify-center rounded-[6px] bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-quaternary)] hover:text-[var(--text-primary)]"
            title="Adicionar Nova Questão"
        >
            <Icon icon={faPlus} className="w-4 h-4" />
        </button>
    </div>
);

const QuestionDetails = ({ question, onExportQuestion, currentProject }) => {
    const totalAlternatives = currentProject?.totalAlternatives || 4; // Default to 4 if not set
    const alternatives = Array.from({ length: totalAlternatives }, (_, i) => String.fromCharCode(65 + i));
    if (!question) {
        return (
            <div className="p-3 text-center text-[var(--text-tertiary)]">
                Selecione uma questão para ver os detalhes.
            </div>
        );
    }

    return (
        <div className="p-3 space-y-4">
            <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Vídeo</label>
                <div className="flex justify-between items-center text-sm bg-[var(--surface-primary)] p-2 rounded-[6px]">
                    <span className="truncate">{question.video ? question.video.split('/').pop() : 'Nenhum vídeo'}</span>
                    <div>
                        <button className="btn btn-secondary btn-icon text-xs ml-2 flex-shrink-0 w-8 h-8 p-0">
                            <i className="fas fa-edit"></i>
                        </button>
                        <button
                            className="btn btn-secondary btn-icon text-xs ml-2 flex-shrink-0 w-8 h-8 p-0"
                            onClick={() => onExportQuestion(question)}
                        >
                            <i className="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Resposta Correta</label>
                <div className="flex flex-wrap gap-2">
                    {alternatives.map(alt => (
                        <div
                            key={alt}
                            className={`flex items-center justify-center min-w-[40px] h-10 px-2 rounded-[6px] font-bold text-sm transition-all duration-200
                                ${question.correctAnswer === alt
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--surface-tertiary)] text-[var(--text-secondary)]'
                                }`
                            }
                        >
                            {alt}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Sidebar = React.forwardRef(({ width, questions, selectedQuestion, onSelectQuestion, onAddQuestion, onUpdateQuestion, onDeleteQuestion, onExportQuestion, currentProject, recentProjects, reorderQuestions }, ref) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [hoveredItemIndex, setHoveredItemIndex] = useState(null);

    const handleSelect = (originalIndex) => {
        onSelectQuestion(originalIndex);
    };

    const handleContextMenu = (e, question) => {
        e.preventDefault();
        console.log('🎯 Sidebar: Opening context menu for question', question.id || question.originalIndex);
        setContextMenu({ x: e.clientX, y: e.clientY, question });
    };

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Drag and Drop Handlers
    const handleDragStart = useCallback((e, index) => {
        console.log(`➡️ Drag Start: ${index}`);
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    }, []);

    const handleDragEnter = useCallback((e, index) => {
        e.preventDefault();
        console.log(`↔️ Drag Enter: ${index} (from ${draggedItemIndex})`);
        if (draggedItemIndex === null || draggedItemIndex === index) return;
        setHoveredItemIndex(index); // Set hovered item for visual feedback
    }, [draggedItemIndex]);

    const handleDragLeave = useCallback((e, index) => {
        console.log(`⬅️ Drag Leave: ${index}`);
        setHoveredItemIndex(null); // Clear hovered item
    }, []);

    const handleDrop = useCallback((e, index) => {
        e.preventDefault();
        console.log(`⬇️ Drop: ${draggedItemIndex} dropped onto ${index}`);
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        reorderQuestions(draggedItemIndex, index);
        setDraggedItemIndex(null); // Clear dragged item
        setHoveredItemIndex(null); // Clear hovered item
    }, [draggedItemIndex, reorderQuestions]);

    const handleDragEnd = useCallback(() => {
        console.log(`🔚 Drag End`);
        setDraggedItemIndex(null);
        setHoveredItemIndex(null); // Clear hovered item on drag end
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault(); // Necessary to allow dropping
    }, []);

    // Close context menu when clicking outside the menu
    useEffect(() => {
        console.log('🔄 Sidebar: useEffect triggered with contextMenu:', !!contextMenu);

        if (contextMenu) {
            const handleGlobalClick = (e) => {
                // Only close if clicking outside the context menu area
                const menuElement = document.querySelector('[data-context-menu="question-menu"]');
                if (menuElement && !menuElement.contains(e.target)) {
                    console.log('🌐 Sidebar: Click outside context menu area, closing menu');
                    console.log('🌐 Target element:', e.target);
                    console.log('🌐 Menu element found:', !!menuElement);
                    handleCloseContextMenu();
                } else {
                    console.log('🌐 Sidebar: Click inside context menu area, keeping menu open');
                }
            };

            // Only add click listener - contextmenu listener interferes with menu opening
            // Note: If we need to close menu on right-click elsewhere, we can add that logic
            // to the button's onContextMenu handler or use a more specific approach
            console.log('🌐 Sidebar: Adding global click event listener only - context menu is active');
            window.addEventListener('click', handleGlobalClick);

            return () => {
                console.log('🌐 Sidebar: Removing global event listeners - context menu closed');
                window.removeEventListener('click', handleGlobalClick);
            };
        } else {
            console.log('🌐 Sidebar: No context menu active, skipping event listeners');
        }
    }, [contextMenu, handleCloseContextMenu]);

    const handleAddQuestion = async () => {
        try {
            const result = await window.electronAPI?.showOpenDialog({
                title: 'Selecionar Vídeo para Nova Questão',
                filters: [
                    { name: 'Vídeos', extensions: ['mp4', 'webm', 'avi', 'mov', 'mkv'] },
                    { name: 'Todos os arquivos', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const videoPath = result.filePaths[0];
                console.log('📹 Vídeo selecionado para nova questão:', videoPath);

                const defaultMarkers = {};
                const alternatives = Array.from({ length: currentProject?.totalAlternatives || 4 }, (_, i) => String.fromCharCode(65 + i));
                console.log('🔤 Alternativas configuradas:', alternatives);
                console.log('✅ Gabarito padrão (alternatives[0]):', alternatives[0]);

                alternatives.forEach(alt => {
                    defaultMarkers[alt] = 0;
                });
                console.log('📍 Marcadores padrão:', defaultMarkers);

                onAddQuestion(videoPath, defaultMarkers, alternatives[0]);
            }
        } catch (error) {
            console.error('Erro ao selecionar vídeo para nova questão:', error);
        }
    };

    // Action handlers for the context menu
    const handleEdit = useCallback((question) => {
        console.log('📝 Sidebar: Edit action called for question', question.id || question.originalIndex);
        onSelectQuestion(question.originalIndex);
    }, [onSelectQuestion]);

    
    const handleExport = useCallback((question) => {
        console.log('📤 Sidebar: Export action called for question', question.id || question.originalIndex);
        onExportQuestion(question);
    }, [onExportQuestion]);

    const handleDelete = useCallback((question) => {
        console.log('🗑️ Sidebar: Delete action called for question', question.id || question.originalIndex);
        onDeleteQuestion(question.id);
    }, [onDeleteQuestion]);

    // Expose handleAddQuestion via ref
    React.useImperativeHandle(ref, () => ({
        handleAddQuestion
    }));

    return (
        <>
            <aside
                style={{ width: `${width}px` }}
                className="bg-[var(--surface-secondary)] flex flex-col min-w-[350px] max-w-[700px] flex-shrink-0"
                onClick={(e) => {
                    // Only close context menu if clicking directly on the aside, not on child elements
                    if (e.target === e.currentTarget) {
                        console.log('🎯 Sidebar: Direct click on aside, closing context menu');
                        handleCloseContextMenu();
                    }
                }}
            >
                <div className="p-2 flex-1 flex flex-col overflow-y-auto">
                    <div className="p-3">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">Questões ({questions.length})</h2>
                        </div>
                                                                <QuestionGrid
                                                                    questions={questions}
                                                                    selectedQuestion={selectedQuestion}
                                                                    onSelect={handleSelect}
                                                                    onAddQuestion={handleAddQuestion}
                                                                    onContextMenu={handleContextMenu}
                                                                    reorderQuestions={reorderQuestions}
                                                                    onDragStart={handleDragStart}
                                                                    onDragEnter={handleDragEnter}
                                                                    onDragEnd={handleDragEnd}
                                                                                            onDragOver={handleDragOver}
                                                                                            onDrop={handleDrop}
                                                                                            onDragLeave={handleDragLeave}
                                                                                            draggedItemIndex={draggedItemIndex}
                                                                                            hoveredItemIndex={hoveredItemIndex}
                                                                                        />                    </div>
                </div>
                <div className="border-t-4 border-transparent hover:border-[var(--accent-primary)] cursor-row-resize h-1 transition-colors duration-200"></div>
                <div className="flex-shrink-0 border-t border-[var(--border-color)]">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] p-3 pb-0">Detalhes da Questão</h3>
                    <QuestionDetails question={selectedQuestion} onExportQuestion={onExportQuestion} currentProject={currentProject} />
                </div>
            </aside>

            {contextMenu && (
                <QuestionContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    question={contextMenu.question}
                    onClose={handleCloseContextMenu}
                    onEdit={handleEdit}
                    onExport={handleExport}
                    onDelete={handleDelete}
                />
            )}
        </>
    );
}); // Correctly close React.forwardRef

export default Sidebar;