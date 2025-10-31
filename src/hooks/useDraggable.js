import { useState, useCallback, useRef } from 'react';

export const useDraggable = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    
    // Ref para guardar a posição inicial do clique e a posição do elemento
    const dragInfoRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handleMouseDown = useCallback((e) => {
        // Previne comportamentos indesejados, como seleção de texto
        e.preventDefault();
        e.stopPropagation();

        // Guarda a posição inicial do mouse e do elemento
        dragInfoRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - dragInfoRef.current.startX;
            const deltaY = moveEvent.clientY - dragInfoRef.current.startY;
            
            setPosition({
                x: dragInfoRef.current.initialX + deltaX,
                y: dragInfoRef.current.initialY + deltaY,
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [position.x, position.y]);

    return { position, handleMouseDown };
};