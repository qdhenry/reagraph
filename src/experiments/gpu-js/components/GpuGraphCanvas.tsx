import React, { useEffect, useState } from 'react';
import { GraphCanvas, GraphCanvasProps } from '../../../GraphCanvas';
import { GpuManager } from '../utils/gpuManager';
import { getGpuLayoutBuilder } from '../layout/gpuLayoutProvider';

export interface GpuGraphCanvasProps extends Omit<GraphCanvasProps, 'layoutOverrides'> {
  useGpuLayout?: boolean;
}

export const GpuGraphCanvas: React.FC<GpuGraphCanvasProps> = ({
  useGpuLayout = true,
  layoutType = 'forceDirected',
  ...props
}) => {
  console.log('GpuGraphCanvas rendering', { useGpuLayout, layoutType, props });
  const [gpuReady, setGpuReady] = useState(false);
  const [gpuMode, setGpuMode] = useState<string>('initializing');

  useEffect(() => {
    const initGpu = async () => {
      console.log('Initializing GPU...');
      if (!useGpuLayout) {
        setGpuReady(true);
        return;
      }

      try {
        const manager = GpuManager.getInstance();
        await manager.initialize();
        setGpuMode(manager.getMode());
        setGpuReady(true);
        console.log('GPU initialized:', manager.getMode());
      } catch (error) {
        console.warn('GPU initialization failed:', error);
        setGpuMode('disabled');
        setGpuReady(true);
      }
    };

    initGpu();
  }, [useGpuLayout]);

  const actualLayoutType = useGpuLayout && layoutType === 'forceDirected' 
    ? 'gpuForceDirected' 
    : layoutType;

  if (!gpuReady) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f0f0'
      }}>
        <div>
          <div>Initializing GPU.js...</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            This may take a moment on first load
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {useGpuLayout && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '8px 12px',
          background: gpuMode === 'gpu' ? '#28a745' : gpuMode === 'cpu' ? '#ffc107' : '#dc3545',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}>
          GPU.js: {gpuMode.toUpperCase()} mode
        </div>
      )}
      <GraphCanvas
        {...props}
        layoutType={actualLayoutType}
        layoutOverrides={useGpuLayout ? getGpuLayoutBuilder() : undefined}
      />
    </>
  );
};