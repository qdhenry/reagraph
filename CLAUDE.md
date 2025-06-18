# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Storybook development server on port 9009
npm run build      # Build library for production (ESM and UMD bundles)
npm test           # Run tests with Vitest
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix linting issues
npm run prettier   # Format code
```

## Architecture

reagraph is a WebGL-based network graph visualization library using Three.js and React Three Fiber.

### Core Component Hierarchy
- `GraphCanvas` - Main wrapper that sets up the Three.js canvas and provides context
  - `GraphScene` - Core rendering logic managing nodes, edges, and layouts
    - `symbols/` - Modular renderers for nodes, edges, clusters, and labels
    - `layout/` - Pluggable layout algorithms (forceDirected, hierarchical, circular, etc.)

### State Management
Uses Zustand with a custom store pattern (`store.ts`). The store is created per GraphCanvas instance and passed via React context.

### Layout System
- Layout algorithms extend from base types in `layout/types.ts`
- `layoutProvider.ts` manages layout factory registration
- Layouts operate on Graphology graph instances
- 3D layouts use `d3-force-3d`, 2D layouts use various Graphology plugins

### Performance Considerations
- Edge rendering is optimized with selective Three.js object promotion
- Large graphs benefit from using `animated={false}` on GraphCanvas
- Node sizing can be computed via PageRank or centrality for better visualization

### TypeScript Configuration
- Non-strict mode (various strict checks disabled)
- Base URL set to `./src` for absolute imports
- Target: ES2015, Module: ESNext