import React, {
  FC,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useState
} from 'react';
import { a } from '@react-spring/three';
import { Instances, Instance, useCursor } from '@react-three/drei';
import { DoubleSide, Color, ColorRepresentation } from 'three';
import type { ThreeEvent } from '@react-three/fiber';

import { useStore } from '../../store';
import {
  InternalGraphNode,
  ContextMenuEvent,
  NodeRenderer,
  CollapseProps
} from '../../types';
import { animationConfig } from '../../utils/animation';
import { useCameraControls } from '../../CameraControls/useCameraControls';
import { useDrag } from '../../utils/useDrag';
import { useHoverIntent } from '../../utils/useHoverIntent';
import { Ring } from '../Ring';
import { Label } from '../Label';
import { Icon } from './Icon';
import { ThreatIndicator } from './ThreatIndicator';
import { useSpring } from '@react-spring/three';

export interface InstancedNodesProps {
  /**
   * Whether the nodes should be animated.
   */
  animated?: boolean;

  /**
   * Whether the nodes are disabled.
   */
  disabled?: boolean;

  /**
   * Whether the nodes are draggable.
   */
  draggable?: boolean;

  /**
   * Constrain dragging to the cluster bounds.
   */
  constrainDragging?: boolean;

  /**
   * The url for the label font.
   */
  labelFontUrl?: string;

  /**
   * The function to use to render the node.
   */
  renderNode?: NodeRenderer;

  /**
   * The context menu for the node.
   */
  contextMenu?: (event: ContextMenuEvent) => React.ReactNode;

  /**
   * Whether to show labels on nodes.
   */
  showLabels?: boolean;

  /**
   * Whether to show icons on nodes.
   */
  showIcons?: boolean;

  /**
   * Event handlers
   */
  onPointerOver?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onPointerOut?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onClick?: (
    node: InternalGraphNode,
    props?: CollapseProps,
    event?: ThreeEvent<MouseEvent>
  ) => void;
  onDoubleClick?: (
    node: InternalGraphNode,
    event: ThreeEvent<MouseEvent>
  ) => void;
  onContextMenu?: (node?: InternalGraphNode, props?: any) => void;
  onDragged?: (node: InternalGraphNode) => void;
}

interface NodeInstanceGroup {
  nodes: InternalGraphNode[];
  color: ColorRepresentation;
  opacity: number;
  size: number;
  highlighted: boolean;
}

interface DraggableInstanceProps {
  node: InternalGraphNode;
  position: [number, number, number];
  size: number;
  draggable: boolean;
  disabled: boolean;
  constrainDragging: boolean;
  clusters: Map<string, any>;
  draggedNodeId: string | null;
  setDraggedNodeId: (id: string | null) => void;
  onClick?: (
    node: InternalGraphNode,
    props?: any,
    event?: ThreeEvent<MouseEvent>
  ) => void;
  onDoubleClick?: (
    node: InternalGraphNode,
    event: ThreeEvent<MouseEvent>
  ) => void;
  onContextMenu?: (node?: InternalGraphNode, props?: any) => void;
  onPointerOver?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onPointerOut?: (
    node: InternalGraphNode,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onDragged?: (node: InternalGraphNode) => void;
  setHoveredNodeId: (id: string | null) => void;
  setNodePosition: (id: string, position: any) => void;
  addDraggingId: (id: string) => void;
  removeDraggingId: (id: string) => void;
}

const DraggableInstance: FC<DraggableInstanceProps> = ({
  node,
  position,
  size,
  draggable,
  disabled,
  constrainDragging,
  clusters,
  draggedNodeId,
  setDraggedNodeId,
  onClick,
  onDoubleClick,
  onContextMenu,
  onPointerOver,
  onPointerOut,
  onDragged,
  setHoveredNodeId,
  setNodePosition,
  addDraggingId,
  removeDraggingId
}) => {
  // Individual event handlers for this specific instance
  const handleInstanceClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (disabled || !onClick) return;
      event.stopPropagation();
      onClick(node, undefined, event);
    },
    [disabled, onClick, node]
  );

  const handleInstanceDoubleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (disabled || !onDoubleClick) return;
      event.stopPropagation();
      onDoubleClick(node, event);
    },
    [disabled, onDoubleClick, node]
  );

  const handleInstanceContextMenu = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (disabled || !onContextMenu) return;
      event.stopPropagation();
      onContextMenu(node);
    },
    [disabled, onContextMenu, node]
  );

  const handleInstancePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!draggable || disabled) return;
      event.stopPropagation();
      if (!draggedNodeId) {
        setDraggedNodeId(node.id);
      }
    },
    [draggable, disabled, draggedNodeId, setDraggedNodeId, node.id]
  );

  const handleInstancePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (disabled) return;
      setHoveredNodeId(node.id);
      onPointerOver?.(node, event);
    },
    [disabled, setHoveredNodeId, node, onPointerOver]
  );

  const handleInstancePointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (disabled) return;
      setHoveredNodeId(null);
      onPointerOut?.(node, event);
    },
    [disabled, setHoveredNodeId, onPointerOut, node]
  );

  // Individual drag binding for this specific node
  const nodeCluster = clusters.get(node.cluster);
  const isThisNodeDragging = draggedNodeId === node.id;

  const instanceBind = useDrag({
    draggable: draggable && isThisNodeDragging,
    position: node.position,
    bounds: constrainDragging ? nodeCluster?.position : undefined,
    set: pos => {
      const updatedPosition = {
        ...node.position,
        x: pos.x,
        y: pos.y,
        z: pos.z
      };
      setNodePosition(node.id, updatedPosition);
    },
    onDragStart: () => {
      addDraggingId(node.id);
    },
    onDragEnd: () => {
      removeDraggingId(node.id);
      onDragged?.(node);
      setDraggedNodeId(null);
    }
  });

  return (
    <Instance
      position={position}
      scale={[size, size, size]}
      userData={{ nodeId: node.id, type: 'node' }}
      onClick={handleInstanceClick}
      onDoubleClick={handleInstanceDoubleClick}
      onContextMenu={handleInstanceContextMenu}
      onPointerDown={handleInstancePointerDown}
      onPointerOver={handleInstancePointerOver}
      onPointerOut={handleInstancePointerOut}
      {...(isThisNodeDragging ? instanceBind() : {})}
    />
  );
};

/**
 * InstancedNodes component using drei's Instances for optimal performance with large graphs.
 * Groups nodes by visual state (active, inactive, selected, dragging) similar to the edge optimization pattern.
 */
export const InstancedNodes: FC<InstancedNodesProps> = ({
  animated = true,
  disabled = false,
  draggable = false,
  constrainDragging = false,
  labelFontUrl,
  renderNode,
  contextMenu,
  showLabels = true,
  showIcons = true,
  onPointerOver,
  onPointerOut,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragged
}) => {
  const cameraControls = useCameraControls();
  const theme = useStore(state => state.theme);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const draggingIds = useStore(state => state.draggingIds);
  const collapsedNodeIds = useStore(state => state.collapsedNodeIds);
  const actives = useStore(state => state.actives || []);
  const selections = useStore(state => state.selections || []);
  const hasSelections = selections.length > 0;
  const center = useStore(state => state.centerPosition);
  const clusters = useStore(state => state.clusters);

  const addDraggingId = useStore(state => state.addDraggingId);
  const removeDraggingId = useStore(state => state.removeDraggingId);
  const setHoveredNodeId = useStore(state => state.setHoveredNodeId);
  const setNodePosition = useStore(state => state.setNodePosition);
  const setCollapsedNodeIds = useStore(state => state.setCollapsedNodeIds);

  const isDragging = draggingIds.length > 0;

  // Drag state management for instanced nodes
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const isDraggingCurrent = draggedNodeId !== null;

  // Helper function to get icon URL from iconName
  const getIconUrl = useCallback((iconName: string) => {
    const iconMap: Record<string, string> = {
      java: '/docs/assets/computer.svg',
      dotnet: '/docs/assets/product.svg',
      go: '/docs/assets/demon.svg',
      python: '/docs/assets/fire.svg',
      default: '/docs/assets/user.svg'
    };
    return iconMap[iconName] || iconMap.default;
  }, []);

  // Optimize instance grouping strategy for better performance
  const nodeGroups = useMemo((): NodeInstanceGroup[] => {
    const groups = new Map<string, NodeInstanceGroup>();

    // Pre-compute threat severity colors for reuse
    const threatColors: Record<string, string> = {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#D97706',
      low: '#65A30D'
    };

    // Pre-compute selection states for performance
    const activeSet = new Set(actives);
    const selectionSet = new Set(selections);
    const draggingSet = new Set(draggingIds);

    // Size binning function to reduce groups (round to nearest 0.5)
    const binSize = (size: number) => Math.round(size * 2) / 2;

    nodes.forEach(node => {
      const isActive = activeSet.has(node.id);
      const isSelected = selectionSet.has(node.id);
      const isDraggingCurrent = draggingSet.has(node.id);

      const shouldHighlight = isActive || isSelected || isDraggingCurrent;

      const selectionOpacity = hasSelections
        ? shouldHighlight
          ? theme.node.selectedOpacity
          : theme.node.inactiveOpacity
        : theme.node.opacity;

      // Determine color with threat severity handling
      let color: ColorRepresentation;
      const threatSeverity = node.data?.severity;

      if (shouldHighlight) {
        color = theme.node.activeFill;
      } else if (threatSeverity && threatColors[threatSeverity]) {
        color = threatColors[threatSeverity];
      } else {
        color = node.fill || theme.node.fill;
      }

      // Bin size to reduce number of groups
      const binnedSize = binSize(node.size || 7);

      // Simplified grouping key without threat severity to reduce groups
      // Only include essential visual properties that affect rendering
      const groupKey = `${color}-${selectionOpacity}-${binnedSize}-${shouldHighlight}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          nodes: [],
          color,
          opacity: selectionOpacity,
          size: binnedSize,
          highlighted: shouldHighlight
        });
      }

      groups.get(groupKey)!.nodes.push(node);
    });

    // Sort groups by size (largest first) for better batching performance
    const sortedGroups = Array.from(groups.values()).sort(
      (a, b) => b.nodes.length - a.nodes.length
    );

    return sortedGroups;
  }, [nodes, actives, selections, draggingIds, hasSelections, theme]);

  // Global cursor management for drag states
  useCursor(isDraggingCurrent, 'grabbing');

  return (
    <group>
      {nodeGroups.map((group, groupIndex) => {
        const normalizedColor = new Color(group.color);

        return (
          <Instances
            key={`${groupIndex}-${group.color}-${group.size}`}
            limit={group.nodes.length}
            range={group.nodes.length}
          >
            <sphereGeometry args={[1, 25, 25]} />
            <a.meshPhongMaterial
              side={DoubleSide}
              transparent={true}
              fog={true}
              opacity={group.opacity}
              color={normalizedColor}
              emissive={normalizedColor}
              emissiveIntensity={0.7}
            />

            {group.nodes.map((node, nodeIndex) => {
              const position = node.position
                ? [
                  node.position.x,
                  node.position.y,
                  group.highlighted ? node.position.z + 1 : node.position.z
                ]
                : center
                  ? [center.x, center.y, 0]
                  : [0, 0, 0];

              return (
                <DraggableInstance
                  key={node.id}
                  node={node}
                  position={position as [number, number, number]}
                  size={group.size}
                  draggable={draggable}
                  disabled={disabled}
                  constrainDragging={constrainDragging}
                  clusters={clusters}
                  draggedNodeId={draggedNodeId}
                  setDraggedNodeId={setDraggedNodeId}
                  onClick={onClick}
                  onDoubleClick={onDoubleClick}
                  onContextMenu={onContextMenu}
                  onPointerOver={onPointerOver}
                  onPointerOut={onPointerOut}
                  onDragged={onDragged}
                  setHoveredNodeId={setHoveredNodeId}
                  setNodePosition={setNodePosition}
                  addDraggingId={addDraggingId}
                  removeDraggingId={removeDraggingId}
                />
              );
            })}
          </Instances>
        );
      })}

      {/* Selection rings - render separately for selected nodes */}
      {selections.map(selectedId => {
        const node = nodes.find(n => n.id === selectedId);
        if (!node || !node.position) return null;

        const size = node.size || 7;
        const position = [
          node.position.x,
          node.position.y,
          node.position.z + 0.1
        ];

        return (
          <group
            key={`ring-${selectedId}`}
            position={position as [number, number, number]}
          >
            <Ring
              opacity={0.5}
              size={size}
              animated={animated}
              color={theme.ring.activeFill}
            />
          </group>
        );
      })}

      {/* Threat severity indicators - pulsing rings for critical/high threats */}
      {nodes.map(node => {
        const threatSeverity = node.data?.severity;
        if (
          !node.position ||
          !threatSeverity ||
          (threatSeverity !== 'critical' && threatSeverity !== 'high')
        ) {
          return null;
        }

        const size = node.size || 7;
        const position = [
          node.position.x,
          node.position.y,
          node.position.z - 0.5
        ];

        const pulseIntensity = threatSeverity === 'critical' ? 1.5 : 1.2;
        const pulseSpeed = threatSeverity === 'critical' ? 2 : 1.5;

        return (
          <ThreatIndicator
            key={`threat-${node.id}`}
            position={position as [number, number, number]}
            size={size}
            severity={threatSeverity}
            animated={animated}
            pulseIntensity={pulseIntensity}
            pulseSpeed={pulseSpeed}
          />
        );
      })}

      {/* Labels - render separately for all nodes when enabled */}
      {showLabels &&
        nodes.map(node => {
          if (!node.position || !node.label) return null;

          const size = node.size || 7;
          const position = [
            node.position.x,
            node.position.y,
            node.position.z + size + 5
          ];

          return (
            <group
              key={`label-${node.id}`}
              position={position as [number, number, number]}
            >
              <Label
                text={node.label}
                fontUrl={labelFontUrl}
                color={theme.node.label?.color}
                opacity={1}
                fontSize={Math.max(3, size * 0.5)}
              />
            </group>
          );
        })}

      {/* Icons - render separately for all nodes when enabled */}
      {showIcons &&
        nodes.map(node => {
          if (!node.position || !node.data?.iconName) return null;

          const size = node.size || 7;
          const position = [
            node.position.x,
            node.position.y,
            node.position.z + 0.5
          ];

          return (
            <group
              key={`icon-${node.id}`}
              position={position as [number, number, number]}
            >
              <Icon
                id={node.id}
                image={getIconUrl(node.data.iconName)}
                size={size * 1.5}
                opacity={0.9}
                animated={animated}
                color="#FFFFFF"
                node={node}
                active={false}
                selected={false}
              />
            </group>
          );
        })}
    </group>
  );
};
