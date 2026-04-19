import * as THREE from "three";
import { PLANE_BASE_Y } from "./input.js";

const CAM_Z_OFFSET = -50;
const CAM_Y_OFFSET = 5;
const CAM_LOOK_AHEAD = 25;
const CAM_ROLL_FACTOR = 0.005;
const XY_TIME_CONSTANT = 0.1;
const CAM_XY_RATIO = 0.8;

const _lookTarget = new THREE.Vector3();

export function updateCamera(camera, aviaoMesh, delta) {
  const px = aviaoMesh.position.x;
  const py = aviaoMesh.position.y;
  const pz = aviaoMesh.position.z;

  const targetX = px * CAM_XY_RATIO;
  const targetY = PLANE_BASE_Y + (py - PLANE_BASE_Y) * CAM_XY_RATIO + CAM_Y_OFFSET;
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
