import React from 'react';
import { GraphCanvas } from '../../src';
import { simpleEdges, simpleNodes } from '../assets/demo';

export default { title: 'Demos/Labels', component: GraphCanvas };

export const All = () => (
  <GraphCanvas labelType="all" nodes={simpleNodes} edges={simpleEdges} />
);

export const LongLabels = () => (
  <GraphCanvas
    labelType="all"
    nodes={[
      { id: '1', label: 'Department of Defense Logistics and Operations' },
      {
        id: '2',
        label:
          'The Security Operations of the Cyber Defense System for the United States of America'
      }
    ]}
    edges={[
      {
        id: '1-2',
        source: '1',
        target: '2',
        label:
          'The Security Operations of the Cyber Defense System for the United States of America'
      }
    ]}
  />
);

export const NodesOnly = () => (
  <GraphCanvas labelType="nodes" nodes={simpleNodes} edges={simpleEdges} />
);

export const EdgesOnly = () => (
  <GraphCanvas labelType="edges" nodes={simpleNodes} edges={simpleEdges} />
);

export const Automatic = () => (
  <GraphCanvas labelType="auto" nodes={simpleNodes} edges={simpleEdges} />
);

export const SubLabels = () => (
  <GraphCanvas
    nodes={[
      { id: '1', label: 'Node 1', subLabel: 'SubLabel 1' },
      { id: '2', label: 'Node 2' },
      { id: '3', label: 'Node 3', subLabel: 'SubLabel 3' }
    ]}
    edges={[
      { source: '1', target: '2', id: '1-2' },
      { source: '3', target: '1', id: '3-1' }
    ]}
  />
);

export const EdgeSubLabels = () => (
  <GraphCanvas
    labelType="edges"
    nodes={[
      { id: '1', label: 'Node 1' },
      { id: '2', label: 'Node 2' },
      { id: '3', label: 'Node 3' },
      { id: '4', label: 'Node 4' }
    ]}
    edges={[
      {
        source: '1',
        target: '2',
        id: '1-2',
        label: 'Edge 1-2',
        subLabel: 'Sub Label 1-2',
        subLabelPlacement: 'below'
      },
      {
        source: '1',
        target: '3',
        id: '1-3',
        label: 'Edge 1-3',
        subLabel: 'Sub Label 1-3',
        subLabelPlacement: 'above'
      },
      {
        source: '4',
        target: '2',
        id: '4-2',
        label: 'Edge 4-2',
        subLabel: 'Sub Label 4-2'
      }
    ]}
  />
);
