import React, { Profiler, ProfilerOnRenderCallback, ReactNode } from 'react';
import { metricsRecorder } from './MetricsRecorder';

interface ProfilerWrapperProps {
  id: string;
  children: ReactNode;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}

export const ProfilerWrapper: React.FC<ProfilerWrapperProps> = ({ 
  id, 
  children, 
  onRender 
}) => {
  const handleRender: ProfilerOnRenderCallback = (
    id, // the "id" prop of the Profiler tree that has just committed
    phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
    actualDuration, // time spent rendering the committed update
    baseDuration, // estimated time to render the entire subtree without memoization
    startTime, // when React began rendering this update
    commitTime, // when React committed this update
    interactions // the Set of interactions belonging to this update
  ) => {
    // Record render metrics
    if (phase === 'update' || phase === 'mount') {
      metricsRecorder.recordRenderEnd();
      
      // Log detailed profiling information in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Profiler ${id}]`, {
          phase,
          actualDuration: actualDuration.toFixed(2) + 'ms',
          baseDuration: baseDuration.toFixed(2) + 'ms',
          commitTime: commitTime.toFixed(2) + 'ms',
          interactions: interactions?.size || 0
        });
      }
    }
    
    // Call custom callback if provided
    if (onRender) {
      onRender(id, phase, actualDuration);
    }
    
    // Record render start for next frame
    metricsRecorder.recordRenderStart();
  };
  
  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
};