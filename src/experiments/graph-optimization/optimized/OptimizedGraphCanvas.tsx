import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GraphScene } from '../../../GraphScene';
import type { GraphSceneProps, GraphSceneRef } from '../../../GraphScene';
import { CameraControls } from '../../../CameraControls';
import type { CameraMode, CameraControlsRef } from '../../../CameraControls';
import { Theme, lightTheme } from '../../../themes';
import { createStore, Provider } from '../../../store';
import Graph from 'graphology';
import { Lasso } from '../../../selection/Lasso';
import type { LassoType } from '../../../selection/Lasso';
import ThreeCameraControls from 'camera-controls';
import { useWorkerLayout } from './hooks/useWorkerLayout';
import { workerBridge } from '../workers/WorkerBridge';
// import { mockWorkerBridge as workerBridge } from '../workers/mockWorkerBridge';
import css from '../../../GraphCanvas/GraphCanvas.module.css';

export interface OptimizedGraphCanvasProps extends Omit<GraphSceneProps, 'theme' | 'nodes' | 'edges'> {
  nodes: any[];
  edges: any[];
  theme?: Theme;
  cameraMode?: CameraMode;
  maxDistance?: number;
  minDistance?: number;
  lassoType?: LassoType;
  children?: React.ReactNode;
  glOptions?: Object;
  onLasso?: (selections: string[]) => void;
  onLassoEnd?: (selections: string[]) => void;
  onCanvasClick?: (event: MouseEvent) => void;
}

export type OptimizedGraphCanvasRef = Omit<GraphSceneRef, 'graph' | 'renderScene'> &
  Omit<CameraControlsRef, 'controls'> & {
    getGraph: () => Graph;
    getControls: () => ThreeCameraControls;
    exportCanvas: () => string;
    getWorkerUtilization: () => number;
  };

const GL_DEFAULTS = {
  alpha: true,
  antialias: true
};

const CAMERA_DEFAULTS: any = {
  near: 1,
  far: 20000,
  fov: 55,
  position: [0, 0, 100]
};

export const OptimizedGraphCanvas = forwardRef<OptimizedGraphCanvasRef, OptimizedGraphCanvasProps>(
  (
    {
      children,
      theme = lightTheme,
      cameraMode = 'pan',
      nodes,
      edges,
      layoutType = 'forceDirected3d',
      lassoType = '2d',
      glOptions = {},
      disabled,
      animated = true,
      defaultNodeSize,
      minDistance = 1000,
      maxDistance = 50000,
      onCanvasClick,
      onLasso,
      onLassoEnd,
      onNodeClick,
      onNodeRightClick,
      onNodePointerOver,
      onNodePointerOut,
      onNodeDrag,
      onNodeDragStart,
      onNodeDragEnd,
      onEdgeClick,
      onEdgeRightClick,
      onEdgePointerOver,
      onEdgePointerOut,
      ...rest
    },
    ref: React.Ref<OptimizedGraphCanvasRef>
  ) => {
    const cameraControlsRef = useRef<CameraControlsRef | null>(null);
    const sceneRef = useRef<GraphSceneRef | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const store = useMemo(() => createStore({
      theme,
      selections: rest.selections,
      actives: rest.actives,
      collapsedNodeIds: rest.collapsedNodeIds
    }), [theme, rest.selections, rest.actives, rest.collapsedNodeIds]);

    // Use Web Worker for layout calculations
    const { 
      nodes: layoutNodes, 
      isCalculating, 
      workerUtilization 
    } = useWorkerLayout({
      nodes,
      edges,
      layoutType,
      enabled: true
    });

    // Handle canvas click
    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (onCanvasClick && event.target === canvasRef.current) {
        onCanvasClick(event.nativeEvent);
      }
    }, [onCanvasClick]);

    // Expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        // Graph methods
        getGraph: () => {
          if (!sceneRef.current?.graph) {
            throw new Error('Graph not initialized');
          }
          return sceneRef.current.graph;
        },
        
        // Camera methods
        getControls: () => {
          if (!cameraControlsRef.current?.controls) {
            throw new Error('Camera controls not initialized');
          }
          return cameraControlsRef.current.controls;
        },
        centerGraph: (args) => {
          cameraControlsRef.current?.centerGraph?.(args);
        },
        zoomIn: () => {
          cameraControlsRef.current?.zoomIn?.();
        },
        zoomOut: () => {
          cameraControlsRef.current?.zoomOut?.();
        },
        resetControls: () => {
          cameraControlsRef.current?.resetControls?.();
        },
        fitNodesInView: (nodeIds) => {
          cameraControlsRef.current?.fitNodesInView?.(nodeIds);
        },
        freeze: () => {
          cameraControlsRef.current?.freeze?.();
        },
        unFreeze: () => {
          cameraControlsRef.current?.unFreeze?.();
        },
        
        // Export method
        exportCanvas: () => {
          if (!canvasRef.current) {
            throw new Error('Canvas not initialized');
          }
          return canvasRef.current.toDataURL();
        },
        
        // Worker utilization
        getWorkerUtilization: () => {
          return workerUtilization;
        },
        
        // Graph scene methods
        highlightNode: (nodeId) => {
          sceneRef.current?.highlightNode?.(nodeId);
        },
        highlightEdge: (edgeId) => {
          sceneRef.current?.highlightEdge?.(edgeId);
        },
        clearHighlights: () => {
          sceneRef.current?.clearHighlights?.();
        }
      }),
      []
    );

    // For now, just use the baseline GraphCanvas to avoid edge rendering issues
    // We'll fix the edge animation issues in a separate step
    return (
      <div className={css.canvas} onClick={handleCanvasClick}>
        <Canvas
          ref={canvasRef as any}
          gl={Object.assign({}, GL_DEFAULTS, glOptions)}
          camera={CAMERA_DEFAULTS}
        >
          <Provider store={store}>
            {theme.canvas?.background && (
              <color attach="background" args={[theme.canvas.background]} />
            )}
            <ambientLight intensity={1} />
            {theme.canvas?.fog && (
              <fog attach="fog" args={[theme.canvas.fog, 4000, 9000]} />
            )}
            <CameraControls
              ref={cameraControlsRef}
              mode={cameraMode}
              minDistance={minDistance}
              maxDistance={maxDistance}
              animated={animated}
              disabled={disabled}
            >
              <Lasso
                disabled={disabled}
                type={lassoType}
                onLasso={onLasso}
                onLassoEnd={onLassoEnd}
              >
                <Suspense fallback={null}>
                  <GraphScene
                    ref={sceneRef}
                    disabled={disabled}
                    animated={animated}
                    theme={theme}
                    defaultNodeSize={defaultNodeSize}
                    layoutType={layoutType}
                    sizingType="default"
                    labelType="nodes"
                    nodes={layoutNodes}
                    edges={edges}
                    onNodeClick={onNodeClick}
                    onNodeRightClick={onNodeRightClick}
                    onNodePointerOver={onNodePointerOver}
                    onNodePointerOut={onNodePointerOut}
                    onNodeDrag={onNodeDrag}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDragEnd={onNodeDragEnd}
                    onEdgeClick={onEdgeClick}
                    onEdgeRightClick={onEdgeRightClick}
                    onEdgePointerOver={onEdgePointerOver}
                    onEdgePointerOut={onEdgePointerOut}
                    {...rest}
                  />
                  {children}
                </Suspense>
              </Lasso>
            </CameraControls>
          </Provider>
        </Canvas>
        {isCalculating && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Calculating layout with Web Workers...
          </div>
        )}
      </div>
    );
  }
);

OptimizedGraphCanvas.displayName = 'OptimizedGraphCanvas';