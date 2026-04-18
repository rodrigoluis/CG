import * as THREE from "three";

const CAMERA_OFFSET_Y = 0;
const CAMERA_SMOOTHING = 0.2;
const CAM_LIMIT_X = 0.1;
const CAM_LIMIT_Y_MIN = 5;
const CAM_LIMIT_Y_MAX = 5;

export function updateCamera(camera, aviaoMesh, delta) {
  if (!aviaoMesh) return;
  const camAlpha = 1 - Math.exp(-delta / CAMERA_SMOOTHING);

  let targetCX = aviaoMesh.position.x * 0.1;
  let targetCY = aviaoMesh.position.y * 0.1 + CAMERA_OFFSET_Y;
  THREE.MathUtils.clamp(targetCX, -CAM_LIMIT_X, CAM_LIMIT_X);
  THREE.MathUtils.clamp(targetCY, CAM_LIMIT_Y_MIN, CAM_LIMIT_Y_MAX);

  camera.position.x += (targetCX - camera.position.x) * 0.1 * camAlpha;
  camera.position.x += (targetCX - camera.position.x) * 0.1 * camAlpha;

  camera.lookAt(aviaoMesh.position);
}
