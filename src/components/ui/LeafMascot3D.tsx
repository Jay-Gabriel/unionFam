import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LeafMascotSvg3D } from './LeafMascotSvg3D';

export type LeafMascotMood =
  | 'welcoming'
  | 'caring'
  | 'listening'
  | 'thinking'
  | 'celebrating'
  | 'safety';

interface LeafMascot3DProps {
  mood?: LeafMascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  whisper?: string;
  interactive?: boolean;
  onClick?: () => void;
  auraIntensity?: number; // 1 to 10
  useWebGL?: boolean;
  className?: string;
}

const MOOD_ALT_MAP: Record<LeafMascotMood, string> = {
  welcoming: 'Linh vật Chiếc Lá 3D UnionFam chào đón bạn',
  celebrating: 'Chiếc Lá 3D UnionFam vui mừng cùng bạn làm rõ thêm một điều quan trọng',
  caring: 'Chiếc Lá 3D UnionFam nâng niu và chăm sóc cảm xúc của bạn',
  safety: 'Chiếc Lá 3D UnionFam đang bảo vệ và giữ an toàn cho bạn',
  listening: 'Chiếc Lá 3D UnionFam đang lắng nghe bạn một cách dịu dàng',
  thinking: 'Chiếc Lá 3D UnionFam đang suy ngẫm cùng câu chuyện của bạn',
};

const SIZE_CLASSES: Record<NonNullable<LeafMascot3DProps['size']>, string> = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32 md:w-36 md:h-36',
  xl: 'w-44 h-44 md:w-56 md:h-56',
};

function createPlumpLeafShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.02);
  shape.bezierCurveTo(0.86, -1.04, 1.24, -0.35, 1.06, 0.35);
  shape.bezierCurveTo(0.92, 0.92, 0.38, 1.24, 0, 1.28);
  shape.bezierCurveTo(-0.38, 1.24, -0.92, 0.92, -1.06, 0.35);
  shape.bezierCurveTo(-1.24, -0.35, -0.86, -1.04, 0, -1.02);
  return shape;
}

const clampRange = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

/**
 * Linh vật Chiếc Lá 3D sống động trên cả desktop lẫn mobile:
 * - Xoay chiều sâu liên tục (trục Y/X/Z + ánh sáng lướt) không đứng yên.
 * - Hỗ trợ kéo ngón tay xoay 3D, chạm nhanh xoay vòng vui vẻ & nảy nhẹ, nghiêng theo cảm biến điện thoại.
 */
export const LeafMascot3D: React.FC<LeafMascot3DProps> = ({
  mood = 'welcoming',
  size = 'md',
  whisper,
  interactive = false,
  onClick,
  auraIntensity = 6,
  useWebGL,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<LeafMascotMood>(mood);
  const pointerRef = useRef({ x: 0, y: 0 });
  const gyroRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const tapSpinRef = useRef(0);
  const bounceRef = useRef(0);
  const [webglFailed, setWebglFailed] = useState(false);

  moodRef.current = mood;

  const isTestEnv = import.meta.env.MODE === 'test';
  const shouldEnableWebGL =
    !isTestEnv && !webglFailed && (useWebGL ?? (size === 'lg' || size === 'xl'));

  useEffect(() => {
    if (!shouldEnableWebGL || !mountRef.current) return;
    const container = mountRef.current;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || 220;
    const height = container.clientHeight || 220;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0, 0.1, 5.05);

    const hemiLight = new THREE.HemisphereLight(0xfff9ea, 0x254b3d, 1.4);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6e0, 2.25);
    keyLight.position.set(2.8, 3.6, 4.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc6d6b4, 1.2);
    rimLight.position.set(-3.2, 1.5, -2.6);
    scene.add(rimLight);

    const mascotGroup = new THREE.Group();
    scene.add(mascotGroup);

    const disposables: Array<{ dispose: () => void }> = [];

    const leafGeo = new THREE.ExtrudeGeometry(createPlumpLeafShape(), {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.17,
      bevelSegments: 12,
      curveSegments: 32,
    });
    leafGeo.center();
    disposables.push(leafGeo);

    const leafMat = new THREE.MeshPhysicalMaterial({
      color: 0x5c8b64,
      roughness: 0.34,
      metalness: 0.03,
      clearcoat: 0.52,
      clearcoatRoughness: 0.24,
      sheen: 0.7,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(0xc6d6b4),
    });
    disposables.push(leafMat);

    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    mascotGroup.add(leafMesh);

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.0, 0),
      new THREE.Vector3(-0.04, -1.26, 0.04),
      new THREE.Vector3(-0.18, -1.44, 0.08),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 14, 0.068, 10, false);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x355f43, roughness: 0.5 });
    disposables.push(stemGeo, stemMat);
    mascotGroup.add(new THREE.Mesh(stemGeo, stemMat));

    const veinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.88, 0.27),
      new THREE.Vector3(0, 0.04, 0.31),
      new THREE.Vector3(0, 0.88, 0.26),
    ]);
    const veinGeo = new THREE.TubeGeometry(veinCurve, 16, 0.03, 8, false);
    const veinMat = new THREE.MeshStandardMaterial({ color: 0x95ac8a, roughness: 0.45 });
    disposables.push(veinGeo, veinMat);
    mascotGroup.add(new THREE.Mesh(veinGeo, veinMat));

    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.04, 0.31);
    mascotGroup.add(faceGroup);

    const eyeGeo = new THREE.SphereGeometry(0.118, 20, 20);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0x182d26,
      roughness: 0.1,
      clearcoat: 1.0,
    });
    const catchGeo = new THREE.SphereGeometry(0.038, 10, 10);
    const catchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    disposables.push(eyeGeo, eyeMat, catchGeo, catchMat);

    const makeEye = (x: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0.12, 0);
      const pupil = new THREE.Mesh(eyeGeo, eyeMat);
      pupil.scale.set(1, 1.08, 0.65);
      g.add(pupil);

      const catchlight = new THREE.Mesh(catchGeo, catchMat);
      catchlight.position.set(0.038, 0.042, 0.08);
      g.add(catchlight);
      return g;
    };

    const leftEye = makeEye(-0.32);
    const rightEye = makeEye(0.32);
    faceGroup.add(leftEye, rightEye);

    const cheekGeo = new THREE.SphereGeometry(0.115, 14, 14);
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xe8a598,
      roughness: 0.7,
      transparent: true,
      opacity: 0.72,
    });
    disposables.push(cheekGeo, cheekMat);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.48, -0.08, -0.02);
    leftCheek.scale.set(1.25, 0.72, 0.38);
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.48, -0.08, -0.02);
    rightCheek.scale.set(1.25, 0.72, 0.38);
    faceGroup.add(leftCheek, rightCheek);

    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, -0.08, 0.02),
      new THREE.Vector3(0, -0.15, 0.04),
      new THREE.Vector3(0.14, -0.08, 0.02),
    ]);
    const smileGeo = new THREE.TubeGeometry(smileCurve, 12, 0.026, 8, false);
    const smileMat = new THREE.MeshStandardMaterial({ color: 0x182d26, roughness: 0.35 });
    disposables.push(smileGeo, smileMat);
    faceGroup.add(new THREE.Mesh(smileGeo, smileMat));

    const orbGroup = new THREE.Group();
    orbGroup.position.set(0.92, 0.62, 0.44);
    scene.add(orbGroup);

    const orbGeo = new THREE.SphereGeometry(0.165, 22, 22);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xf7e3a1,
      emissive: 0xeed596,
      emissiveIntensity: 0.85,
      roughness: 0.18,
    });
    disposables.push(orbGeo, orbMat);
    orbGroup.add(new THREE.Mesh(orbGeo, orbMat));

    const orbLight = new THREE.PointLight(0xeed596, 1.4, 3.8);
    orbGroup.add(orbLight);

    const pollenGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const pollenMat = new THREE.MeshBasicMaterial({
      color: 0xeed596,
      transparent: true,
      opacity: 0.8,
    });
    disposables.push(pollenGeo, pollenMat);

    const motes: Array<{ mesh: THREE.Mesh; radius: number; speed: number; offset: number; yAmp: number }> = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(pollenGeo, pollenMat);
      const angle = (i / 10) * Math.PI * 2;
      motes.push({
        mesh: m,
        radius: 1.32 + (i % 3) * 0.22,
        speed: 0.35 + (i % 4) * 0.1,
        offset: angle,
        yAmp: 0.25 + (i % 3) * 0.14,
      });
      scene.add(m);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    }

    const handleOrientation = (ev: DeviceOrientationEvent) => {
      if (ev.gamma == null || ev.beta == null) return;
      gyroRef.current = {
        x: clampRange(ev.gamma / 30, -1, 1),
        y: clampRange((ev.beta - 45) / 30, -1, 1),
      };
    };
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    let animId = 0;
    const clock = new THREE.Clock();
    let elapsed = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const smooth = 1 - Math.exp(-7 * dt);
      const eyeSmooth = 1 - Math.exp(-18 * dt);
      const activeMood = moodRef.current;

      if (!prefersReducedMotion) {
        bounceRef.current *= Math.exp(-7.5 * dt);
        if (bounceRef.current < 0.001) bounceRef.current = 0;

        mascotGroup.position.y = Math.sin(elapsed * 1.55) * 0.085 + bounceRef.current * 0.08;
        const breathe = 1 + Math.sin(elapsed * 1.25) * 0.024 + bounceRef.current * 0.12;
        mascotGroup.scale.set(breathe, breathe, breathe);

        // Gentle orbital sway + drag/pointer + phone gyro + celebratory 360 twirl
        const idleRotY = Math.sin(elapsed * 0.95) * 0.38;
        const idleRotX = Math.sin(elapsed * 0.68 + 0.7) * 0.14;
        const idleRotZ = Math.sin(elapsed * 1.15) * 0.055;

        const targetRotY =
          idleRotY +
          pointerRef.current.x * 0.85 +
          gyroRef.current.x * 0.38 +
          (activeMood === 'listening' ? -0.14 : 0) +
          tapSpinRef.current;
        const targetRotX =
          idleRotX -
          pointerRef.current.y * 0.45 +
          gyroRef.current.y * 0.25 +
          (activeMood === 'thinking' ? -0.08 : activeMood === 'caring' ? 0.08 : 0);
        const targetRotZ =
          activeMood === 'celebrating' ? Math.sin(elapsed * 5) * 0.09 : idleRotZ;

        mascotGroup.rotation.y += (targetRotY - mascotGroup.rotation.y) * smooth;
        mascotGroup.rotation.x += (targetRotX - mascotGroup.rotation.x) * smooth;
        mascotGroup.rotation.z += (targetRotZ - mascotGroup.rotation.z) * smooth;

        keyLight.position.x = 2.6 + Math.sin(elapsed * 0.85) * 1.1;

        const blinkCycle = elapsed % 4.4;
        const eyeScaleY = blinkCycle > 4.24 ? 0.1 : activeMood === 'celebrating' ? 0.42 : 1.08;
        leftEye.scale.y += (eyeScaleY - leftEye.scale.y) * eyeSmooth;
        rightEye.scale.y += (eyeScaleY - rightEye.scale.y) * eyeSmooth;

        const isCaring = activeMood === 'caring' || activeMood === 'safety';
        const targetOrbX = isCaring ? 0.42 : 0.92;
        const targetOrbY = isCaring
          ? -0.35 + Math.sin(elapsed * 2.1) * 0.05
          : 0.62 + Math.sin(elapsed * 1.9) * 0.085;
        const targetOrbZ = isCaring ? 0.68 : 0.36;
        orbGroup.position.x += (targetOrbX - orbGroup.position.x) * smooth;
        orbGroup.position.y += (targetOrbY - orbGroup.position.y) * smooth;
        orbGroup.position.z += (targetOrbZ - orbGroup.position.z) * smooth;
        orbMat.emissiveIntensity =
          activeMood === 'safety' ? 1.3 : activeMood === 'celebrating' ? 1.25 : 0.85;

        motes.forEach((m, idx) => {
          const a = m.offset + elapsed * m.speed * (activeMood === 'celebrating' ? 1.8 : 1);
          m.mesh.position.set(
            Math.cos(a) * m.radius,
            Math.sin(elapsed * 1.1 + idx) * m.yAmp,
            Math.sin(a) * 0.55 - 0.15,
          );
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shouldEnableWebGL]);

  const altText = MOOD_ALT_MAP[mood];
  const isListeningOrThinking = mood === 'listening' || mood === 'thinking';
  const isCelebrating = mood === 'celebrating';
  const isSafety = mood === 'safety';

  const auraBackground = isSafety
    ? 'radial-gradient(circle, rgba(217, 119, 6, 0.32) 0%, rgba(238, 213, 150, 0.14) 55%, transparent 75%)'
    : isCelebrating
      ? 'radial-gradient(circle, rgba(238, 213, 150, 0.55) 0%, rgba(143, 160, 131, 0.25) 55%, transparent 75%)'
      : 'radial-gradient(circle, rgba(198, 214, 180, 0.55) 0%, rgba(238, 213, 150, 0.2) 58%, transparent 76%)';

  const clampedOpacity = Math.min(1, Math.max(0.35, auraIntensity / 10));

  const updatePointerFromClient = (clientX: number, clientY: number, el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerRef.current = {
      x: clampRange(((clientX - rect.left) / rect.width - 0.5) * 2, -1.2, 1.2),
      y: clampRange(((clientY - rect.top) / rect.height - 0.5) * 2, -1.2, 1.2),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    updatePointerFromClient(e.clientX, e.clientY, e.currentTarget);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback in simulated/test environments
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || isDraggingRef.current) {
      updatePointerFromClient(e.clientX, e.clientY, e.currentTarget);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const dt = Date.now() - dragStartRef.current.time;
    const dist = Math.hypot(
      e.clientX - dragStartRef.current.x,
      e.clientY - dragStartRef.current.y,
    );
    if (isDraggingRef.current && dt < 240 && dist < 12) {
      tapSpinRef.current += Math.PI * 2;
      bounceRef.current = 1;
    }
    isDraggingRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }
    } catch {
      // Safe ignore
    }
  };

  const handlePointerLeave = () => {
    if (!isDraggingRef.current) {
      pointerRef.current = { x: 0, y: 0 };
    }
  };

  const content = (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerLeave}
      className={`inline-flex flex-col items-center gap-2 select-none ${
        shouldEnableWebGL ? 'touch-none cursor-grab active:cursor-grabbing' : ''
      } ${className}`}
    >
      <div className={`relative flex items-center justify-center ${SIZE_CLASSES[size]}`}>
        <div
          aria-hidden="true"
          className="absolute inset-1 rounded-full leaf-breathe pointer-events-none"
          style={{
            background: auraBackground,
            opacity: clampedOpacity,
          }}
        />

        {isListeningOrThinking && (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-2 rounded-full border border-[#8FA083]/45 ripple-ring pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute inset-2 rounded-full border border-[#EED596]/55 ripple-ring pointer-events-none"
              style={{ animationDelay: '1.3s' }}
            />
          </>
        )}

        {shouldEnableWebGL ? (
          <div
            ref={mountRef}
            role="img"
            aria-label={altText}
            className="relative z-10 w-full h-full"
          />
        ) : (
          <div className="relative z-10 w-full h-full leaf-float">
            <LeafMascotSvg3D mood={mood} />
          </div>
        )}
      </div>

      {whisper && (
        <div className="fade-slide-up max-w-xs px-3.5 py-2 rounded-2xl bg-white/95 border border-[#BBC7BC] text-xs text-[#254B3D] leading-relaxed text-center shadow-sm">
          {whisper}
        </div>
      )}
    </div>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#254B3D] rounded-3xl p-1 transition hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
        aria-label={altText}
      >
        {content}
      </button>
    );
  }

  return content;
};
