import * as THREE from "three";

const FOLLOW_DELAY = 0.5;
const PLANE_MARGIN = 3;

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
  const bounds = getFrustumBoundsAtZ(camera, aviaoMesh.position.z);
  const clampedX = THREE.MathUtils.clamp(
    target.x,
    bounds.minX + PLANE_MARGIN,
    bounds.maxX - PLANE_MARGIN,
  );
  const clampedY = THREE.MathUtils.clamp(
    target.y,
    Math.max(bounds.minY + PLANE_MARGIN, PLANE_MARGIN),
    bounds.maxY - PLANE_MARGIN,
  );

  const dx = clampedX - aviaoMesh.position.x;
  const MAX_BANK = THREE.MathUtils.degToRad(45);
  const MAX_YAW = THREE.MathUtils.degToRad(15);

  let targetRotationZ = dx * -0.5;
  let targetY = dx * 0.2;

  const alphaRotation = 1 - Math.exp(-delta / (FOLLOW_DELAY * 0.25));
  const alphaPosition = 1 - Math.exp(-delta / FOLLOW_DELAY);

  targetRotationZ = THREE.MathUtils.clamp(targetRotationZ, -MAX_BANK, MAX_BANK);
  THREE.MathUtils.clamp(targetY, -MAX_YAW, MAX_YAW);

  aviaoMesh.rotation.z += (targetRotationZ - aviaoMesh.rotation.z) * alphaRotation;
  aviaoMesh.rotation.y += (targetRotationZ - aviaoMesh.rotation.z) * 0.1 * alphaRotation;
  aviaoMesh.position.x += dx * alphaPosition;
  aviaoMesh.position.y += (clampedY - aviaoMesh.position.y) * alphaPosition;
}
