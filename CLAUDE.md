# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start Storybook development server on port 9009
- `npm run build` - Build library for production
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Lint TypeScript/JavaScript files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run prettier` - Format code with Prettier

### Storybook
- `npm run build-storybook` - Build Storybook for production
- `npm run chromatic` - Deploy to Chromatic for visual testing

## Architecture

Reagraph is a WebGL-based React graph visualization library built on Three.js and React Three Fiber.

### Core Structure
- **GraphCanvas** (`src/GraphCanvas/`): Main component that wraps the entire graph in a Three.js Canvas
- **GraphScene** (`src/GraphScene.tsx`): Core scene component that orchestrates all graph elements
- **Store** (`src/store.ts`): Zustand-based state management for nodes, edges, clusters, and interactions
- **Layout System** (`src/layout/`): Multiple layout algorithms (force-directed, hierarchical, circular, etc.)
- **Symbols** (`src/symbols/`): Renderable components for nodes, edges, clusters, and labels

### Key Dependencies
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Three.js utilities and helpers
- **graphology**: Graph data structure and algorithms
- **zustand**: Lightweight state management
- **d3-force-3d**: 3D force simulation algorithms

### Data Flow
1. User provides nodes/edges to GraphCanvas
2. Data flows through GraphScene to store
3. Layout algorithms position nodes/edges
4. Symbol components render visual elements
5. Interaction handlers update store state

### Performance Considerations
- Uses WebGL for high-performance rendering
- Graph data stored in graphology for efficient algorithms
- Layout calculations happen in web workers when possible
- Supports clustering for large datasets

### Testing
- Uses Vitest with jsdom environment
- Test files located alongside source files
- Coverage reporting configured

## Development Notes

### Building
The project uses Vite with two build modes:
- Library mode (`npm run build`): Outputs to `dist/` for npm distribution
- Development mode: Used by Storybook

### TypeScript Configuration
- Non-strict mode enabled for flexibility
- Base URL set to `./src` for clean imports
- Declaration files generated to `dist/`