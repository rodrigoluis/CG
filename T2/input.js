import * as THREE from "three";

// Fatores de suavização elástica (Delay do avião perseguindo a mira)
const SMOOTH_FACTOR_XY = 4.5;

/** Altura inicial do avião na cena. */
export const PLANE_BASE_Y = 105;

/** Limites de movimento horizontal da retícula no monitor. */
export const PLANE_BOUNDS_X = 65;

/** Limites de movimento vertical da retícula no monitor. */
export const PLANE_BOUNDS_Y = 25;

/** Posição normalizada do mouse na tela (NDC). */
export const mouse = new THREE.Vector2();

/**
 * Registra listener de mousemove e atualiza coordenadas NDC.
 */
export function initMouseTracking() {
  globalThis.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  });
}

/**
 * Converte coordenadas NDC em posição 3D num plano Z fixo.
 */
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

/**
 * Atualiza posição do target instantaneamente pelo mouse e faz o avião segui-lo com delay.
 * @param {THREE.Mesh} aviaoMesh
 * @param {THREE.LineSegments} targetMesh
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} delta - Tempo desde o último frame em segundos.
 */
export function inputUpdate(aviaoMesh, targetMesh, camera, delta) {
  if (!aviaoMesh || !targetMesh) return;

  // 1. ATUALIZAÇÃO DO TARGET: Ele fica fixo a uma distância constante (Z + 140) à frente do avião
  const planoZMira = aviaoMesh.position.z + 50;
  const rawTargetPos = getWorldPositionAtZ(
    camera,
    mouse.x,
    mouse.y,
    planoZMira,
  );

  // Mantém as travas do monitor intactas
  targetMesh.position.x = THREE.MathUtils.clamp(
    rawTargetPos.x,
    -PLANE_BOUNDS_X,
    PLANE_BOUNDS_X,
  );
  targetMesh.position.y = THREE.MathUtils.clamp(
    rawTargetPos.y,
    PLANE_BASE_Y - PLANE_BOUNDS_Y,
    PLANE_BASE_Y + PLANE_BOUNDS_Y,
  );
  targetMesh.position.z = planoZMira;

  // Clampa a posição da mira dentro dos limites visíveis do monitor
  targetMesh.position.x = THREE.MathUtils.clamp(
    rawTargetPos.x,
    -PLANE_BOUNDS_X,
    PLANE_BOUNDS_X,
  );
  targetMesh.position.y = THREE.MathUtils.clamp(
    rawTargetPos.y,
    PLANE_BASE_Y - PLANE_BOUNDS_Y,
    PLANE_BASE_Y + PLANE_BOUNDS_Y,
  );
  targetMesh.position.z = planoZMira;

  // 2. ATUALIZAÇÃO DO AVIÃO: Persegue a posição X e Y do target usando Lerp Amortecido
  // Como o avião nunca alcança o target instantaneamente, ele nunca tampa a sua visão da mira!
  aviaoMesh.position.x = THREE.MathUtils.lerp(
    aviaoMesh.position.x,
    targetMesh.position.x,
    delta * SMOOTH_FACTOR_XY,
  );
  aviaoMesh.position.y = THREE.MathUtils.lerp(
    aviaoMesh.position.y,
    targetMesh.position.y,
    delta * SMOOTH_FACTOR_XY,
  );

  // 3. INCLINAÇÕES E ROTAÇÕES DA NAVE (ESTILO STAR FOX)
  const dx = targetMesh.position.x - aviaoMesh.position.x;
  const dy = targetMesh.position.y - aviaoMesh.position.y;

  const MAX_BANK = THREE.MathUtils.degToRad(40); // Roll lateral
  const MAX_PITCH = THREE.MathUtils.degToRad(15); // Pitch vertical

  let targetRotationZ = dx * -0.4; // Inclina as asas lateralmente ao virar
  let targetRotationX = dy * -0.3; // Inclina o nariz ao subir ou descer

  targetRotationZ = THREE.MathUtils.clamp(targetRotationZ, -MAX_BANK, MAX_BANK);
  targetRotationX = THREE.MathUtils.clamp(
    targetRotationX,
    -MAX_PITCH,
    MAX_PITCH,
  );

  // Suavização das rotações
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
