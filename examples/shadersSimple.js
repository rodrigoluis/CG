import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    onWindowResize
} from '../libs/util/util.js';

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
const [vertexShader, fragmentShader] = await Promise.all([
   fetch('../assets/shaders/simple/simple.vert').then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar o vertex shader');
      return response.text();
   }),
   fetch('../assets/shaders/simple/simple.frag').then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar o fragment shader');
      return response.text();
   })
]);
const material = new THREE.ShaderMaterial({
   vertexShader, 
   fragmentShader, 
   side: THREE.DoubleSide});

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
