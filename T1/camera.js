import * as THREE from "three";

const CAM_Z_OFFSET = -50; // distância da câmera ao avião
const CAM_Y_OFFSET = 5; // diferença de altura entre a câmera e o avião
const CAM_LOOK_AHEAD = 25;
const CAM_ROLL_FACTOR = 0.005; // rotação em torno de z da câmera
const XY_TIME_CONSTANT = 0.1; // delay para a câmera acompanhar o avião

const _lookTarget = new THREE.Vector3();

export function updateCamera(camera, aviaoMesh, delta) {
  const px = aviaoMesh.position.x;
  const py = aviaoMesh.position.y;
  const pz = aviaoMesh.position.z;

  const targetX = px;
  const targetY = py + CAM_Y_OFFSET;
  const targetZ = pz + CAM_Z_OFFSET;

  const alpha = 1 - Math.exp(-delta / XY_TIME_CONSTANT);
  camera.position.x += (targetX - camera.position.x) * alpha;
  camera.position.y += (targetY - camera.position.y) * alpha;
  camera.position.z = targetZ;

  _lookTarget.set(px, py, pz + CAM_LOOK_AHEAD);

  // Tilt camera up-vector with plane bank for Star Fox roll feel
  const bank = aviaoMesh.rotation.z * CAM_ROLL_FACTOR;
  camera.up.set(Math.sin(bank), Math.cos(bank), 0);

  camera.lookAt(_lookTarget);
}
