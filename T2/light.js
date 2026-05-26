import * as THREE from 'three';

const LIGHT_SOURCE_X_POSITION = -100;
const LIGHT_SOURCE_Y_POSITION = 100;

/**
 * Inicializa luzes direcional e ambiental da cena
 * @param {camera} camera com propriedades definidas das quais os parâmetros
 * de sombra são derivados
 * @param {scene} scene à qual a luz será adicionada
 * @returns 
 */
export function initSceneLighting(camera, scene) {
    const color = 0xFFFFFF;
    let ambientLight = new THREE.AmbientLight(color, 0.1);
    let light = new THREE.DirectionalLight(color, 1);

    light.position.set(LIGHT_SOURCE_X_POSITION, LIGHT_SOURCE_Y_POSITION, -30);
    light.target.position.set(0, 0, 0);

    light.castShadow = true;
    light.shadow.mapSize.width = 8112;
    light.shadow.mapSize.height = 8112;
    light.shadow.radius = 2;

    scene.add(light);
    scene.add(ambientLight);
    scene.add(light.target);

    updateLightVolume(light, scene.fog.far);
    return light;
}

const MAX_TREE_HEIGHT = 19; // maior tamanho de conífera possível com as escalas randomizadas

/**
 * Atualiza o frustum da câmera auxiliar da luz para projetar sombras somente no
 * volume visível definido pelo valor da fog
 * 
 * Usa uma pequena folga para garantir a experiência sem comprometer performance
 * 
 * @param {*} light luz direcional utilizada
 * @param {*} camera camera 
 * @param {*} fogFar 
 */
export function updateLightVolume(light, fogFar) {
    const topBottom = fogFar + MAX_TREE_HEIGHT;

    light.shadow.camera.left = -fogFar * 0.2;
    light.shadow.camera.right = fogFar;
    light.shadow.camera.top = topBottom;
    light.shadow.camera.bottom = -topBottom;
    light.shadow.camera.far = fogFar + 200;
    light.shadow.camera.updateProjectionMatrix();
}