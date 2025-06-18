import React, { FC, useMemo } from 'react';
import { GraphCanvas, GraphCanvasProps } from '../../../GraphCanvas';
import { CosmosGraphScene } from './CosmosGraphScene';
import { getCombinedLayoutBuilder } from '../layout/cosmosLayoutProvider';
import { LayoutOverrides } from '../../../layout';

export interface CosmosGraphCanvasProps extends GraphCanvasProps {
  cosmosConfig?: any;
}

export const CosmosGraphCanvas: FC<CosmosGraphCanvasProps> = ({
  cosmosConfig,
  layoutOverrides,
  children,
  ...props
}) => {
  const combinedLayoutOverrides = useMemo<LayoutOverrides>(() => {
    const builder = getCombinedLayoutBuilder();
    
    return {
      ...layoutOverrides,
      getLayout: (type: string, params?: any) => {
        // Use cosmosForceDirected for custom layout type
        const layoutType = type === 'custom' ? 'cosmosForceDirected' : type;
        const layoutParams = {
          ...params,
          cosmosConfig,
        };
        return builder(layoutType, layoutParams);
      },
    };
  }, [layoutOverrides, cosmosConfig]);

  return (
    <GraphCanvas {...props} layoutOverrides={combinedLayoutOverrides}>
      {children}
    </GraphCanvas>
  );
};