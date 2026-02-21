import React, { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';

export const DraggableTrainingButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Position state
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight / 2 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    // Initial check and event listener for Five9 status
    useEffect(() => {
        const checkStatus = () => {
            const status = localStorage.getItem('five9_status');
            if (status && status.startsWith('Ready')) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
                if (isPlaying) {
                    setIsPlaying(false); // Reset when hiding
                    window.dispatchEvent(new Event('five9:training_stop_simulation'));
                }
            }
        };

        checkStatus();

        window.addEventListener('five9_status_changed', checkStatus);
        return () => window.removeEventListener('five9_status_changed', checkStatus);
    }, []);

    // Handle Resize to keep button on screen
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => {
                let { x, y } = prev;
                const btnWidth = buttonRef.current?.offsetWidth || 60;
                const btnHeight = buttonRef.current?.offsetHeight || 60;

                if (x > window.innerWidth - btnWidth) x = window.innerWidth - btnWidth - 20;
                if (y > window.innerHeight - btnHeight) y = window.innerHeight - btnHeight - 20;
                if (x < 0) x = 20;
                if (y < 0) y = 20;

                return { x, y };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Dragging Logic
    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = false; // We start assuming it's a click
        if (buttonRef.current) {
            buttonRef.current.setPointerCapture(e.pointerId);
            const rect = buttonRef.current.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!buttonRef.current?.hasPointerCapture(e.pointerId)) return;

        // If moved, it's a drag
        isDragging.current = true;

        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        // Boundaries
        const btnWidth = buttonRef.current.offsetWidth;
        const btnHeight = buttonRef.current.offsetHeight;

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX > window.innerWidth - btnWidth) newX = window.innerWidth - btnWidth;
        if (newY > window.innerHeight - btnHeight) newY = window.innerHeight - btnHeight;

        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (buttonRef.current && buttonRef.current.hasPointerCapture(e.pointerId)) {
            buttonRef.current.releasePointerCapture(e.pointerId);
        }

        // If it wasn't a drag, toggle the state
        if (!isDragging.current) {
            setIsPlaying(prev => {
                const newState = !prev;
                if (newState) {
                    window.dispatchEvent(new Event('five9:training_start_simulation'));
                } else {
                    window.dispatchEvent(new Event('five9:training_stop_simulation'));
                }
                return newState;
            });
        }
        isDragging.current = false;
    };

    if (!isVisible) return null;

    return (
        <div
            ref={buttonRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                touchAction: 'none', // Prevent scrolling on touch
            }}
            className={`z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-300 border-4 ${isPlaying
                ? 'bg-red-500 hover:bg-red-600 border-red-700'
                : 'bg-green-500 hover:bg-green-600 border-green-700'
                }`}
            title={isPlaying ? "Detener Actividad" : "Iniciar Actividad de Entrenamiento"}
        >
            {isPlaying ? (
                <Square size={24} fill="white" className="text-white ml-0.5" />
            ) : (
                <Play size={28} fill="white" className="text-white ml-1" />
            )}
        </div>
    );
};
