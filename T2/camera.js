/**
 * @file camera.js
 * Controla a câmera que segue o avião suavemente.
 */

import * as THREE from "three";
import { PLANE_BASE_Y, PLANE_BOUNDS_X, PLANE_BOUNDS_Y } from "./input.js";

/** Distância da câmera atrás do avião no eixo Z. */
const CAM_Z_OFFSET = -95;
const CAM_Y_OFFSET = 0; // era a distância em y da altura do avião pra da câmera
                        // mantida mesmo que 0 para facilitar ajustes futuros
/** Distância à frente usada para definir para onde a câmera olha. */
const CAM_LOOK_AHEAD = 200;
/** Quanto o rolamento do avião inclina a câmera. */
const CAM_ROLL_FACTOR = 0.005;
/** Constante de tempo para suavizar o movimento lateral da câmera. */
const XY_TIME_CONSTANT = 1;

// câmera se mexe menos que o avião para dar noção dos limites das bordas
const CAM_BOUNDS_X = PLANE_BOUNDS_X * 0.07;
const CAM_BOUNDS_Y = PLANE_BOUNDS_Y * 0.07;

// reutilizando todo frame para evitar alocação de objeto novo
const _lookTarget = new THREE.Vector3();

/**
 * Atualiza posição e orientação da câmera para seguir o avião.
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Mesh} aviaoMesh
 * @param {number} delta - Tempo desde o último frame em segundos.
 */
export function updateCamera(camera, aviaoMesh, delta) {
  const px = aviaoMesh.position.x;
  const py = aviaoMesh.position.y;
  const pz = aviaoMesh.position.z;

  // alpha cresce com delta: quanto maior o delta, mais rápida a aproximação
  // fórmula de suavização exponencial independente de framerate
  const alpha = 1 - Math.exp(-delta / XY_TIME_CONSTANT);
  camera.position.x += (px - camera.position.x) * alpha;             // segue X suavemente
  camera.position.y += (py + CAM_Y_OFFSET - camera.position.y) * alpha; // segue Y suavemente
  camera.position.z = pz + CAM_Z_OFFSET; // Z travado: câmera sempre atrás do avião

  // Limita deslocamento da câmera para não sair muito do centro
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -CAM_BOUNDS_X, CAM_BOUNDS_X);
  camera.position.y = THREE.MathUtils.clamp(
    camera.position.y,
    PLANE_BASE_Y + CAM_Y_OFFSET - CAM_BOUNDS_Y,
    PLANE_BASE_Y + CAM_Y_OFFSET + CAM_BOUNDS_Y,
  );

  // Ponto à frente do avião — câmera sempre olha para a direção de voo
  _lookTarget.set(px, py, pz + CAM_LOOK_AHEAD);

  // Inclina o vetor "up" da câmera proporcionalmente ao bank do avião
  // cria sensação de que a câmera acompanha a curva
  const bank = aviaoMesh.rotation.z * CAM_ROLL_FACTOR;
  camera.up.set(Math.sin(bank), Math.cos(bank), 0);

  camera.lookAt(_lookTarget);
}
