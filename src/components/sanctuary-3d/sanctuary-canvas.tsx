"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Points as ThreePoints } from 'three';
import { SanctuaryCanvasProps } from './types';
import { getDeviceQualityPolicy, SceneQuality } from './scene-quality';
import { scenePresets } from './scene-presets';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function RenderTicker({ active, fps }: { active: boolean; fps: number }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(invalidate, 1000 / fps);
    return () => window.clearInterval(timer);
  }, [active, fps, invalidate]);

  return null;
}

function Particles({ count, color }: { count: number; color: string }) {
  const pointsRef = useRef<ThreePoints>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      values[index * 3] = (Math.random() - 0.5) * 20;
      values[index * 3 + 1] = (Math.random() - 0.5) * 14;
      values[index * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return values;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.025;
    pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.22;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.055}
        transparent
        opacity={0.48}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function SceneContent({
  variant,
  quality,
  isVisible,
}: {
  variant: SanctuaryCanvasProps['variant'];
  quality: Exclude<SceneQuality, 'static'>;
  isVisible: boolean;
}) {
  const preset = scenePresets[variant];
  const camera = useThree((state) => state.camera);
  const particleCount = quality === 'low' ? Math.min(preset.particleCount, 10) : preset.particleCount;

  useEffect(() => {
    camera.position.set(0, 0, preset.cameraZ);
    camera.updateProjectionMatrix();
  }, [camera, preset.cameraZ]);

  return (
    <>
      <color attach="background" args={[preset.bgColor]} />
      <fog attach="fog" args={[preset.fogColor, preset.fogNear, preset.fogFar]} />
      <RenderTicker active={isVisible} fps={quality === 'low' ? 15 : 24} />

      <ambientLight intensity={preset.lightIntensity} />
      <directionalLight position={[10, 10, 5]} color={preset.lightColor} intensity={0.5} />

      <mesh position={[0, -2, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={preset.bgColor} />
      </mesh>

      <mesh position={[-15, -2, -15]}>
        <sphereGeometry args={[8, 20, 10]} />
        <meshStandardMaterial color={variant === 'landing-dusk' ? '#263128' : '#323E34'} />
      </mesh>
      <mesh position={[18, -3, -18]}>
        <sphereGeometry args={[10, 20, 10]} />
        <meshStandardMaterial color={variant === 'landing-dusk' ? '#596A55' : '#323E34'} />
      </mesh>

      <Particles count={particleCount} color={preset.lightColor} />
    </>
  );
}

export function SanctuaryCanvas({ variant, fallbackSrc, className = '' }: SanctuaryCanvasProps) {
  const [quality, setQuality] = useState<SceneQuality>('static');
  const [isVisible, setIsVisible] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const preset = scenePresets[variant];

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setQuality(getDeviceQualityPolicy());
    };
    const idleCallback = (window as Window & { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;
    const idle = idleCallback
      ? window.setTimeout(() => idleCallback(enable), 250)
      : window.setTimeout(enable, 650);

    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      window.clearTimeout(idle);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const fallbackNode = fallbackSrc ? (
    <Image src={fallbackSrc} alt="" fill priority className="object-cover opacity-80" />
  ) : (
    <div className="h-full w-full" style={{ backgroundColor: preset.bgColor }} />
  );

  if (quality === 'static') {
    return <div className={`absolute inset-0 z-0 ${className}`}>{fallbackNode}</div>;
  }

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <div className="absolute inset-0">{fallbackNode}</div>
      <ErrorBoundary fallback={fallbackNode}>
        <Canvas
          frameloop="demand"
          dpr={1}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: quality === 'low' ? 'low-power' : 'high-performance',
          }}
          camera={{ fov: 40, near: 0.1, far: 80, position: [0, 0, preset.cameraZ] }}
          style={{ opacity: canvasReady ? 1 : 0, transition: 'opacity 180ms ease-out' }}
          onCreated={() => setCanvasReady(true)}
        >
          <Suspense fallback={null}>
            <SceneContent variant={variant} quality={quality} isVisible={isVisible} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
