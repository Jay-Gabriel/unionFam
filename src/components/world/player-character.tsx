'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_RADIUS, sphericalToCartesian } from './spherical-math';

export interface PlayerControlsHandle {
  getPosition: () => THREE.Vector3;
  getSpherical: () => { theta: number; phi: number };
  triggerEmote: (emoji: string) => void;
  setVirtualInput: (input: { x: number; y: number; jump: boolean; sprint: boolean }) => void;
}

interface PlayerCharacterProps {
  initialTheta?: number;
  initialPhi?: number;
  onPositionChange?: (pos: THREE.Vector3, theta: number, phi: number) => void;
  onEmoteTrigger?: (emoji: string) => void;
}

/** 3D Animated Fox Courier Model */
function FoxAvatar({ isMoving, isSprinting }: { isMoving: boolean; isSprinting: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/fox.glb');
  const clone = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, group);

  useEffect(() => {
    const animName = isMoving ? (isSprinting ? 'Run' : 'Walk') : 'Survey';
    const action = actions[animName];
    if (action) {
      action.reset().fadeIn(0.2).play();
    }
    return () => {
      action?.fadeOut(0.2);
    };
  }, [isMoving, isSprinting, actions]);

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Ground Contact Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#0b1726" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* 3D Animated Fox Model */}
      <primitive object={clone} scale={0.015} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Cute Courier Accessories */}
      {/* Teal Postman Beret */}
      <group position={[0, 0.7, 0.22]} rotation={[-0.2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.07, 12]} />
          <meshStandardMaterial color="#0d9488" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.02, 0.12]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.18, 0.02, 0.09]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>
        <mesh position={[0, 0.02, 0.15]}>
          <boxGeometry args={[0.04, 0.03, 0.01]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Warm Cozy Red Scarf */}
      <group position={[0, 0.46, 0.14]}>
        <mesh castShadow>
          <torusGeometry args={[0.16, 0.05, 8, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
      </group>

      {/* Leather Courier Mailbag */}
      <group position={[0.2, 0.35, 0.04]} rotation={[0.1, -0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.14, 0.08]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[-0.02, 0.05, 0.02]} rotation={[0.1, 0, 0.15]}>
          <boxGeometry args={[0.07, 0.07, 0.01]} />
          <meshStandardMaterial color="#fffbeb" emissive="#fef08a" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload('/models/fox.glb');

export const PlayerCharacter = forwardRef<PlayerControlsHandle, PlayerCharacterProps>(
  function PlayerCharacter(
    {
      initialTheta = Math.PI / 2.8 + 0.1,
      initialPhi = 0.05,
      onPositionChange,
      onEmoteTrigger,
    },
    ref
  ) {
    const { camera } = useThree();

    // Player 3D group refs
    const playerGroupRef = useRef<THREE.Group>(null);

    // Camera orbit & distance state
    const cameraOrbitYawRef = useRef(0);
    const cameraOrbitPitchRef = useRef(0.35);
    const cameraDistanceRef = useRef(7.5);
    const isDraggingMouseRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    // State for animation
    const [movingState, setMovingState] = useState({ isMoving: false, isSprinting: false });
    const lastMovingRef = useRef(false);
    const lastSprintingRef = useRef(false);

    // Coordinate, Physics & Rotation state
    const thetaRef = useRef(initialTheta);
    const phiRef = useRef(initialPhi);
    const heightOffsetRef = useRef(0);
    const verticalVelocityRef = useRef(0);
    const isGroundedRef = useRef(true);
    const currentEmoteRef = useRef<string | null>(null);
    const emoteTimerRef = useRef<number | null>(null);
    const currentQuatRef = useRef(new THREE.Quaternion());
    const lastMoveVecRef = useRef(new THREE.Vector3(0, 0, 1));

    // Keyboard & Virtual Inputs
    const inputRef = useRef({
      forward: 0,
      turn: 0,
      jump: false,
      sprint: false,
    });

    const virtualInputRef = useRef({
      x: 0,
      y: 0,
      jump: false,
      sprint: false,
    });

    // Keyboard & Mouse Drag event listeners
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') inputRef.current.forward = 1;
        if (key === 's' || key === 'arrowdown') inputRef.current.forward = -1;
        if (key === 'a' || key === 'arrowleft') inputRef.current.turn = -1; // Left
        if (key === 'd' || key === 'arrowright') inputRef.current.turn = 1;  // Right
        if (key === ' ' || key === 'spacebar') inputRef.current.jump = true;
        if (key === 'shift') inputRef.current.sprint = true;
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown') {
          inputRef.current.forward = 0;
        }
        if (key === 'a' || key === 'arrowleft' || key === 'd' || key === 'arrowright') {
          inputRef.current.turn = 0;
        }
        if (key === ' ' || key === 'spacebar') inputRef.current.jump = false;
        if (key === 'shift') inputRef.current.sprint = false;
      };

      const handlePointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a') || target.closest('[data-interactive="true"]'))) {
          return;
        }
        isDraggingMouseRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingMouseRef.current) return;
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        cameraOrbitYawRef.current -= dx * 0.006;
        cameraOrbitPitchRef.current = Math.max(
          -0.05,
          Math.min(1.15, cameraOrbitPitchRef.current + dy * 0.005)
        );
      };

      const handlePointerUp = () => {
        isDraggingMouseRef.current = false;
      };

      const handleWheel = (e: WheelEvent) => {
        cameraDistanceRef.current = Math.max(
          4.0,
          Math.min(15.0, cameraDistanceRef.current + e.deltaY * 0.008)
        );
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      window.addEventListener('wheel', handleWheel, { passive: true });

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        window.removeEventListener('wheel', handleWheel);
      };
    }, []);

    // Expose handle methods to parent
    useImperativeHandle(ref, () => ({
      getPosition: () => {
        if (!playerGroupRef.current) return new THREE.Vector3();
        return playerGroupRef.current.position.clone();
      },
      getSpherical: () => ({
        theta: thetaRef.current,
        phi: phiRef.current,
      }),
      triggerEmote: (emoji: string) => {
        currentEmoteRef.current = emoji;
        onEmoteTrigger?.(emoji);
        if (emoteTimerRef.current) window.clearTimeout(emoteTimerRef.current);
        emoteTimerRef.current = window.setTimeout(() => {
          currentEmoteRef.current = null;
        }, 3000);
      },
      setVirtualInput: (vInput) => {
        virtualInputRef.current = vInput;
      },
    }));

    // Main animation & movement tick
    useFrame((_, delta) => {
      if (!playerGroupRef.current) return;

      // Current position vector & surface normal
      const currentRadius = PLANET_RADIUS + heightOffsetRef.current;
      const rawPos = sphericalToCartesian(currentRadius, thetaRef.current, phiRef.current);
      const pos = new THREE.Vector3(...rawPos);
      const normal = pos.clone().normalize();

      // Tangent frame on sphere
      const sinTheta = Math.sin(thetaRef.current);
      const cosTheta = Math.cos(thetaRef.current);
      const sinPhi = Math.sin(phiRef.current);
      const cosPhi = Math.cos(phiRef.current);

      const northVec = new THREE.Vector3(-cosTheta * cosPhi, sinTheta, -cosTheta * sinPhi).normalize();
      const eastVec = new THREE.Vector3(-sinPhi, 0, cosPhi).normalize();

      // Camera Horizontal Forward & Right vectors in Tangent Space
      const yaw = cameraOrbitYawRef.current;
      const pitch = cameraOrbitPitchRef.current;
      const dist = cameraDistanceRef.current;

      const camForward = northVec.clone().multiplyScalar(Math.cos(yaw)).add(eastVec.clone().multiplyScalar(Math.sin(yaw))).normalize();
      const camRight = eastVec.clone().multiplyScalar(Math.cos(yaw)).sub(northVec.clone().multiplyScalar(Math.sin(yaw))).normalize();

      // Inputs
      const fwd = inputRef.current.forward || -virtualInputRef.current.y;
      const right = inputRef.current.turn || virtualInputRef.current.x;
      const jmp = inputRef.current.jump || virtualInputRef.current.jump;
      const spr = inputRef.current.sprint || virtualInputRef.current.sprint;

      const inputLen = Math.hypot(fwd, right);
      const isMoving = inputLen > 0.08;
      const speed = (spr ? 5.5 : 3.5) * delta;

      if (isMoving !== lastMovingRef.current || spr !== lastSprintingRef.current) {
        lastMovingRef.current = isMoving;
        lastSprintingRef.current = spr;
        setMovingState({ isMoving, isSprinting: spr });
      }

      // Calculate desired movement vector in tangent plane
      let moveVec = new THREE.Vector3();
      if (isMoving) {
        moveVec = camForward.clone().multiplyScalar(fwd).add(camRight.clone().multiplyScalar(right)).normalize();
        lastMoveVecRef.current.copy(moveVec);

        const dNorth = moveVec.dot(northVec);
        const dEast = moveVec.dot(eastVec);

        const moveDist = Math.min(1, inputLen) * speed;
        const dTheta = -(moveDist / PLANET_RADIUS) * dNorth;
        const dPhi = (moveDist / (PLANET_RADIUS * Math.max(0.15, Math.sin(thetaRef.current)))) * dEast;

        thetaRef.current = Math.max(0.12, Math.min(Math.PI - 0.12, thetaRef.current + dTheta));
        phiRef.current = (phiRef.current + dPhi + Math.PI * 2) % (Math.PI * 2);
      } else {
        moveVec.copy(lastMoveVecRef.current);
      }

      // Jump & Gravity physics
      if (jmp && isGroundedRef.current) {
        verticalVelocityRef.current = 6.5;
        isGroundedRef.current = false;
      }

      if (!isGroundedRef.current) {
        heightOffsetRef.current += verticalVelocityRef.current * delta;
        verticalVelocityRef.current -= 17.0 * delta;

        if (heightOffsetRef.current <= 0) {
          heightOffsetRef.current = 0;
          verticalVelocityRef.current = 0;
          isGroundedRef.current = true;
        }
      }

      // Recompute position after displacement
      const updatedPos = new THREE.Vector3(...sphericalToCartesian(PLANET_RADIUS + heightOffsetRef.current, thetaRef.current, phiRef.current));
      const updatedNormal = updatedPos.clone().normalize();

      // Orient character to face moveVec on tangent plane
      const faceDir = moveVec.clone().projectOnPlane(updatedNormal).normalize();
      if (faceDir.lengthSq() > 0.01) {
        const sideDir = updatedNormal.clone().cross(faceDir).normalize();
        const rotMatrix = new THREE.Matrix4().makeBasis(sideDir, updatedNormal, faceDir.clone().negate());
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
        currentQuatRef.current.slerp(targetQuat, Math.min(1, 14 * delta));
      }

      playerGroupRef.current.position.copy(updatedPos);
      playerGroupRef.current.quaternion.copy(currentQuatRef.current);

      // Notify parent of updated position
      onPositionChange?.(pos, thetaRef.current, phiRef.current);

      // Smooth Orbit Camera following player and mouse orbit angles
      const camHorizDir = northVec.clone().multiplyScalar(Math.cos(yaw)).add(eastVec.clone().multiplyScalar(Math.sin(yaw))).normalize();

      const camPos = pos
        .clone()
        .add(normal.clone().multiplyScalar(Math.sin(pitch) * dist + 1.6))
        .sub(camHorizDir.clone().multiplyScalar(Math.cos(pitch) * dist));

      const targetLookAt = pos.clone().add(normal.clone().multiplyScalar(1.2));

      camera.position.lerp(camPos, 0.1);
      camera.up.copy(normal);
      camera.lookAt(targetLookAt);
    });

    return (
      <group ref={playerGroupRef}>
        {/* 3D Animated Fox Courier Avatar */}
        <FoxAvatar isMoving={movingState.isMoving} isSprinting={movingState.isSprinting} />

        {/* Emote Bubble Overlay floating above head */}
        {currentEmoteRef.current && (
          <Html position={[0, 1.8, 0]} center distanceFactor={15}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 p-1 text-2xl shadow-xl border border-calm-lichen/60 animate-bounce">
              {currentEmoteRef.current}
            </div>
          </Html>
        )}
      </group>
    );
  }
);
