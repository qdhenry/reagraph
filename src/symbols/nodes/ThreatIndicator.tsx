import React, { FC, useMemo, useRef } from 'react';
import { useSpring, a } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide } from 'three';
import { animationConfig } from '../../utils/animation';

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
  const meshRef = useRef<any>(null);
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

  // Spring animation for entrance
  const { scale, opacity } = useSpring({
    from: {
      scale: [0.1, 0.1, 0.1],
      opacity: 0
    },
    to: {
      scale: [size * 1.8, size * 1.8, 0.1],
      opacity: 0.3
    },
    config: {
      ...animationConfig,
      duration: animated ? 500 : 0
    }
  });

  // Pulsing animation frame
  useFrame((state, delta) => {
    if (!animated || !meshRef.current) return;

    timeRef.current += delta * pulseSpeed;

    // Create pulsing effect
    const pulse = Math.sin(timeRef.current * 3) * 0.5 + 0.5;
    const pulsedScale = size * (1.8 + pulse * (pulseIntensity - 1));
    const pulsedOpacity = 0.2 + pulse * 0.3;

    meshRef.current.scale.set(pulsedScale, pulsedScale, 0.1);
    meshRef.current.material.opacity = pulsedOpacity;

    // Add emissive intensity for glow effect
    meshRef.current.material.emissiveIntensity = 0.2 + pulse * 0.4;
  });

  return (
    <group position={position}>
      <a.mesh ref={meshRef} scale={scale as any} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.2, size * 1.8, 32]} />
        <a.meshPhongMaterial
          side={DoubleSide}
          transparent={true}
          opacity={opacity}
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          depthWrite={false}
        />
      </a.mesh>
    </group>
  );
};
