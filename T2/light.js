import * as THREE from 'three';

const LIGHT_SOURCE_X_POSITION = -100;
const LIGHT_SOURCE_Y_POSITION = 100;

/**
 * @param {number} cameraNearZ Z position of camera near plane
 * @param {number} cameraFarZ Z position of camera far plane
 * @param {Array} cameraPosition camera's X and Y coordinates
 * @param {boolean} addHelper creates a helper associated with the light object if true
 * @param {scene} scene to add light to
 * @returns 
 */
export function initSceneLighting(camera, scene) {
    const color = 0xFFFFFF;
    let ambientLight = new THREE.AmbientLight(color, 0.1);
    let light = new THREE.DirectionalLight(color, 1);

    light.position.set(LIGHT_SOURCE_X_POSITION, LIGHT_SOURCE_Y_POSITION, -30);
    light.target.position.set(0, 0, 0);

    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.radius = 1.5;

    scene.add(light);
    scene.add(ambientLight);
    scene.add(light.target);

    updateLightVolume(light, camera, scene.fog.far);
    return light;
}

const MAX_TREE_HEIGHT = 15;

export function updateLightVolume(light, camera, fogFar) {
    const topBottom = fogFar + MAX_TREE_HEIGHT;

    light.shadow.camera.left = -fogFar * 0.2;
    light.shadow.camera.right = fogFar;
    light.shadow.camera.top = topBottom;
    light.shadow.camera.bottom = -topBottom;
    light.shadow.camera.far = fogFar + 200;
    light.shadow.camera.updateProjectionMatrix();
}

export function updateLightPosition(light, camera) {
    light.position.set(
        camera.position.x + LIGHT_SOURCE_X_POSITION,
        LIGHT_SOURCE_Y_POSITION,
        camera.position.z
    );
    light.target.position.set(camera.position.x, 0, camera.position.z);
    light.target.updateMatrixWorld();
}