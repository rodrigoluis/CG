import * as THREE from 'three';

const LIGHT_SOURCE_X_POSITION = -50;
const LIGHT_SOURCE_Y_POSITION = 50;

/**
 * @param {number} cameraNearZ Z position of camera near plane
 * @param {number} cameraFarZ Z position of camera far plane
 * @param {Array} cameraPosition camera's X and Y coordinates
 * @param {boolean} addHelper creates a helper associated with the light object if true
 * @param {scene} scene to add light to
 * @returns 
 */
export function initSceneLighting(cameraNearZ, cameraFarZ, cameraPosition, scene, addHelper = false) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    
    // uma fração entre o near da câmera e a fog
    const fraction = (scene.fog.far - cameraNearZ) / 10;

    // negativo para projetar sombras diagonalmente
    // TODO perguntar para o professor para onde as sombras vão ficar
    light.position.set(LIGHT_SOURCE_X_POSITION, LIGHT_SOURCE_Y_POSITION, -fraction);
    light.target.position.set(0, 0, 0);

    light.castShadow = true;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = 0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;

    scene.add(light);

    if (addHelper) {
        const helper = new THREE.DirectionalLightHelper(light);
        scene.add(helper);
        const helperShadow = new THREE.CameraHelper(light.shadow.camera);
        scene.add(helperShadow);
    }
}