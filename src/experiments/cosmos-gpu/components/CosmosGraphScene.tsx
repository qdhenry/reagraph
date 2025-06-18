import React, { FC, useRef } from 'react';
import { GraphScene, GraphSceneProps, GraphSceneRef } from '../../../GraphScene';

export interface CosmosGraphSceneProps extends GraphSceneProps {}

export const CosmosGraphScene: FC<CosmosGraphSceneProps> = (props) => {
  const graphSceneRef = useRef<GraphSceneRef>(null);

  // The cosmos layout will handle its own position updates
  // through the layout adapter's internal update cycle
  
  return <GraphScene ref={graphSceneRef} {...props} />;
};