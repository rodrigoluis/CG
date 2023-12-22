import * as THREE from  'three';
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
		initCamera,
		onWindowResize,
   	initDefaultBasicLight,
      createGroundPlaneXZ} from "../libs/util/util.js";

let scene = new THREE.Scene();
let camera = initCamera(new THREE.Vector3(5, 8, 10)); // Init camera in this position
let renderer = initRenderer(); 
	renderer.setClearColor(new THREE.Color("lightslategray"));
initDefaultBasicLight(scene, new THREE.Vector3(20, 40, 20)); // Use default light
let orbitcontrols = new OrbitControls (camera, renderer.domElement);
    orbitcontrols.target.set(0, 3.5, 0);
    orbitcontrols.update();
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// create the ground plane
var floor  = new THREE.TextureLoader().load('../assets/textures/floor-wood.jpg');
let plane = createGroundPlaneXZ(50, 50)
   plane.matrix.multiply(new THREE.Matrix4().makeTranslation(0.0, -3.5, 0.0)); // T1   
   plane.material.map = floor;
scene.add(plane);

// Create main object
let geom = new THREE.SphereGeometry(3, 64, 64);
let texLoader = new THREE.TextureLoader();
let colormap  = texLoader.load("../assets/textures/displacement/rockWall.jpg");
let normalmap = texLoader.load("../assets/textures/displacement/rockWall_Normal.jpg");
let dispmap   = texLoader.load("../assets/textures/displacement/rockWall_Height.jpg");

let material = new THREE.MeshPhongMaterial({
	map: colormap,
	normalMap: normalmap,
	displacementMap: dispmap,
	displacementScale: 0.2,
});

let repu = 4, repv = 3;
material.map.repeat.set(repu,repv);
material.displacementMap.repeat.set(repu,repv);
material.normalMap.repeat.set(repu,repv);

material.map.wrapS = material.displacementMap.wrapS = material.normalMap.wrapS = THREE.RepeatWrapping;
material.map.wrapT = material.displacementMap.wrapT = material.normalMap.wrapT = THREE.RepeatWrapping;	

let mesh = new THREE.Mesh(geom, material);
mesh.position.y = 3.3;
mesh.castShadow = true;
scene.add(mesh);
render();

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}