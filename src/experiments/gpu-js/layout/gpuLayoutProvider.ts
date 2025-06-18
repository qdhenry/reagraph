import { LayoutFactoryProps, layoutProvider } from '../../../layout';
import { gpuForceDirected } from './gpuForceDirected';

export const gpuLayoutProvider = {
  gpuForceDirected: (params: any) => {
    return gpuForceDirected({
      ...params,
      iterations: params?.iterations || 300,
      nodeStrength: params?.nodeStrength || -30,
      linkDistance: params?.linkDistance || 30,
      linkStrength: params?.linkStrength || 1,
      centerStrength: params?.centerStrength || 0.1,
      velocityDecay: params?.velocityDecay || 0.4,
      alphaMin: params?.alphaMin || 0.001,
      alphaDecay: params?.alphaDecay || 0.0228,
    });
  },
};

export function getGpuLayoutBuilder() {
  return (type: string, params?: any) => {
    if (type in gpuLayoutProvider) {
      return gpuLayoutProvider[type as keyof typeof gpuLayoutProvider](params);
    }
    // Fall back to default layout provider
    return layoutProvider({ type: type as any, ...params } as LayoutFactoryProps);
  };
}