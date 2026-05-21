import * as THREE from "three";

/**
 * Cria o objeto 3D da mira (target) como um círculo.
 * @param {THREE.Scene} scene
 * @returns {THREE.Line} O objeto da retícula circular.
 */
export function criaTarget(scene) {
  // AJUSTE: Usaremos um círculo agora.
  const raio = 2;
  const segmentos = 32;
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2;
    vertices.push(
      Math.cos(theta) * raio,
      Math.sin(theta) * raio,
      0, // No plano XY local
    );
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );

  const material = new THREE.LineBasicMaterial({
    color: "rgb(255, 217, 2)", // Amarelo
    linewidth: 5,
    depthTest: false,
  });

  const targetMesh = new THREE.Line(geometry, material);
  targetMesh.renderOrder = 999;
  targetMesh.position.set(0, 32, 50); // Nova distância Z aproximada

  scene.add(targetMesh);
  return targetMesh;
}
