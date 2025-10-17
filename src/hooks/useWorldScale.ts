import { useState, useCallback, useRef, WheelEvent, MouseEvent } from 'react';
import { WorldTransform } from '../types';

export const useWorldScale = (initialScale = 1.5) => {
  const [transform, setTransform] = useState<WorldTransform>({ x: 0, y: 0, scale: initialScale });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const { deltaY } = event;
    const scaleFactor = 1.1;
    setTransform(prev => {
      const newScale = deltaY < 0 ? prev.scale * scaleFactor : prev.scale / scaleFactor;
      return { ...prev, scale: Math.max(0.5, Math.min(newScale, 5)) }; // Clamp scale
    });
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    // Only pan with the primary mouse button
    if (event.button !== 0) return;
    isPanning.current = true;
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = event.clientX - lastMousePos.current.x;
    const dy = event.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: event.clientX, y: event.clientY };
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number, dimensions: {width: number, height: number}) => {
    // This translates screen coordinates (e.g., from a click event) to world coordinates within the simulation.
    // 1. Undo the centering translation
    const translatedX = screenX - dimensions.width / 2;
    const translatedY = screenY - dimensions.height / 2;
    // 2. Undo the pan translation
    const unpannedX = translatedX - transform.x;
    const unpannedY = translatedY - transform.y;
    // 3. Undo the scaling
    const worldX = unpannedX / transform.scale;
    const worldY = unpannedY / transform.scale;

    return { x: worldX, y: worldY };
  }, [transform]);

  const zoom = useCallback((factor: number) => {
    setTransform(prev => {
      const newScale = prev.scale * factor;
      return { ...prev, scale: Math.max(0.5, Math.min(newScale, 5)) };
    });
  }, []);


  return {
    transform,
    handleWheel,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    isPanningRef: isPanning,
    screenToWorld,
    zoom,
  };
};