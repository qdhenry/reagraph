import { LayoutFactoryProps, layoutProvider } from '../../../layout';
import { gpuForceDirected } from './gpuForceDirected';

export const cosmosLayoutProvider = {
  cosmosForceDirected: (params: any) => {
    return gpuForceDirected({
      ...params,
      iterations: params?.maxIterations || 300,
      nodeRepulsion: params?.nodeRepulsion || 1.0,
      linkDistance: params?.linkDistance || 30,
      linkSpring: params?.linkStrength || 1.0,
      gravity: params?.gravity || 0.1,
      centerForce: params?.centerStrength || 0.1,
      velocityDecay: params?.velocityDecay || 0.15,
      cosmosConfig: params?.cosmosConfig,
    });
  },
};

export function getCombinedLayoutBuilder() {
  return (type: string, params?: any) => {
    if (type in cosmosLayoutProvider) {
      return cosmosLayoutProvider[type as keyof typeof cosmosLayoutProvider](params);
    }
    // Fall back to default layout provider
    return layoutProvider({ type: type as any, ...params } as LayoutFactoryProps);
  };
}