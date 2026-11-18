import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    onWindowResize,
    initDefaultBasicLight,
} from '../libs/util/util.js';

let scene, renderer, camera, orbit, light;
scene = new THREE.Scene();
scene.background = new THREE.Color(0.72, 0.84, 0.95);
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 0, 5));
camera.lookAt(0, 0.7, 0);
light = initDefaultBasicLight(scene, true, new THREE.Vector3(7, 7, 0))
orbit = new OrbitControls(camera, renderer.domElement);
window.addEventListener('resize', () => {onWindowResize(camera, renderer);}, false);

//------------------------------------------------------------------------------------------
const uniforms = {
    uTime: { value: 0.0 },
    uAmplitude: { value: 0.1 },
    uFrequency: { value: 2.0 }
};

let material = new THREE.MeshPhongMaterial({
   color:"rgb(255,20,20)",
   shininess:"100",        
   specular:"rgb(255,255,255)",
});

material.onBeforeCompile = (shader) => {
    // Adiciona os uniforms personalizados
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmplitude = uniforms.uAmplitude;
    shader.uniforms.uFrequency = uniforms.uFrequency;

    // Declara os uniforms no Vertex Shader
    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         uniform float uAmplitude;
         uniform float uFrequency;
        `
    );

    // Modifica a posição dos vértices
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         transformed.y += sin(position.x * uFrequency 
                          + uTime) * uAmplitude;
        `
    );
};

const geometry = new THREE.SphereGeometry(1, 64, 64);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
//------------------------------------------------------------------------------------------

render();

function render() {
    requestAnimationFrame(render);
    uniforms.uTime.value += 0.016;
    renderer.render(scene, camera);
}
