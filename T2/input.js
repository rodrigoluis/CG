import * as THREE from "three";
import { CONFIG } from "./config.js";

// Mantém as propriedades expostas em escopo para compatibilidade estrita com os outros scripts
export const PLANE_BASE_Y = CONFIG.input.planeBaseY;
export const PLANE_BOUNDS_X = CONFIG.input.boundsX;
export const PLANE_BOUNDS_Y = CONFIG.input.boundsY;

export const mouse = new THREE.Vector2();

export function initMouseTracking() {
  globalThis.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  });
}

export function getWorldPositionAtZ(camera, ndcX, ndcY, targetZ) {
  const ndc = new THREE.Vector3(ndcX, ndcY, 0.5);
  const world = ndc.unproject(camera);
  const dir = world.sub(camera.position).normalize();
  const t = (targetZ - camera.position.z) / dir.z;
  return new THREE.Vector3(
    camera.position.x + t * dir.x,
    camera.position.y + t * dir.y,
    targetZ,
  );
}

export function inputUpdate(aviaoMesh, targetMesh, camera, delta) {
  if (!aviaoMesh || !targetMesh) return;

  const planoZMira = aviaoMesh.position.z + 50;
  const rawTargetPos = getWorldPositionAtZ(
    camera,
    mouse.x,
    mouse.y,
    planoZMira,
  );

  // Clampa a mira usando os limites do arquivo central
  targetMesh.position.x = THREE.MathUtils.clamp(
    rawTargetPos.x,
    -CONFIG.input.boundsX,
    CONFIG.input.boundsX,
  );
  targetMesh.position.y = THREE.MathUtils.clamp(
    rawTargetPos.y,
    CONFIG.input.planeBaseY - CONFIG.input.boundsY,
    CONFIG.input.planeBaseY + CONFIG.input.boundsY,
  );
  targetMesh.position.z = planoZMira;

  // Movimento amortecido do avião perseguindo a retícula
  aviaoMesh.position.x = THREE.MathUtils.lerp(
    aviaoMesh.position.x,
    targetMesh.position.x,
    delta * CONFIG.input.smoothFactorXY,
  );
  aviaoMesh.position.y = THREE.MathUtils.lerp(
    aviaoMesh.position.y,
    targetMesh.position.y,
    delta * CONFIG.input.smoothFactorXY,
  );

  const dx = targetMesh.position.x - aviaoMesh.position.x;
  const dy = targetMesh.position.y - aviaoMesh.position.y;

  const MAX_BANK = THREE.MathUtils.degToRad(40);
  const MAX_PITCH = THREE.MathUtils.degToRad(15);

  let targetRotationZ = dx * -0.4;
  let targetRotationX = dy * -0.3;

  targetRotationZ = THREE.MathUtils.clamp(targetRotationZ, -MAX_BANK, MAX_BANK);
  targetRotationX = THREE.MathUtils.clamp(
    targetRotationX,
    -MAX_PITCH,
    MAX_PITCH,
  );

  aviaoMesh.rotation.z = THREE.MathUtils.lerp(
    aviaoMesh.rotation.z,
    targetRotationZ,
    delta * 8,
  );
  aviaoMesh.rotation.x = THREE.MathUtils.lerp(
    aviaoMesh.rotation.x,
    targetRotationX,
    delta * 8,
  );
  aviaoMesh.rotation.y = THREE.MathUtils.lerp(
    aviaoMesh.rotation.y,
    targetRotationZ * 0.15,
    delta * 8,
  );
}
