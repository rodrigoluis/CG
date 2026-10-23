import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    onWindowResize,
    createGroundPlaneWired
} from '../libs/util/util.js';
import {loadShaders} from '../libs/util/utilShaders.js';
import Mountain from '../assets/shaders/mountain/mountain.js';

let scene, renderer, camera, light, orbit;

scene = new THREE.Scene();
scene.background = new THREE.Color(0.72, 0.84, 0.95);

renderer = initRenderer();
camera = initCamera(new THREE.Vector3(7, 5, 7));
camera.lookAt(0, 0.7, 0);

window.addEventListener('resize', () => {
    onWindowResize(camera, renderer);
}, false);

light = initDefaultBasicLight(scene, true, new THREE.Vector3(10, 15, 10));
orbit = new OrbitControls(camera, renderer.domElement);

const { vertexShader, fragmentShader } = await loadShaders(
   '../assets/shaders/mountain/',
   'mountain.vert',
   'mountain.frag'
);

const mountain = new Mountain(vertexShader, fragmentShader);
scene.add(mountain);

render();

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
