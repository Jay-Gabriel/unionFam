'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { CITY_COLLIDERS, CITY_SIZE, isWorldPointWalkable } from './world-data';
import type { PlayerHandle, VirtualInput } from './world-types';
import type { WorldTransform } from './world-session';

const BASE_Y = 0.62;
const CASUAL_BOY_COLORS: Record<string, string> = {
  skin: '#fed7aa',  // Warm natural peach skin tone for face, arms, neck, hands
  face: '#1e293b',  // Dark cute anime eyes & eyebrows
  shirt: '#f59e0b', // Sunflower yellow hoodie
  pants: '#2563eb', // Classic denim blue jeans
  belt: '#f8fafc',  // Crisp white sneaker accents
  hair: '#451a03',  // Warm chestnut brown hair
};

function ChibiCasualPlayerModel({ moving, sprinting, jumping, victory }: { moving: boolean; sprinting: boolean; jumping: boolean; victory?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/city-hero.gltf');
  const activeAction = useRef<string>('Idle');
  
  const model = useMemo(() => {
    const next = cloneSkeleton(gltf.scene);
    next.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = false;
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const styled = source.map((material) => {
        const name = (material?.name || '').toLowerCase();
        let color = '#ffffff';
        if (name === 'skin') color = CASUAL_BOY_COLORS.skin; // Body & Face skin
        else if (name === 'face') color = CASUAL_BOY_COLORS.face; // Eyes & Eyebrows
        else if (name === 'shirt') color = CASUAL_BOY_COLORS.shirt;
        else if (name === 'pants') color = CASUAL_BOY_COLORS.pants;
        else if (name === 'belt') color = CASUAL_BOY_COLORS.belt;
        else if (name === 'hair') color = CASUAL_BOY_COLORS.hair;
        else {
          const key = Object.keys(CASUAL_BOY_COLORS).find((candidate) => name.includes(candidate));
          if (key) color = CASUAL_BOY_COLORS[key];
        }

        return new THREE.MeshToonMaterial({
          name: material?.name,
          color,
          side: THREE.FrontSide,
        });
      });
      object.material = Array.isArray(object.material) ? styled : styled[0];
    });
    return next;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, group);

  useEffect(() => {
    const nextName = victory
      ? 'Victory'
      : jumping
        ? 'Jump'
        : moving
          ? (sprinting ? 'Run' : 'Walk')
          : 'Idle';

    const prevAction = activeAction.current ? actions[activeAction.current] : null;
    const nextAction = actions[nextName] || actions.Idle;

    if (nextAction && activeAction.current !== nextName) {
      nextAction.reset();
      
      // Speed matching for energetic natural cadence
      if (nextName === 'Walk') nextAction.timeScale = 1.3;
      else if (nextName === 'Run') nextAction.timeScale = 1.4;
      else if (nextName === 'Jump') nextAction.timeScale = 1.1;
      else nextAction.timeScale = 0.95; // Relaxed natural breathing idle

      if (prevAction) {
        nextAction.fadeIn(0.18).play();
        prevAction.fadeOut(0.18);
      } else {
        nextAction.play();
      }

      activeAction.current = nextName;
    }
  }, [actions, jumping, moving, sprinting, victory]);

  return (
    <group ref={group}>
      <primitive object={model} scale={0.88} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload('/models/city-hero.gltf');

function canMoveTo(x: number, z: number) {
  return isWorldPointWalkable(x, z);
}

function lerpAngle(current: number, target: number, amount: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * amount;
}

interface CityPlayerProps {
  onPositionChange?: (position: THREE.Vector3) => void;
  paused?: boolean;
}

export const CityPlayer = forwardRef<PlayerHandle, CityPlayerProps>(function CityPlayer({ onPositionChange, paused = false }, ref) {
  const root = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const position = useRef(new THREE.Vector3(0, BASE_Y, 55));
  const horizontalVelocity = useRef(new THREE.Vector3());
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.38);
  const cameraDistance = useRef(8.5);
  const cameraPointerId = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const rotationY = useRef(Math.PI);
  const cameraTarget = useRef(new THREE.Vector3(0, BASE_Y + 1.45, 55));
  const positionNotifyClock = useRef(0);
  const frameVectors = useRef({
    targetVelocity: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    cameraOffset: new THREE.Vector3(),
    desiredCamera: new THREE.Vector3(),
    desiredTarget: new THREE.Vector3(),
  });
  const keys = useRef({ forward: 0, right: 0, jump: false, sprint: false });
  const virtual = useRef<VirtualInput>({ x: 0, y: 0, jump: false, sprint: false });
  const [motion, setMotion] = useState({ moving: false, sprinting: false, jumping: false });
  const motionRef = useRef(motion);
  const [emote, setEmote] = useState<string | null>(null);
  const emoteTimer = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    setVirtualInput(input) { virtual.current = input; },
    triggerEmote(emoji) {
      setEmote(emoji);
      if (emoteTimer.current) window.clearTimeout(emoteTimer.current);
      emoteTimer.current = window.setTimeout(() => setEmote(null), 2600);
    },
    getSessionTransform() {
      return {
        x: position.current.x,
        z: position.current.z,
        rotationY: rotationY.current,
        cameraYaw: cameraYaw.current,
        cameraPitch: cameraPitch.current,
        cameraDistance: cameraDistance.current,
      };
    },
    restoreSessionTransform(transform: WorldTransform) {
      if (!canMoveTo(transform.x, transform.z)) return;
      position.current.set(transform.x, BASE_Y, transform.z);
      rotationY.current = transform.rotationY;
      cameraYaw.current = transform.cameraYaw;
      cameraPitch.current = THREE.MathUtils.clamp(transform.cameraPitch, 0.12, 0.95);
      cameraDistance.current = THREE.MathUtils.clamp(transform.cameraDistance, 5.5, 14);
      horizontalVelocity.current.set(0, 0, 0);
      cameraTarget.current.set(transform.x, BASE_Y + 1.45, transform.z);
    },
  }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.forward = 1;
      if (key === 's' || key === 'arrowdown') keys.current.forward = -1;
      if (key === 'a' || key === 'arrowleft') keys.current.right = -1;
      if (key === 'd' || key === 'arrowright') keys.current.right = 1;
      if (key === ' ' || key === 'spacebar') keys.current.jump = true;
      if (key === 'shift') keys.current.sprint = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown') keys.current.forward = 0;
      if (key === 'a' || key === 'arrowleft' || key === 'd' || key === 'arrowright') keys.current.right = 0;
      if (key === ' ' || key === 'spacebar') keys.current.jump = false;
      if (key === 'shift') keys.current.sprint = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, [data-interactive="true"]')) return;
      if (cameraPointerId.current !== null) return;
      cameraPointerId.current = event.pointerId;
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (cameraPointerId.current !== event.pointerId) return;
      if (event.pointerType === 'touch') event.preventDefault();
      const dx = event.clientX - pointer.current.x;
      const dy = event.clientY - pointer.current.y;
      pointer.current = { x: event.clientX, y: event.clientY };
      const sensitivity = event.pointerType === 'touch' ? 0.008 : 0.006;
      cameraYaw.current -= dx * sensitivity;
      cameraPitch.current = THREE.MathUtils.clamp(cameraPitch.current + dy * sensitivity * 0.66, 0.12, 0.95);
    };
    const stopDragging = (event: PointerEvent) => {
      if (cameraPointerId.current === event.pointerId) cameraPointerId.current = null;
    };
    const onWheel = (event: WheelEvent) => {
      cameraDistance.current = THREE.MathUtils.clamp(cameraDistance.current + event.deltaY * 0.008, 5.5, 14);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('wheel', onWheel);
      if (emoteTimer.current) window.clearTimeout(emoteTimer.current);
    };
  }, []);

  useFrame((_, rawDelta) => {
    if (!root.current) return;
    const delta = Math.min(rawDelta, 0.035);
    const forwardInput = keys.current.forward !== 0 ? keys.current.forward : -virtual.current.y;
    const rightInput = keys.current.right !== 0 ? keys.current.right : virtual.current.x;
    const wantsJump = !paused && (keys.current.jump || virtual.current.jump);
    const sprinting = !paused && (keys.current.sprint || virtual.current.sprint);
    const inputLength = paused ? 0 : Math.hypot(forwardInput, rightInput);
    const hasInput = inputLength > 0.05;
    const vectors = frameVectors.current;
    const targetVelocity = vectors.targetVelocity.set(0, 0, 0);

    if (hasInput) {
      const forward = vectors.forward.set(-Math.sin(cameraYaw.current), 0, -Math.cos(cameraYaw.current));
      const right = vectors.right.set(Math.cos(cameraYaw.current), 0, -Math.sin(cameraYaw.current));
      const direction = vectors.direction.copy(forward).multiplyScalar(forwardInput).addScaledVector(right, rightInput).normalize();
      targetVelocity.copy(direction).multiplyScalar(sprinting ? 8.2 : 5.2);
    }

    const acceleration = hasInput ? 10 : 14;
    horizontalVelocity.current.lerp(targetVelocity, 1 - Math.exp(-acceleration * delta));
    if (horizontalVelocity.current.lengthSq() < 0.0025) horizontalVelocity.current.set(0, 0, 0);

    const nextX = position.current.x + horizontalVelocity.current.x * delta;
    const nextZ = position.current.z + horizontalVelocity.current.z * delta;
    if (canMoveTo(nextX, position.current.z)) position.current.x = nextX;
    else horizontalVelocity.current.x = 0;
    if (canMoveTo(position.current.x, nextZ)) position.current.z = nextZ;
    else horizontalVelocity.current.z = 0;

    const moving = horizontalVelocity.current.lengthSq() > 0.04;
    if (moving) {
      const targetRotation = Math.atan2(horizontalVelocity.current.x, horizontalVelocity.current.z);
      rotationY.current = lerpAngle(rotationY.current, targetRotation, 1 - Math.exp(-14 * delta));
    }

    if (wantsJump && grounded.current) {
      velocityY.current = 6.8;
      grounded.current = false;
    }
    if (!grounded.current) {
      position.current.y += velocityY.current * delta;
      velocityY.current -= 18 * delta;
      if (position.current.y <= BASE_Y) {
        position.current.y = BASE_Y;
        velocityY.current = 0;
        grounded.current = true;
      }
    }

    const nextMotion = { moving, sprinting: moving && sprinting, jumping: !grounded.current };
    if (nextMotion.moving !== motionRef.current.moving || nextMotion.sprinting !== motionRef.current.sprinting || nextMotion.jumping !== motionRef.current.jumping) {
      motionRef.current = nextMotion;
      setMotion(nextMotion);
    }

    root.current.position.copy(position.current);
    root.current.rotation.y = rotationY.current;
    positionNotifyClock.current += delta;
    if (positionNotifyClock.current >= 0.1) {
      positionNotifyClock.current = 0;
      onPositionChange?.(position.current);
    }

    const distance = cameraDistance.current;
    const pitch = cameraPitch.current;
    const offset = vectors.cameraOffset.set(
      Math.sin(cameraYaw.current) * Math.cos(pitch) * distance,
      Math.sin(pitch) * distance + 1.4,
      Math.cos(cameraYaw.current) * Math.cos(pitch) * distance
    );
    const desired = vectors.desiredCamera.copy(position.current).add(offset);
    camera.position.lerp(desired, 1 - Math.exp(-6.5 * delta));
    cameraTarget.current.lerp(
      vectors.desiredTarget.set(position.current.x, position.current.y + 1.45, position.current.z),
      1 - Math.exp(-9 * delta)
    );
    camera.lookAt(cameraTarget.current);
  });

  return (
    <group ref={root}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 20]} />
        <meshBasicMaterial color="#14202a" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <ChibiCasualPlayerModel moving={motion.moving} sprinting={motion.sprinting} jumping={motion.jumping} victory={Boolean(emote)} />
      {emote && (
        <Html position={[0, 2.25, 0]} center distanceFactor={13}>
          <div className="grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/95 text-2xl shadow-xl animate-bounce">{emote}</div>
        </Html>
      )}
    </group>
  );
});
