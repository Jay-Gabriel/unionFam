import * as THREE from 'three';

export const PLANET_RADIUS = 26;

/** Convert spherical coordinates (theta = latitude angle, phi = longitude angle) to 3D Cartesian position */
export function sphericalToCartesian(
  radius: number,
  theta: number,
  phi: number
): [number, number, number] {
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return [x, y, z];
}

/** Convert a 3D position vector to spherical angles (theta, phi) */
export function cartesianToSpherical(
  pos: THREE.Vector3
): { radius: number; theta: number; phi: number } {
  const radius = pos.length();
  if (radius === 0) return { radius: 0, theta: 0, phi: 0 };
  const theta = Math.acos(Math.max(-1, Math.min(1, pos.y / radius)));
  const phi = Math.atan2(pos.z, pos.x);
  return { radius, theta, phi };
}

/** Get the upward normal vector on the sphere surface at position */
export function getSphericalUp(pos: THREE.Vector3): THREE.Vector3 {
  return pos.clone().normalize();
}

/** Align a 3D object to stand upright perpendicularly on the sphere surface */
export function alignToSphereSurface(
  object: THREE.Object3D,
  position: THREE.Vector3,
  headingAngle = 0
) {
  const normal = position.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);

  // Compute rotation from default up (0,1,0) to surface normal
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

  // Apply heading rotation around the local normal
  const headingQuat = new THREE.Quaternion().setFromAxisAngle(normal, headingAngle);
  quaternion.premultiply(headingQuat);

  object.position.copy(position);
  object.quaternion.copy(quaternion);
}

/** Calculate distance along sphere surface between two points */
export function greatCircleDistance(
  posA: THREE.Vector3,
  posB: THREE.Vector3,
  radius: number = PLANET_RADIUS
): number {
  const normA = posA.clone().normalize();
  const normB = posB.clone().normalize();
  const dot = Math.max(-1, Math.min(1, normA.dot(normB)));
  return Math.acos(dot) * radius;
}
