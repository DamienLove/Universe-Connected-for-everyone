// Placeholder for useWorldScale hook
export const useWorldScale = (_scale: number) => {
  return {
    transform: { x: 0, y: 0, scale: 1 },
    handleWheel: () => {},
    handleMouseDown: () => {},
    handleMouseUp: () => {},
    handleMouseMove: () => {},
    screenToWorld: (x: number, y: number, _dimensions: any) => ({ x, y }),
    zoom: (_factor: number) => {},
    isPanningRef: { current: false },
  };
};
