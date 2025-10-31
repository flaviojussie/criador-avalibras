import { useEffect, useCallback } from 'react';

// Este hook foi refatorado para ser mais eficiente e seguir as boas práticas do React.
// Ele não gerencia mais o estado, apenas aplica propriedades visuais aos elementos DOM fornecidos.

export const useVisualManager = (elements, state) => {

    const setCSSProperty = useCallback((property, value) => {
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.style.setProperty(property, value);
        }
    }, []);

    const toggleClass = useCallback((element, className, force) => {
        if (!element) return;
        element.classList.toggle(className, force);
    }, []);

    const applyStateToDOM = useCallback(() => {
        if (!elements || !state) return;

        const { playheadRef, progressRef, selectionAreaRef, timelineTrackRef, bodyRef } = elements;

        // Aplica estado do playhead
        if (playheadRef.current) {
            const { playhead } = state;
            playheadRef.current.style.left = `${playhead.position}%`;
            playheadRef.current.style.display = playhead.display;
            toggleClass(playheadRef.current, 'dragging', playhead.isDragging);
        }

        // Aplica estado da barra de progresso
        if (progressRef.current) {
            const { progress } = state;
            progressRef.current.style.width = `${progress.width}%`;
        }

        // Aplica estado da área de seleção
        if (selectionAreaRef.current) {
            const { selection } = state;
            selectionAreaRef.current.style.left = `${selection.left}%`;
            selectionAreaRef.current.style.width = `${selection.width}%`;
            selectionAreaRef.current.style.display = selection.display;
            toggleClass(selectionAreaRef.current, 'active', selection.isActive);
            toggleClass(selectionAreaRef.current, 'moving', selection.isMoving);
        } else if (state.selection.isSelectionMode) {
            // Este log pode aparecer brevemente durante a transição de estados, o que é normal.
            console.log('DEBUG: selectionAreaRef.current é nulo, mas o modo de seleção está ativo.');
        }

        // Aplica estado da timeline
        if (timelineTrackRef.current) {
            const { timeline } = state;
            toggleClass(timelineTrackRef.current, 'selecting', timeline.isSelecting);
        }
        
        // Aplica estado do body
        if (bodyRef.current) {
            const { body } = state;
            // Limpa classes de cursor antes de adicionar a nova
            bodyRef.current.className = bodyRef.current.className.replace(/cursor-\S+/g, '').trim();
            if (body.cursor !== 'default') {
                bodyRef.current.classList.add(`cursor-${body.cursor}`);
            }
        }

    }, [elements, state, toggleClass]);

    // Aplica as mudanças no DOM sempre que o estado ou os elementos mudarem
    useEffect(() => {
        applyStateToDOM();
    }, [state, applyStateToDOM]);

    // Retorna utilitários que ainda podem ser úteis externamente
    return {
        setCSSProperty,
        toggleClass
    };
};