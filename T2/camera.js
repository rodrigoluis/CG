import * as THREE from "three";
import { CONFIG } from "./config.js";

export function updateCamera(camera, aviaoMesh, delta) {
  const px = aviaoMesh.position.x;
  const py = aviaoMesh.position.y;
  const pz = aviaoMesh.position.z;

  const confCam = CONFIG.camera;
  const camBoundsX = CONFIG.input.boundsX * confCam.multiplicadorBalançoX;
  const camBoundsY = CONFIG.input.boundsY * confCam.multiplicadorBalançoY;

  const alpha = 1 - Math.exp(-delta / confCam.xyTimeConstant);
  camera.position.x += (px - camera.position.x) * alpha;
  camera.position.y += (py + confCam.offsetY - camera.position.y) * alpha;
  camera.position.z = pz + confCam.offsetZ;

  // Clampa limites de deslocamento lateral da câmera
  camera.position.x = THREE.MathUtils.clamp(
    camera.position.x,
    -camBoundsX,
    camBoundsX,
  );
  camera.position.y = THREE.MathUtils.clamp(
    camera.position.y,
    CONFIG.input.planeBaseY + confCam.offsetY - camBoundsY,
    CONFIG.input.planeBaseY + confCam.offsetY + camBoundsY,
  );

  const lookTarget = new THREE.Vector3(px, py, pz + confCam.lookAhead);

  const bank = aviaoMesh.rotation.z * confCam.rollFactor;
  camera.up.set(Math.sin(bank), Math.cos(bank), 0);

  camera.lookAt(lookTarget);
}
