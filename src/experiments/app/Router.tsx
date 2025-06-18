import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GraphOptimizationExperiment } from '../graph-optimization';
import { BaselinePage } from '../graph-optimization/baseline/BaselinePage';
import { OptimizedPage } from '../graph-optimization/optimized/OptimizedPage';
import { ComparisonDashboard } from '../graph-optimization/comparison/ComparisonDashboard';
import { MetricsDashboard } from '../graph-optimization/metrics/MetricsDashboard';
import { CosmosGpuPage } from '../cosmos-gpu';
import { ComparisonDashboard as CosmosComparisonDashboard } from '../cosmos-gpu/comparison/ComparisonDashboard';
import { GpuJsExperiment } from '../gpu-js';
import { GpuGraphScene } from '../gpu-js/components/GpuGraphScene';
import { PerformanceComparison } from '../gpu-js/comparison/PerformanceComparison';
import { GpuJsTest } from '../gpu-js/test';
import { SimpleGpuDemo } from '../gpu-js/simple-demo';
import { ErrorBoundary } from '../gpu-js/components/ErrorBoundary';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<GraphOptimizationExperiment />} />
      <Route path="/baseline" element={<BaselinePage />} />
      <Route path="/optimized" element={<OptimizedPage />} />
      <Route path="/compare" element={<ComparisonDashboard />} />
      <Route path="/metrics" element={<MetricsDashboard />} />
      <Route path="/cosmos-gpu" element={<CosmosGpuPage />} />
      <Route path="/cosmos-compare" element={<CosmosComparisonDashboard />} />
      <Route path="/gpu-js" element={<ErrorBoundary><GpuJsExperiment /></ErrorBoundary>} />
      <Route path="/gpu-js/test" element={<GpuJsTest />} />
      <Route path="/gpu-js/simple" element={<SimpleGpuDemo />} />
      <Route path="/gpu-js/demo" element={<ErrorBoundary><GpuGraphScene /></ErrorBoundary>} />
      <Route path="/gpu-js/comparison" element={<ErrorBoundary><PerformanceComparison /></ErrorBoundary>} />
    </Routes>
  );
}