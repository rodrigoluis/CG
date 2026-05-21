import * as THREE from 'three';

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
    const halfway = (cameraFarZ - cameraNearZ) / 2;
    light.position.set(100, 100, halfway);
    light.target.position.set(0, 0, halfway);
    scene.add(camera);
    if (addHelper) {
        const helper = new THREE.DirectionalLightHelper(light);
        scene.add(helper);
    }
}