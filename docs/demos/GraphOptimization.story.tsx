import React from 'react';
import { GraphOptimizationExperiment } from '../../src/experiments/graph-optimization/index';
import { BaselinePage } from '../../src/experiments/graph-optimization/baseline/BaselinePage';
import { OptimizedPage } from '../../src/experiments/graph-optimization/optimized/OptimizedPage';
import { ComparisonDashboard } from '../../src/experiments/graph-optimization/comparison/ComparisonDashboard';
import { MetricsDashboard } from '../../src/experiments/graph-optimization/metrics/MetricsDashboard';

export default {
  title: 'Experiments/Graph Optimization',
  parameters: {
    layout: 'fullscreen',
  }
};

export const Overview = () => <GraphOptimizationExperiment />;
Overview.storyName = 'Overview';

export const Baseline = () => <BaselinePage />;
Baseline.storyName = 'Baseline Implementation';

export const Optimized = () => <OptimizedPage />;
Optimized.storyName = 'Optimized Implementation';

export const Comparison = () => <ComparisonDashboard />;
Comparison.storyName = 'Side-by-Side Comparison';

export const Metrics = () => <MetricsDashboard />;
Metrics.storyName = 'Performance Metrics';