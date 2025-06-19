import React, { FC, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, Mesh, MeshPhongMaterial } from 'three';

export interface ThreatIndicatorProps {
  /**
   * Position of the threat indicator
   */
  position: [number, number, number];

  /**
   * Size of the indicator
   */
  size: number;

  /**
   * Threat severity level
   */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /**
   * Whether to animate the indicator
   */
  animated?: boolean;

  /**
   * Pulse intensity multiplier
   */
  pulseIntensity?: number;

  /**
   * Pulse speed multiplier
   */
  pulseSpeed?: number;
}

/**
 * Animated threat severity indicator with pulsing effect
 */
export const ThreatIndicator: FC<ThreatIndicatorProps> = ({
  position,
  size,
  severity,
  animated = true,
  pulseIntensity = 1.2,
  pulseSpeed = 1.0
}) => {
  const meshRef = useRef<Mesh<any, MeshPhongMaterial>>(null);
  const timeRef = useRef(0);

  // Color mapping for severity levels
  const severityColors = useMemo(
    () => ({
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#D97706',
      low: '#65A30D'
    }),
    []
  );

  const color = useMemo(
    () => new Color(severityColors[severity]),
    [severity, severityColors]
  );

  // Pulsing animation frame
  useFrame((state, delta) => {
    if (!animated || !meshRef.current) return;

    timeRef.current += delta * pulseSpeed;

    // Create pulsing effect with different frequencies for different severities
    const frequency = severity === 'critical' ? 4 : 2.5;
    const pulse = Math.sin(timeRef.current * frequency) * 0.5 + 0.5;

    // Scale pulsing
    const baseScale = size * 1.5;
    const pulsedScale = baseScale * (1 + pulse * (pulseIntensity - 1) * 0.3);
    meshRef.current.scale.set(pulsedScale, pulsedScale, 0.1);

    // Opacity pulsing
    const baseopacity = 0.4;
    const pulsedOpacity = baseopacity * (0.3 + pulse * 0.7);
    meshRef.current.material.opacity = pulsedOpacity;

    // Emissive intensity for glow effect
    meshRef.current.material.emissiveIntensity = 0.1 + pulse * 0.6;
  });

  const baseScale = animated ? size * 1.5 : size * 1.5;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={[baseScale, baseScale, 0.1]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[size * 1.0, size * 1.4, 32]} />
        <meshPhongMaterial
          side={DoubleSide}
          transparent={true}
          opacity={0.4}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
