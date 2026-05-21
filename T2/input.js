/**
 * @file input.js
 * Lê posição do mouse e move o avião suavemente em direção ao cursor.
 */

import * as THREE from "three";

// delay para o avião começar a seguir o mouse
const FOLLOW_DELAY = 0.2;

/** Altura inicial do avião na cena. */
export const PLANE_BASE_Y = 120;

/** Limite de movimento horizontal do avião. */
export const PLANE_BOUNDS_X = 45;

/** Limite de movimento vertical do avião. */
export const PLANE_BOUNDS_Y = 15;

/** Posição normalizada do mouse na tela (NDC). */
export const mouse = new THREE.Vector2();

/**
 * Registra listener de mousemove e atualiza {@link mouse} com coordenadas NDC.
 */
export function initMouseTracking() {
  globalThis.addEventListener("mousemove", (e) => {
    // converte pixels da tela para NDC: espaço onde a tela vai de -1 a +1
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;   // esquerda=-1, direita=+1
    mouse.y = (e.clientY / window.innerHeight) * -2 + 1;  // Y invertido: topo=+1, baixo=-1
  });
}

/**
 * Calcula os limites do frustum (min/max X e Y) num plano Z fixo.
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} targetZ - Profundidade do plano alvo.
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
 */
export function getFrustumBoundsAtZ(camera, targetZ) {
  // frustum = pirâmide de visão da câmera. o que estiver fora dele é 'descartado'
  // para evitar renderização desnecessária pela GPU
  // Os 4 cantos da tela em NDC (z=0.5 = ponto no meio do frustum)
  const ndcCorners = [
    new THREE.Vector3(-1,  1, 0.5), // canto superior esquerdo
    new THREE.Vector3( 1,  1, 0.5), // canto superior direito
    new THREE.Vector3(-1, -1, 0.5), // canto inferior esquerdo
    new THREE.Vector3( 1, -1, 0.5), // canto inferior direito
  ];

  const worldPoints = ndcCorners.map(ndc => {
    // unproject: desfaz a projeção, convertendo NDC → espaço mundo
    const world = ndc.clone().unproject(camera);
    // direção do raio saindo da câmera em direção ao canto da tela
    const dir = world.sub(camera.position).normalize();
    // t: quanto andar na direção do raio até atingir o plano targetZ
    const t = (targetZ - camera.position.z) / dir.z;
    return new THREE.Vector3(
      camera.position.x + t * dir.x,
      camera.position.y + t * dir.y,
      targetZ
    );
  });

  // Retorna a caixa delimitadora dos 4 pontos projetados
  return {
    minX: Math.min(...worldPoints.map(p => p.x)),
    maxX: Math.max(...worldPoints.map(p => p.x)),
    minY: Math.min(...worldPoints.map(p => p.y)),
    maxY: Math.max(...worldPoints.map(p => p.y)),
  };
}

/**
 * Converte coordenadas NDC em posição 3D num plano Z fixo.
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} ndcX - Coordenada X normalizada (-1 a 1).
 * @param {number} ndcY - Coordenada Y normalizada (-1 a 1).
 * @param {number} targetZ - Profundidade do plano alvo.
 * @returns {THREE.Vector3}
 */
export function getWorldPositionAtZ(camera, ndcX, ndcY, targetZ) {
  const ndc = new THREE.Vector3(ndcX, ndcY, 0.5);
  const world = ndc.unproject(camera); // NDC → espaço mundo
  const dir = world.sub(camera.position).normalize(); // raio da câmera ao ponto
  const t = (targetZ - camera.position.z) / dir.z;   // distância até o plano Z
  return new THREE.Vector3(
    camera.position.x + t * dir.x,
    camera.position.y + t * dir.y,
    targetZ
  );
}

/**
 * Atualiza posição e rotação do avião com base na posição do mouse.
 * @param {THREE.Mesh} aviaoMesh
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta - Tempo desde o último frame em segundos.
 */
export function inputUpdate(aviaoMesh, camera, delta) {
  // Converte posição do mouse (NDC) para coordenada 3D no plano do avião
  const target = getWorldPositionAtZ(camera, mouse.x, mouse.y, aviaoMesh.position.z);

  // Limita o destino dentro dos limites permitidos para o avião
  const clampedX = THREE.MathUtils.clamp(target.x, -PLANE_BOUNDS_X, PLANE_BOUNDS_X);
  const clampedY = THREE.MathUtils.clamp(
    target.y,
    PLANE_BASE_Y - PLANE_BOUNDS_Y,
    PLANE_BASE_Y + PLANE_BOUNDS_Y,
  );

  // diferença entre destino e posição atual — indica direção e intensidade do movimento
  const dx = clampedX - aviaoMesh.position.x;
  const dy = clampedY - aviaoMesh.position.y;

  // ângulos máximos de inclinação do avião
  const MAX_BANK  = THREE.MathUtils.degToRad(45); // inclinação lateral
  const MAX_PITCH = THREE.MathUtils.degToRad(10); // inclinação frontal
  const MAX_YAW   = THREE.MathUtils.degToRad(15); // guinada (rotação em Y)

  // quanto maior o dx/dy, maior a inclinação desejada
  let targetRotationZ = dx * -0.5; // banco: inclina para o lado oposto ao movimento
  let targetRotationX = dy * -0.5; // pitch: inclina para cima/baixo
  let targetY = dx * 0.2;          // yaw suave ao virar

  // alpha de rotação
  const alphaRotation = 1 - Math.exp(-delta / (FOLLOW_DELAY * 0.5));
  const alphaPosition = 1 - Math.exp(-delta / FOLLOW_DELAY);

  // garante que as inclinações não ultrapassem os limites definidos
  targetRotationZ = THREE.MathUtils.clamp(targetRotationZ, -MAX_BANK, MAX_BANK);
  targetRotationX = THREE.MathUtils.clamp(targetRotationX, -MAX_PITCH, MAX_PITCH);
  THREE.MathUtils.clamp(targetY, -MAX_YAW, MAX_YAW);

  // interpolação exponencial: avião se aproxima suavemente da rotação alvo
  aviaoMesh.rotation.z += (targetRotationZ - aviaoMesh.rotation.z) * alphaRotation;
  // pequena guinada proporcional ao bank — visual mais natural na curva
  aviaoMesh.rotation.y += (targetRotationZ - aviaoMesh.rotation.z) * 0.1 * alphaRotation;
  aviaoMesh.rotation.x += (targetRotationX - aviaoMesh.rotation.x) * alphaRotation;

  // move o avião ao destino (translação)
  aviaoMesh.position.x += dx * alphaPosition;
  aviaoMesh.position.y += (clampedY - aviaoMesh.position.y) * alphaPosition;
}
