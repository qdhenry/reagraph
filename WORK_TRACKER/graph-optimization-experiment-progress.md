# Graph Optimization Experiment Progress & Plan

## Project Overview
Implementation of a comprehensive Web Workers-based performance optimization experiment for the reagraph library, comparing baseline (main thread) vs optimized (Web Worker) graph rendering performance.

## Completed Work Summary

### Phase 1: Performance Baseline Setup ✅

#### 1. Directory Structure Created
```
src/experiments/graph-optimization/
├── baseline/           # Original implementation
├── optimized/          # Web Worker implementation
├── shared/             # Common utilities and types
├── comparison/         # Side-by-side comparison components
├── workers/            # Web Worker files
└── metrics/            # Performance measurement tools
```

#### 2. Performance Measurement Infrastructure ✅
- **PerformanceMonitor.tsx**: Real-time FPS, memory, and performance metrics display
- **MetricsRecorder.ts**: Performance data collection and aggregation
- **ProfilerWrapper.tsx**: React Profiler integration for render performance
- **types.ts**: Comprehensive TypeScript interfaces for metrics

#### 3. Experiment Pages Created ✅
- **Landing Page**: Overview and navigation (`index.tsx`)
- **Baseline Page**: Original implementation with performance monitoring
- **Optimized Page**: Web Worker implementation (currently using mock data)
- **Comparison Dashboard**: Side-by-side performance comparison
- **Metrics Dashboard**: Detailed performance analysis and benchmarks

#### 4. Web Worker Implementation ✅
- **layout.worker.ts**: Force-directed layout calculations in Web Worker
- **WorkerPool.ts**: Multi-worker management (4 workers by default)
- **WorkerBridge.ts**: React-Worker communication layer
- **useWorkerLayout.ts**: React hook for Web Worker integration
- **OptimizedGraphCanvas.tsx**: Enhanced GraphCanvas using Web Workers

### Current Issues Encountered

1. **Storybook Integration Problems**:
   - Module import errors
   - Suspense not defined
   - Build/bundling conflicts with Web Workers
   - Navigation limitations

2. **Fixed Issues**:
   - ✅ ProfilerWrapper interactions.size error (added null check)
   - ✅ PerformanceMonitor memory API checks
   - ✅ createStore initialization error (added empty object)
   - ✅ TypeScript HTML entity error in MetricsDashboard

## Next Steps: Standalone React App Plan

### Rationale for Moving Away from Storybook
1. **Performance Accuracy**: Storybook adds overhead that skews measurements
2. **Web Worker Compatibility**: Direct control over build process
3. **React 18 Features**: Full support for Suspense and concurrent features
4. **Clean Environment**: No Storybook-specific quirks or conflicts

### Implementation Plan: Option 2 - Standalone React App

#### 1. New Directory Structure
```
src/experiments/
├── app/
│   ├── index.html          # HTML entry point
│   ├── main.tsx           # React app entry
│   ├── App.tsx            # Main app component with routing
│   ├── Router.tsx         # Route definitions
│   ├── styles.css         # Global styles
│   └── components/
│       ├── Navigation.tsx  # App navigation
│       └── Layout.tsx     # Common layout wrapper
└── graph-optimization/     # Existing experiment code
```

#### 2. Key Files to Create

**src/experiments/app/index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reagraph Performance Experiments</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/experiments/app/main.tsx"></script>
  </body>
</html>
```

**src/experiments/app/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**src/experiments/app/App.tsx**
```typescript
import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<div>Loading...</div>}>
          <Router />
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
```

**src/experiments/app/Router.tsx**
```typescript
import { Routes, Route } from 'react-router-dom';
import { GraphOptimizationExperiment } from '../graph-optimization';
import { BaselinePage } from '../graph-optimization/baseline/BaselinePage';
import { OptimizedPage } from '../graph-optimization/optimized/OptimizedPage';
import { ComparisonDashboard } from '../graph-optimization/comparison/ComparisonDashboard';
import { MetricsDashboard } from '../graph-optimization/metrics/MetricsDashboard';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<GraphOptimizationExperiment />} />
      <Route path="/baseline" element={<BaselinePage />} />
      <Route path="/optimized" element={<OptimizedPage />} />
      <Route path="/compare" element={<ComparisonDashboard />} />
      <Route path="/metrics" element={<MetricsDashboard />} />
    </Routes>
  );
}
```

#### 3. Navigation Updates Required
- Replace all `window.parent.postMessage` calls with React Router navigation
- Update button click handlers to use `useNavigate` hook
- Convert navigation buttons to use `Link` components where appropriate

#### 4. Build Configuration

**vite.experiments.config.ts** (new file)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/experiments/app',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: '../../../dist-experiments',
    emptyOutDir: true
  },
  worker: {
    format: 'es'
  }
});
```

#### 5. Package.json Updates
```json
{
  "scripts": {
    "dev:experiments": "vite --config vite.experiments.config.ts",
    "build:experiments": "vite build --config vite.experiments.config.ts",
    "preview:experiments": "vite preview --config vite.experiments.config.ts"
  },
  "dependencies": {
    "react-router-dom": "^6.x.x"
  }
}
```

### Migration Steps

1. **Install Dependencies**
   ```bash
   npm install react-router-dom
   ```

2. **Create App Structure**
   - Create all files listed above
   - Move existing components into new structure

3. **Update Navigation**
   - Replace Storybook navigation with React Router
   - Update all navigation handlers

4. **Configure Build**
   - Create Vite config for experiments
   - Update package.json scripts

5. **Test & Verify**
   - Ensure Web Workers load correctly
   - Verify performance monitoring works
   - Test all navigation paths

### Expected Benefits

1. **Clean Environment**: No Storybook overhead or conflicts
2. **Accurate Metrics**: True performance measurements
3. **Full React Support**: All React 18 features available
4. **Better DX**: Faster builds, hot reload, better errors
5. **Extensibility**: Easy to add more experiments

### Success Criteria

- ✅ All pages load without errors
- ✅ Web Workers function correctly
- ✅ Performance metrics are accurate
- ✅ Navigation works seamlessly
- ✅ Build process is clean and fast

## Timeline

- Phase 1 (Completed): Performance infrastructure and basic pages
- Phase 2 (Current): Migrate to standalone React app
- Phase 3 (Next): Implement real Web Worker optimizations
- Phase 4 (Future): Add more layout algorithms and optimizations
- Phase 5 (Future): Comprehensive benchmarking and reporting

## Notes

- Web Worker implementation is complete but needs testing in clean environment
- Performance monitoring is working but may need calibration
- Consider adding more graph sizes and complexity tests
- May want to add export functionality for benchmark results

---
*Last Updated: [Current Date]*
*Status: Ready to migrate to standalone app*