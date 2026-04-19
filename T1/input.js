import * as THREE from "three";

const FOLLOW_DELAY = 0.15;

export const PLANE_BASE_Y = 25;
export const PLANE_BOUNDS_X = 35;
export const PLANE_BOUNDS_Y = 15;

export const mouse = new THREE.Vector2();

export function initMouseTracking() {
  globalThis.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  });
}

export function getFrustumBoundsAtZ(camera, targetZ) {
  const ndcCorners = [
    new THREE.Vector3(-1, 1, 0.5),
    new THREE.Vector3(1, 1, 0.5),
    new THREE.Vector3(-1, -1, 0.5),
    new THREE.Vector3(1, -1, 0.5),
  ];

  const worldPoints = ndcCorners.map(ndc => {
    const world = ndc.clone().unproject(camera);
    const dir = world.sub(camera.position).normalize();
    const t = (targetZ - camera.position.z) / dir.z;
    return new THREE.Vector3(
      camera.position.x + t * dir.x,
      camera.position.y + t * dir.y,
      targetZ
    );
  });

  return {
    minX: Math.min(...worldPoints.map(p => p.x)),
    maxX: Math.max(...worldPoints.map(p => p.x)),
    minY: Math.min(...worldPoints.map(p => p.y)),
    maxY: Math.max(...worldPoints.map(p => p.y)),
  };
}

export function getWorldPositionAtZ(camera, ndcX, ndcY, targetZ) {
  const ndc = new THREE.Vector3(ndcX, ndcY, 0.5);
  const world = ndc.unproject(camera);
  const dir = world.sub(camera.position).normalize();
  const t = (targetZ - camera.position.z) / dir.z;
  return new THREE.Vector3(
    camera.position.x + t * dir.x,
    camera.position.y + t * dir.y,
    targetZ
  );
}

export function inputUpdate(aviaoMesh, camera, delta) {
  const target = getWorldPositionAtZ(camera, mouse.x, mouse.y, aviaoMesh.position.z);
  const clampedX = THREE.MathUtils.clamp(target.x, -PLANE_BOUNDS_X, PLANE_BOUNDS_X);
  const clampedY = THREE.MathUtils.clamp(
    target.y,
    PLANE_BASE_Y - PLANE_BOUNDS_Y,
    PLANE_BASE_Y + PLANE_BOUNDS_Y,
  );

  const dx = clampedX - aviaoMesh.position.x;
  const dy = clampedY - aviaoMesh.position.y;
  const MAX_BANK = THREE.MathUtils.degToRad(45);
  const MAX_PITCH = THREE.MathUtils.degToRad(10);
  const MAX_YAW = THREE.MathUtils.degToRad(15);

  let targetRotationZ = dx * -0.5;
  let targetRotationX = dy * -0.5;
  let targetY = dx * 0.2;

  const alphaRotation = 1 - Math.exp(-delta / (FOLLOW_DELAY * 0.5));
  const alphaPosition = 1 - Math.exp(-delta / FOLLOW_DELAY);

  targetRotationZ = THREE.MathUtils.clamp(targetRotationZ, -MAX_BANK, MAX_BANK);
  targetRotationX = THREE.MathUtils.clamp(targetRotationX, -MAX_PITCH, MAX_PITCH);
  THREE.MathUtils.clamp(targetY, -MAX_YAW, MAX_YAW);

  aviaoMesh.rotation.z += (targetRotationZ - aviaoMesh.rotation.z) * alphaRotation;
  aviaoMesh.rotation.y += (targetRotationZ - aviaoMesh.rotation.z) * 0.1 * alphaRotation;
  aviaoMesh.rotation.x += (targetRotationX - aviaoMesh.rotation.x) * alphaRotation;
  aviaoMesh.position.x += dx * alphaPosition;
  aviaoMesh.position.y += (clampedY - aviaoMesh.position.y) * alphaPosition;
}
