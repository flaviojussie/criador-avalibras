import React from 'react';

const QuestionContextMenu = ({ x, y, question, onClose, onEdit, onExport, onDelete }) => {
    if (!question) {
        console.log('❌ QuestionContextMenu: Question is null/undefined, not rendering menu');
        return null;
    }

    console.log('🎯 QuestionContextMenu: Rendering menu for question', question.id || question.originalIndex, 'at position', { x, y });

    // Validate position coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
        console.warn('⚠️ QuestionContextMenu: Invalid coordinates received:', { x, y });
        return null;
    }

    // Adjust position to keep menu within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 160; // Approximate menu width
    const menuHeight = 200; // Approximate menu height

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + menuWidth > viewportWidth) {
        adjustedX = viewportWidth - menuWidth - 10;
        console.log('🔄 QuestionContextMenu: Adjusted X position to fit viewport:', adjustedX);
    }

    // Adjust vertical position
    if (y + menuHeight > viewportHeight) {
        adjustedY = viewportHeight - menuHeight - 10;
        console.log('🔄 QuestionContextMenu: Adjusted Y position to fit viewport:', adjustedY);
    }

    // Ensure menu doesn't go off the left/top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    const menuStyle = {
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        zIndex: 9999, // Higher than other elements to ensure visibility
    };

    const handleAction = (actionFn) => {
        console.log('🔄 QuestionContextMenu: Executing action for question', question.id || question.originalIndex);
        try {
            actionFn(question);
            console.log('✅ QuestionContextMenu: Action executed successfully');
        } catch (error) {
            console.error('❌ QuestionContextMenu: Error executing action:', error);
        }
        onClose();
    };

    const finalMenuStyle = {
        ...menuStyle,
        backgroundColor: '#252526', // Fallback color
        border: '1px solid #444444', // Fallback border
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        padding: '4px 0',
        width: '160px',
        minWidth: '160px',
        maxWidth: '200px',
    };

    return (
        <div
            style={finalMenuStyle}
            className="bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-md shadow-lg py-1 w-40"
            data-context-menu="question-menu"
            onClick={(e) => {
                console.log('🖱️ QuestionContextMenu: Click inside menu, stopping propagation');
                e.stopPropagation();
            }}
            onContextMenu={(e) => {
                console.log('🖱️ QuestionContextMenu: Right-click inside menu, stopping propagation');
                e.stopPropagation();
                e.preventDefault();
            }}
        >
            <button
                className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                onClick={() => {
                    console.log('📝 QuestionContextMenu: Edit button clicked for question', question.id || question.originalIndex);
                    handleAction(onEdit);
                }}
            >
                Editar
            </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                onClick={() => {
                    console.log('📤 QuestionContextMenu: Export button clicked for question', question.id || question.originalIndex);
                    handleAction(onExport);
                }}
            >
                Exportar
            </button>
            <div className="border-t border-[var(--border-color)] my-1"></div>
            <button
                className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-600 hover:text-white"
                onClick={() => {
                    console.log('🗑️ QuestionContextMenu: Delete button clicked for question', question.id || question.originalIndex);
                    handleAction(onDelete);
                }}
            >
                Excluir
            </button>
        </div>
    );
};

QuestionContextMenu.displayName = 'QuestionContextMenu';

export default QuestionContextMenu;
