'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_RADIUS, cartesianToSpherical, sphericalToCartesian } from './spherical-math';

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

    // Player 3D group and submesh refs
    const playerGroupRef = useRef<THREE.Group>(null);
    const bodyMeshRef = useRef<THREE.Group>(null);
    const bagRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);

    // Coordinate & Physics state
    const thetaRef = useRef(initialTheta);
    const phiRef = useRef(initialPhi);
    const heightOffsetRef = useRef(0);
    const verticalVelocityRef = useRef(0);
    const headingAngleRef = useRef(0);
    const isGroundedRef = useRef(true);
    const currentEmoteRef = useRef<string | null>(null);
    const emoteTimerRef = useRef<number | null>(null);

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

    // Keyboard event listeners
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') inputRef.current.forward = 1;
        if (key === 's' || key === 'arrowdown') inputRef.current.forward = -1;
        if (key === 'a' || key === 'arrowleft') inputRef.current.turn = -1;
        if (key === 'd' || key === 'arrowright') inputRef.current.turn = 1;
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

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
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

      // Combine keyboard and virtual joystick inputs
      const fwd = inputRef.current.forward || -virtualInputRef.current.y;
      const trn = inputRef.current.turn || virtualInputRef.current.x;
      const jmp = inputRef.current.jump || virtualInputRef.current.jump;
      const spr = inputRef.current.sprint || virtualInputRef.current.sprint;

      const isMoving = Math.abs(fwd) > 0.05 || Math.abs(trn) > 0.05;
      const speed = (spr ? 4.5 : 2.8) * delta;

      // Update heading angle
      if (Math.abs(trn) > 0.05) {
        headingAngleRef.current += trn * 3.0 * delta;
      }

      // Move on sphere surface in heading direction
      if (Math.abs(fwd) > 0.05) {
        const moveDist = fwd * speed;
        const dTheta = (moveDist / PLANET_RADIUS) * Math.cos(headingAngleRef.current);
        const dPhi = (moveDist / (PLANET_RADIUS * Math.sin(Math.max(0.1, thetaRef.current)))) * Math.sin(headingAngleRef.current);

        thetaRef.current = Math.max(0.1, Math.min(Math.PI - 0.1, thetaRef.current + dTheta));
        phiRef.current = (phiRef.current + dPhi) % (Math.PI * 2);
      }

      // Jump & Gravity physics
      if (jmp && isGroundedRef.current) {
        verticalVelocityRef.current = 6.0;
        isGroundedRef.current = false;
      }

      if (!isGroundedRef.current) {
        heightOffsetRef.current += verticalVelocityRef.current * delta;
        verticalVelocityRef.current -= 16.0 * delta; // Gravity

        if (heightOffsetRef.current <= 0) {
          heightOffsetRef.current = 0;
          verticalVelocityRef.current = 0;
          isGroundedRef.current = true;
        }
      }

      // Compute 3D Cartesian position from spherical coordinates
      const currentRadius = PLANET_RADIUS + heightOffsetRef.current;
      const rawPos = sphericalToCartesian(currentRadius, thetaRef.current, phiRef.current);
      const pos = new THREE.Vector3(...rawPos);

      // Orient player upright perpendicular to spherical surface
      const normal = pos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);

      // Apply heading orientation
      const headingQuat = new THREE.Quaternion().setFromAxisAngle(normal, -headingAngleRef.current);
      quat.premultiply(headingQuat);

      playerGroupRef.current.position.copy(pos);
      playerGroupRef.current.quaternion.copy(quat);

      // Procedural walking/running animation
      const animTime = Date.now() * 0.009 * (spr ? 1.6 : 1.0);
      if (isMoving && isGroundedRef.current) {
        const legSwing = Math.sin(animTime) * 0.55;
        if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
        if (bagRef.current) bagRef.current.rotation.z = Math.sin(animTime * 1.5) * 0.2;
        if (bodyMeshRef.current) bodyMeshRef.current.position.y = 0.55 + Math.abs(Math.sin(animTime)) * 0.08;
      } else {
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (bagRef.current) bagRef.current.rotation.z = 0;
        if (bodyMeshRef.current) bodyMeshRef.current.position.y = 0.55 + Math.sin(Date.now() * 0.003) * 0.02; // Idle breathing
      }

      // Notify parent of updated position
      onPositionChange?.(pos, thetaRef.current, phiRef.current);

      // Smooth third-person follow camera
      const cameraOffset = new THREE.Vector3(0, 3.2, 6.2); // Up and Back
      cameraOffset.applyQuaternion(playerGroupRef.current.quaternion);
      const targetCameraPos = pos.clone().add(cameraOffset);

      camera.position.lerp(targetCameraPos, 0.08);
      camera.lookAt(pos.clone().add(normal.clone().multiplyScalar(1.2)));
    });

    return (
      <group ref={playerGroupRef}>
        {/* Messenger Character Model */}
        <group ref={bodyMeshRef} position={[0, 0.55, 0]}>
          {/* Ground Contact Shadow Disc */}
          <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.45, 16]} />
            <meshBasicMaterial color="#0b1726" transparent opacity={0.35} depthWrite={false} />
          </mesh>

          {/* Main Poncho / Coat Body */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.42, 6, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>

          {/* Head */}
          <mesh position={[0, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.4} />
          </mesh>

          {/* Cute Face: Eyes */}
          <group position={[0, 0.72, 0.23]}>
            {/* Left Eye */}
            <mesh position={[-0.08, 0.02, 0.02]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            {/* Right Eye */}
            <mesh position={[0.08, 0.02, 0.02]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            {/* Rosy Blush Cheeks */}
            <mesh position={[-0.13, -0.04, 0]}>
              <sphereGeometry args={[0.038, 8, 8]} />
              <meshBasicMaterial color="#fb7185" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0.13, -0.04, 0]}>
              <sphereGeometry args={[0.038, 8, 8]} />
              <meshBasicMaterial color="#fb7185" transparent opacity={0.7} />
            </mesh>
          </group>

          {/* Messenger Cap with Visor & Golden Pin */}
          <group position={[0, 0.9, -0.02]} rotation={[-0.15, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.28, 0.29, 0.14, 12]} />
              <meshStandardMaterial color="#047857" roughness={0.5} />
            </mesh>
            {/* Visor */}
            <mesh position={[0, -0.04, 0.22]} rotation={[0.25, 0, 0]}>
              <boxGeometry args={[0.3, 0.04, 0.16]} />
              <meshStandardMaterial color="#065f46" roughness={0.4} />
            </mesh>
            {/* Golden Star/Badge on Cap */}
            <mesh position={[0, 0.04, 0.29]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} emissive="#f59e0b" emissiveIntensity={0.5} />
            </mesh>
          </group>

          {/* Warm Flowing Scarf & Dynamic Tail */}
          <group position={[0, 0.52, 0]}>
            <mesh>
              <torusGeometry args={[0.22, 0.07, 8, 16]} />
              <meshStandardMaterial color="#dc2626" roughness={0.7} />
            </mesh>
            {/* Scarf tail floating back with wind */}
            <mesh position={[0.12, -0.12, -0.2]} rotation={[0.4, 0.2, 0.1]}>
              <boxGeometry args={[0.1, 0.26, 0.04]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.7} />
            </mesh>
          </group>

          {/* Crossbody Mailbag & Diagonal Strap */}
          <group ref={bagRef} position={[0.26, 0.16, 0.12]} rotation={[0.1, -0.25, -0.15]}>
            <mesh castShadow>
              <boxGeometry args={[0.24, 0.22, 0.12]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            {/* Bag Flap & Brass Buckle */}
            <mesh position={[0, 0.02, 0.065]}>
              <boxGeometry args={[0.22, 0.12, 0.02]} />
              <meshStandardMaterial color="#92400e" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.02, 0.078]}>
              <boxGeometry args={[0.05, 0.05, 0.02]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
          {/* Leather Bag Strap across chest */}
          <mesh position={[-0.02, 0.25, 0.02]} rotation={[0.2, 0, 0.75]}>
            <boxGeometry args={[0.06, 0.62, 0.03]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          {/* Cute Little Hands/Mittens */}
          <mesh position={[-0.32, 0.2, 0.08]} castShadow>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.5} />
          </mesh>
          <mesh position={[0.32, 0.2, 0.08]} castShadow>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.5} />
          </mesh>

          {/* Left Leg & Leather Boot */}
          <group ref={leftLegRef} position={[-0.14, -0.22, 0]}>
            <mesh position={[0, 0.05, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.2, 4, 6]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, -0.12, 0.04]} castShadow>
              <boxGeometry args={[0.11, 0.14, 0.18]} />
              <meshStandardMaterial color="#5c3010" roughness={0.7} />
            </mesh>
          </group>

          {/* Right Leg & Leather Boot */}
          <group ref={rightLegRef} position={[0.14, -0.22, 0]}>
            <mesh position={[0, 0.05, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.2, 4, 6]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, -0.12, 0.04]} castShadow>
              <boxGeometry args={[0.11, 0.14, 0.18]} />
              <meshStandardMaterial color="#5c3010" roughness={0.7} />
            </mesh>
          </group>
        </group>

        {/* Emote Bubble Overlay floating above head */}
        {currentEmoteRef.current && (
          <Html position={[0, 2.0, 0]} center distanceFactor={15}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 p-1 text-2xl shadow-xl border border-calm-lichen/60 animate-bounce">
              {currentEmoteRef.current}
            </div>
          </Html>
        )}
      </group>
    );
  }
);
