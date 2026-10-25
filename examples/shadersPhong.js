import * as THREE from 'three';
import {GLSL3} from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    onWindowResize,
} from '../libs/util/util.js';
import {loadShaders} from '../libs/util/utilShaders.js';

let scene, renderer, camera, orbit;

scene = new THREE.Scene();
scene.background = new THREE.Color(0.72, 0.84, 0.95);

renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 0, 13));
camera.lookAt(0, 0.7, 0);

window.addEventListener('resize', () => {
    onWindowResize(camera, renderer);
}, false);

orbit = new OrbitControls(camera, renderer.domElement);

//------------------------------------------------------------------------------------------
const { vertexShader, fragmentShader } = await loadShaders(
   '../assets/shaders/phong/',
   'phong.vert',
   'phong.frag'
);

const phongMaterial = new THREE.ShaderMaterial({
   glslVersion: GLSL3, 
   vertexShader, 
   fragmentShader, 
   uniforms: {
      lightPosition: {
         value: new THREE.Vector3(7, 7, 25)
      },
      lightColor: {
         value: new THREE.Color("white")
      },
      objectColor: {
         value: new THREE.Color("orange")
      },
      shininess: {
         value: 32.0
      }
   }
});

let geometry = new THREE.TorusGeometry(3.0, 1.0, 40, 40);
let object = new THREE.Mesh(geometry, phongMaterial);
scene.add(object);
//-------------------------------

render();

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
