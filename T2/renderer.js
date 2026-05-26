import * as THREE from 'three';

export function startRenderer(color) {
    
    const renderer = new THREE.WebGLRenderer();

    renderer.setClearColor(color);

    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("webgl-output").appendChild(renderer.domElement);

    return renderer;
}