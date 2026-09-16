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
    const tailRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);

    // Camera orbit & distance state
    const cameraOrbitYawRef = useRef(0); // Horizontal orbit angle (radians)
    const cameraOrbitPitchRef = useRef(0.35); // Vertical pitch angle (radians)
    const cameraDistanceRef = useRef(7.5); // Distance from player
    const isDraggingMouseRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

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

        // Mouse drag rotates camera orbit (yaw and pitch)
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

      // Tangent frame on sphere: North vector (along -theta) and East vector (along +phi)
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

      // Combine keyboard and virtual joystick inputs
      const fwd = inputRef.current.forward || -virtualInputRef.current.y;
      const right = inputRef.current.turn || virtualInputRef.current.x;
      const jmp = inputRef.current.jump || virtualInputRef.current.jump;
      const spr = inputRef.current.sprint || virtualInputRef.current.sprint;

      const inputLen = Math.hypot(fwd, right);
      const isMoving = inputLen > 0.08;
      const speed = (spr ? 5.5 : 3.5) * delta;

      // Calculate desired movement vector in tangent plane
      let moveVec = new THREE.Vector3();
      if (isMoving) {
        moveVec = camForward.clone().multiplyScalar(fwd).add(camRight.clone().multiplyScalar(right)).normalize();
        lastMoveVecRef.current.copy(moveVec);

        // Project displacement onto North and East
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
        verticalVelocityRef.current -= 17.0 * delta; // Gravity

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

      // Procedural walking/running animation
      const animTime = Date.now() * 0.009 * (spr ? 1.6 : 1.0);
      if (isMoving && isGroundedRef.current) {
        const legSwing = Math.sin(animTime) * 0.55;
        const armSwing = Math.sin(animTime) * 0.45;
        if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
        if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
        if (bagRef.current) bagRef.current.rotation.z = Math.sin(animTime * 1.5) * 0.2;
        if (tailRef.current) {
          tailRef.current.rotation.y = Math.sin(animTime * 1.6) * 0.45;
          tailRef.current.rotation.z = 0.2 + Math.cos(animTime * 1.2) * 0.15;
        }
        if (bodyMeshRef.current) bodyMeshRef.current.position.y = 0.55 + Math.abs(Math.sin(animTime)) * 0.08;
      } else {
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
        if (bagRef.current) bagRef.current.rotation.z = 0;
        if (tailRef.current) {
          tailRef.current.rotation.y = Math.sin(Date.now() * 0.003) * 0.2;
          tailRef.current.rotation.z = 0.15;
        }
        if (bodyMeshRef.current) bodyMeshRef.current.position.y = 0.55 + Math.sin(Date.now() * 0.003) * 0.02; // Idle breathing
      }

      // Notify parent of updated position
      onPositionChange?.(pos, thetaRef.current, phiRef.current);

      // Smooth Orbit Camera following player and mouse orbit angles
      // Camera horizontal offset direction in tangent plane
      const camHorizDir = northVec.clone().multiplyScalar(Math.cos(yaw)).add(eastVec.clone().multiplyScalar(Math.sin(yaw))).normalize();

      // Camera position: behind the view direction, and elevated by pitch
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
        {/* Spirit Fox-Cat Creature Messenger Model */}
        <group ref={bodyMeshRef} position={[0, 0.55, 0]}>
          {/* Ground Contact Shadow Disc */}
          <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.48, 16]} />
            <meshBasicMaterial color="#0b1726" transparent opacity={0.4} depthWrite={false} />
          </mesh>

          {/* Cute Round Animal Body (Cream Fur) */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.6} />
          </mesh>
          {/* White Fur Belly Patch */}
          <mesh position={[0, 0.2, 0.16]} rotation={[0.2, 0, 0]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>

          {/* Cute Spirit Animal Head */}
          <group position={[0, 0.68, 0]}>
            {/* Head Base Sphere */}
            <mesh castShadow>
              <sphereGeometry args={[0.32, 16, 16]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.5} />
            </mesh>
            {/* Left Cheek Fur Tuft */}
            <mesh position={[-0.3, -0.06, 0.05]} rotation={[0, 0, 0.6]}>
              <coneGeometry args={[0.12, 0.22, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
            {/* Right Cheek Fur Tuft */}
            <mesh position={[0.3, -0.06, 0.05]} rotation={[0, 0, -0.6]}>
              <coneGeometry args={[0.12, 0.22, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>

            {/* Pointy Fluffy Left Ear */}
            <group position={[-0.2, 0.32, -0.02]} rotation={[-0.1, 0, 0.35]}>
              {/* Outer Ear */}
              <mesh castShadow>
                <coneGeometry args={[0.13, 0.34, 6]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.5} />
              </mesh>
              {/* Inner Pink Ear */}
              <mesh position={[0, -0.02, 0.04]} rotation={[0.15, 0, 0]}>
                <coneGeometry args={[0.08, 0.24, 4]} />
                <meshStandardMaterial color="#f472b6" roughness={0.6} />
              </mesh>
            </group>

            {/* Pointy Fluffy Right Ear */}
            <group position={[0.2, 0.32, -0.02]} rotation={[-0.1, 0, -0.35]}>
              {/* Outer Ear */}
              <mesh castShadow>
                <coneGeometry args={[0.13, 0.34, 6]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.5} />
              </mesh>
              {/* Inner Pink Ear */}
              <mesh position={[0, -0.02, 0.04]} rotation={[0.15, 0, 0]}>
                <coneGeometry args={[0.08, 0.24, 4]} />
                <meshStandardMaterial color="#f472b6" roughness={0.6} />
              </mesh>
            </group>

            {/* Big Expressive Anime Eyes with Golden Iris */}
            <group position={[0, 0.02, 0.28]}>
              {/* Left Eye */}
              <group position={[-0.11, 0, 0]}>
                <mesh>
                  <sphereGeometry args={[0.052, 12, 12]} />
                  <meshStandardMaterial color="#d97706" emissive="#f59e0b" emissiveIntensity={0.4} />
                </mesh>
                {/* Pupil */}
                <mesh position={[0, 0, 0.035]}>
                  <sphereGeometry args={[0.032, 8, 8]} />
                  <meshBasicMaterial color="#0f172a" />
                </mesh>
                {/* Highlight Sparkle */}
                <mesh position={[-0.015, 0.018, 0.046]}>
                  <sphereGeometry args={[0.014, 6, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>

              {/* Right Eye */}
              <group position={[0.11, 0, 0]}>
                <mesh>
                  <sphereGeometry args={[0.052, 12, 12]} />
                  <meshStandardMaterial color="#d97706" emissive="#f59e0b" emissiveIntensity={0.4} />
                </mesh>
                {/* Pupil */}
                <mesh position={[0, 0, 0.035]}>
                  <sphereGeometry args={[0.032, 8, 8]} />
                  <meshBasicMaterial color="#0f172a" />
                </mesh>
                {/* Highlight Sparkle */}
                <mesh position={[-0.015, 0.018, 0.046]}>
                  <sphereGeometry args={[0.014, 6, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>

              {/* Rosy Blush Cheeks */}
              <mesh position={[-0.17, -0.08, -0.04]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
              </mesh>
              <mesh position={[0.17, -0.08, -0.04]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
              </mesh>

              {/* Cute Little Dark Nose */}
              <mesh position={[0, -0.05, 0.04]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#1e293b" />
              </mesh>
            </group>

            {/* Teal Messenger Cap perched between ears */}
            <group position={[0, 0.28, -0.04]} rotation={[-0.12, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.22, 0.24, 0.12, 14]} />
                <meshStandardMaterial color="#0d9488" roughness={0.4} />
              </mesh>
              {/* Visor */}
              <mesh position={[0, -0.04, 0.18]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.24, 0.03, 0.14]} />
                <meshStandardMaterial color="#0f766e" roughness={0.3} />
              </mesh>
              {/* Gold Wing Badge on Cap */}
              <mesh position={[0, 0.02, 0.23]}>
                <boxGeometry args={[0.07, 0.04, 0.02]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} emissive="#f59e0b" emissiveIntensity={0.6} />
              </mesh>
            </group>
          </group>

          {/* Chunky Warm Red Knitted Scarf */}
          <group position={[0, 0.46, 0]}>
            <mesh castShadow>
              <torusGeometry args={[0.26, 0.085, 10, 18]} />
              <meshStandardMaterial color="#e11d48" roughness={0.7} />
            </mesh>
            {/* Scarf Tail waving back with motion */}
            <mesh position={[0.16, -0.14, -0.22]} rotation={[0.45, 0.2, 0.1]}>
              <boxGeometry args={[0.11, 0.28, 0.04]} />
              <meshStandardMaterial color="#be123c" roughness={0.7} />
            </mesh>
          </group>

          {/* Big Fluffy Bushy Fox Tail with Wagging Physics */}
          <group ref={tailRef} position={[0, 0.12, -0.24]} rotation={[0.2, 0, 0]}>
            {/* Base Tail Segment */}
            <mesh castShadow position={[0, 0.12, -0.1]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.6} />
            </mesh>
            {/* Mid Plump Tail Segment */}
            <mesh castShadow position={[0, 0.28, -0.18]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.6} />
            </mesh>
            {/* Glowing Golden White Tail Tip */}
            <mesh castShadow position={[0, 0.46, -0.14]} rotation={[-0.3, 0, 0]}>
              <coneGeometry args={[0.16, 0.28, 10]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.3} roughness={0.5} />
            </mesh>
          </group>

          {/* Crossbody Postman Bag with Glowing Letter */}
          <group ref={bagRef} position={[0.28, 0.14, 0.1]} rotation={[0.1, -0.25, -0.15]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.22, 0.13]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            {/* Bag Flap & Brass Buckle */}
            <mesh position={[0, 0.02, 0.07]}>
              <boxGeometry args={[0.24, 0.12, 0.02]} />
              <meshStandardMaterial color="#92400e" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.02, 0.082]}>
              <boxGeometry args={[0.06, 0.06, 0.02]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Glowing Golden Letter peeking out */}
            <mesh position={[-0.04, 0.1, 0.02]} rotation={[0.1, 0, 0.15]}>
              <boxGeometry args={[0.12, 0.1, 0.02]} />
              <meshStandardMaterial color="#fffbeb" emissive="#fef08a" emissiveIntensity={0.5} />
            </mesh>
          </group>
          {/* Leather Bag Strap across chest */}
          <mesh position={[-0.02, 0.25, 0.02]} rotation={[0.2, 0, 0.75]}>
            <boxGeometry args={[0.06, 0.65, 0.03]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          {/* Cute Little Animal Front Paws */}
          <group ref={leftArmRef} position={[-0.26, 0.18, 0.06]}>
            <mesh castShadow>
              <sphereGeometry args={[0.085, 10, 10]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.6} />
            </mesh>
          </group>
          <group ref={rightArmRef} position={[0.26, 0.18, 0.06]}>
            <mesh castShadow>
              <sphereGeometry args={[0.085, 10, 10]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.6} />
            </mesh>
          </group>

          {/* Left Back Paw & Leg */}
          <group ref={leftLegRef} position={[-0.14, -0.18, 0]}>
            <mesh position={[0, 0.04, 0]} castShadow>
              <capsuleGeometry args={[0.08, 0.18, 4, 6]} />
              <meshStandardMaterial color="#fffbeb" />
            </mesh>
            <mesh position={[0, -0.1, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.12, 0.16]} />
              <meshStandardMaterial color="#fef08a" roughness={0.6} />
            </mesh>
          </group>

          {/* Right Back Paw & Leg */}
          <group ref={rightLegRef} position={[0.14, -0.18, 0]}>
            <mesh position={[0, 0.04, 0]} castShadow>
              <capsuleGeometry args={[0.08, 0.18, 4, 6]} />
              <meshStandardMaterial color="#fffbeb" />
            </mesh>
            <mesh position={[0, -0.1, 0.04]} castShadow>
              <boxGeometry args={[0.12, 0.12, 0.16]} />
              <meshStandardMaterial color="#fef08a" roughness={0.6} />
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
