import * as THREE from "three";
import { PLANE_BASE_Y, PLANE_BOUNDS_X, PLANE_BOUNDS_Y } from "./input.js";

const CAM_Z_OFFSET = -95;
const CAM_Y_OFFSET = 3;
const CAM_LOOK_AHEAD = 25;
const CAM_ROLL_FACTOR = 0.005;
const XY_TIME_CONSTANT = 0.1;

// Camera rectangle is smaller than plane rectangle.
// Near edges, plane drifts off-center → player feels proximity to limit.
const CAM_BOUNDS_X = PLANE_BOUNDS_X * 0.7;
const CAM_BOUNDS_Y = PLANE_BOUNDS_Y * 0.7;

const _lookTarget = new THREE.Vector3();

export function updateCamera(camera, aviaoMesh, delta) {
  const px = aviaoMesh.position.x;
  const py = aviaoMesh.position.y;
  const pz = aviaoMesh.position.z;

  const alpha = 1 - Math.exp(-delta / XY_TIME_CONSTANT);
  camera.position.x += (px - camera.position.x) * alpha;
  camera.position.y += (py + CAM_Y_OFFSET - camera.position.y) * alpha;
  camera.position.z = pz + CAM_Z_OFFSET;

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -CAM_BOUNDS_X, CAM_BOUNDS_X);
  camera.position.y = THREE.MathUtils.clamp(
    camera.position.y,
    PLANE_BASE_Y + CAM_Y_OFFSET - CAM_BOUNDS_Y,
    PLANE_BASE_Y + CAM_Y_OFFSET + CAM_BOUNDS_Y,
  );

  _lookTarget.set(px, py, pz + CAM_LOOK_AHEAD);

  const bank = aviaoMesh.rotation.z * CAM_ROLL_FACTOR;
  camera.up.set(Math.sin(bank), Math.cos(bank), 0);

  camera.lookAt(_lookTarget);
}
