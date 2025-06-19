import type { GraphNode, GraphEdge } from '../types';

export interface MIGNode {
  id: string;
  data: {
    name: string;
    iconName?: string;
    threats?: Array<{
      id: string;
      name: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      serviceId: string;
    }>;
    vulnerabilities?: any[];
    indicators?: string[];
    infraTags?: Record<string, string>;
    stackTags?: Record<string, string>;
  };
  type: string;
  'readable-id': string;
}

export interface MIGEdge {
  id: string;
  source: string;
  target: string;
  tags?: string[];
  apiType?: string;
  flowIds?: string[];
  endArrow?: boolean;
  startArrow?: boolean;
  targetType?: string;
  'readable-id': string;
}

export interface MIGData {
  nodes: MIGNode[];
  edges: MIGEdge[];
}

/**
 * Get the highest severity level from a list of threats
 */
export function getHighestThreatSeverity(
  threats: Array<{ severity: string }> = []
): 'critical' | 'high' | 'medium' | 'low' | 'none' {
  if (threats.some(t => t.severity === 'critical')) return 'critical';
  if (threats.some(t => t.severity === 'high')) return 'high';
  if (threats.some(t => t.severity === 'medium')) return 'medium';
  if (threats.some(t => t.severity === 'low')) return 'low';
  return 'none';
}

/**
 * Get color based on threat severity
 */
export function getThreatColor(severity: string): string {
  const colorMap: Record<string, string> = {
    critical: '#DC2626', // Red
    high: '#EA580C', // Orange
    medium: '#D97706', // Amber
    low: '#65A30D', // Green
    none: '#6B7280' // Gray
  };
  return colorMap[severity] || colorMap.none;
}

/**
 * Get node size based on threat severity and indicators
 */
export function getNodeSize(
  severity: string,
  indicators: string[] = [],
  baseSize: number = 7
): number {
  const sizeMultiplier: Record<string, number> = {
    critical: 1.5,
    high: 1.3,
    medium: 1.1,
    low: 1.0,
    none: 0.9
  };

  const multiplier = sizeMultiplier[severity] || 1.0;

  // Increase size for internet-facing services
  const isInternetFacing = indicators.includes('isInternetFacing');
  const finalMultiplier = isInternetFacing ? multiplier * 1.2 : multiplier;

  return Math.max(baseSize * finalMultiplier, 5);
}

/**
 * Transform MIG data to Reagraph format
 */
export function transformMIGData(migData: any[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  migData.forEach(item => {
    if (item.type === 'service' || item.type === 'sub-processor') {
      const threats = item.data?.threats || [];
      const severity = getHighestThreatSeverity(threats);
      const color = getThreatColor(severity);
      const size = getNodeSize(severity, item.data?.indicators);

      nodes.push({
        id: item.id,
        label: item.data?.name || item['readable-id'] || item.readable_id,
        size,
        fill: color,
        data: {
          iconName: item.data?.iconName || 'default',
          threats,
          severity,
          indicators: item.data?.indicators || [],
          infraTags: item.data?.infraTags || {},
          stackTags: item.data?.stackTags || {},
          threatCount: threats.length,
          vulnerabilityCount: (item.data?.vulnerabilities || []).length,
          type: item.type
        }
      });
    } else if (item.source && item.target) {
      // This is an edge
      edges.push({
        id: item.id,
        source: item.source,
        target: item.target,
        label:
          item['readable-id'] ||
          item.readable_id ||
          `${item.source}-${item.target}`,
        data: {
          apiType: item.apiType,
          flowIds: item.flowIds || [],
          targetType: item.targetType
        }
      });
    } else if (item.cveName) {
      // This is a vulnerability - we can use these to enhance threat data later
      // For now, skip these as they're not nodes or edges
    }
  });

  return { nodes, edges };
}

/**
 * Filter nodes by threat severity
 */
export function filterNodesBySeverity(
  nodes: GraphNode[],
  minSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none'
): GraphNode[] {
  const severityOrder = ['none', 'low', 'medium', 'high', 'critical'];
  const minIndex = severityOrder.indexOf(minSeverity);

  return nodes.filter(node => {
    const nodeSeverity = node.data?.severity || 'none';
    const nodeIndex = severityOrder.indexOf(nodeSeverity);
    return nodeIndex >= minIndex;
  });
}

/**
 * Group nodes by infrastructure tags
 */
export function groupNodesByInfraTags(
  nodes: GraphNode[]
): Record<string, GraphNode[]> {
  return nodes.reduce(
    (groups, node) => {
      const region = node.data?.infraTags?.region || 'unknown';
      const cluster = node.data?.infraTags?.cluster || 'unknown';
      const key = `${region}-${cluster}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(node);

      return groups;
    },
    {} as Record<string, GraphNode[]>
  );
}

/**
 * Create performance stats for display
 */
export function createPerformanceStats(nodes: GraphNode[], edges: GraphEdge[]) {
  const threatCounts = nodes.reduce(
    (counts, node) => {
      const severity = node.data?.severity || 'none';
      counts[severity] = (counts[severity] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>
  );

  const totalThreats = nodes.reduce((total, node) => {
    return total + (node.data?.threatCount || 0);
  }, 0);

  const internetFacingServices = nodes.filter(node =>
    node.data?.indicators?.includes('isInternetFacing')
  ).length;

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    totalThreats,
    internetFacingServices,
    threatCounts,
    avgThreatsPerService: totalThreats / nodes.length
  };
}
