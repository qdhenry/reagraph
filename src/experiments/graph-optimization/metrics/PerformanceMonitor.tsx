import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PerformanceMetrics } from './types';

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  implementation?: 'baseline' | 'optimized';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetricsUpdate,
  visible = true,
  position = 'bottom-left',
  implementation = 'baseline'
}) => {
  const [fps, setFps] = useState(0);
  const [memoryUsed, setMemoryUsed] = useState(0);
  const [layoutTime, setLayoutTime] = useState(0);
  const [mainThreadBlocking, setMainThreadBlocking] = useState(0);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>();
  
  // FPS calculation
  const calculateFPS = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    
    frameCountRef.current++;
    
    if (deltaTime >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / deltaTime);
      setFps(currentFps);
      
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
      
      // Update memory metrics if available
      if ('memory' in performance && (performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        const usedMemory = Math.round((memoryInfo.usedJSHeapSize || 0) / 1024 / 1024);
        setMemoryUsed(usedMemory);
      }
      
      // Notify parent of metrics update
      if (onMetricsUpdate) {
        onMetricsUpdate({
          fps: currentFps,
          memoryUsed: memoryUsed,
          timestamp: currentTime
        });
      }
    }
    
    rafIdRef.current = requestAnimationFrame(calculateFPS);
  }, [onMetricsUpdate]);
  
  useEffect(() => {
    if (visible) {
      rafIdRef.current = requestAnimationFrame(calculateFPS);
    }
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [visible, calculateFPS]);
  
  // Listen for custom performance events
  useEffect(() => {
    const handleLayoutTime = (event: CustomEvent) => {
      setLayoutTime(event.detail.duration);
    };
    
    const handleMainThreadBlocking = (event: CustomEvent) => {
      setMainThreadBlocking(event.detail.duration);
    };
    
    window.addEventListener('graph-layout-time', handleLayoutTime as EventListener);
    window.addEventListener('main-thread-blocking', handleMainThreadBlocking as EventListener);
    
    return () => {
      window.removeEventListener('graph-layout-time', handleLayoutTime as EventListener);
      window.removeEventListener('main-thread-blocking', handleMainThreadBlocking as EventListener);
    };
  }, []);
  
  if (!visible) return null;
  
  const positionStyles = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '60px', left: '20px' },
    'bottom-right': { bottom: '60px', right: '20px' }
  };
  
  const bgColor = implementation === 'optimized' 
    ? 'rgba(0, 0, 0, 0.85)' 
    : 'rgba(0, 0, 0, 0.85)';
  
  const borderColor = implementation === 'optimized' 
    ? '#28a745' 
    : '#666';
  
  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        background: bgColor,
        color: 'white',
        padding: '12px 16px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'Monaco, monospace',
        zIndex: 1000,
        minWidth: '200px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px', 
        fontSize: '14px',
        color: implementation === 'optimized' ? '#28a745' : '#fff'
      }}>
        Performance Monitor {implementation === 'optimized' ? '(Optimized)' : '(Baseline)'}
      </div>
      
      <div style={{ display: 'grid', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>FPS:</span>
          <span style={{ 
            fontWeight: 'bold',
            color: fps >= 50 ? '#4caf50' : fps >= 30 ? '#ff9800' : '#f44336'
          }}>
            {fps}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Memory:</span>
          <span>{memoryUsed} MB</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Layout Time:</span>
          <span>{layoutTime.toFixed(1)} ms</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Main Thread:</span>
          <span>{mainThreadBlocking.toFixed(1)} ms</span>
        </div>
        
        {implementation === 'optimized' && (
          <div style={{ 
            marginTop: '4px', 
            paddingTop: '4px', 
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '11px',
            color: '#90EE90'
          }}>
            ✓ Web Workers Active
          </div>
        )}
      </div>
    </div>
  );
};