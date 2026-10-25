import * as THREE from 'three';
import {GLSL3} from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    onWindowResize
} from '../libs/util/util.js';
import {loadShaders} from '../libs/util/utilShaders.js';

let scene, renderer, camera, light, orbit;

scene = new THREE.Scene();
scene.background = new THREE.Color(0.72, 0.84, 0.95);

renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 0, 3));
camera.lookAt(0, 0.7, 0);

window.addEventListener('resize', () => {
    onWindowResize(camera, renderer);
}, false);

light = initDefaultBasicLight(scene, true, new THREE.Vector3(10, 15, 10));
orbit = new OrbitControls(camera, renderer.domElement);

//------------------------------------------------------------------------------------------
const { vertexShader, fragmentShader } = await loadShaders(
   '../assets/shaders/basic/',
   'basic.vert',
   'basic.frag'
);

const material = new THREE.ShaderMaterial({
   vertexShader, 
   fragmentShader, 
   side: THREE.DoubleSide,
   glslVersion: GLSL3,   
});

const geometry = new THREE.BufferGeometry();
geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([
         0.0,  1.0, 0.0,
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0
    ], 3)
);

const triangle = new THREE.Mesh(geometry, material);
scene.add(triangle);
//------------------------------------------------------------------------------------------

render();

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
