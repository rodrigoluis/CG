import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
		initCamera,
		onWindowResize,
		lightFollowingCamera,
		initDefaultSpotlight} from "../libs/util/util.js";

let scene = new THREE.Scene();
let camera = initCamera(new THREE.Vector3(0, 0, 45)); // Init camera in this position
let renderer = initRenderer(); 
	renderer.setClearColor(new THREE.Color("lightslategray"));
let light = initDefaultSpotlight(scene, camera.position);
let orbitcontrols = new OrbitControls (camera, renderer.domElement);
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Create main object
let geom = new THREE.CylinderGeometry(10, 10, 20, 200, 200, true);
let colormap = 	new THREE.TextureLoader().load("../assets/textures/displacement/Stylized_blocks_001_basecolor.jpg");
let normalmap = new THREE.TextureLoader().load("../assets/textures/displacement/Stylized_blocks_001_normal.jpg");
let dispmap = 	new THREE.TextureLoader().load("../assets/textures/displacement/Stylized_blocks_001_height.png");

let mat = new THREE.MeshStandardMaterial({
	side: THREE.DoubleSide,
	color:"white",
	map: colormap,
	normalMap: normalmap,
	displacementMap: dispmap,
	displacementScale: 1,
});
mat.normalScale.set(0.7, 0.7);

let mesh = new THREE.Mesh(geom, mat);
scene.add(mesh);
setTextureOptions(mesh.material, 3, 0.7); // Set repeat and wrapping modes

// setup the control gui
buildInterface()
render();

//-- Functions ------------------------------------------------------
function setTextureOptions(material, repu, repv){
	material.map.repeat.set(repu,repv);
	material.displacementMap.repeat.set(repu,repv);
	material.normalMap.repeat.set(repu,repv);
	
	material.map.wrapS = material.displacementMap.wrapS = material.normalMap.wrapS = THREE.RepeatWrapping;
	material.map.wrapT = material.displacementMap.wrapT = material.normalMap.wrapT = THREE.RepeatWrapping;	
}

function buildInterface() {
	let controls = new function () {
		this.normalScale = 0.7;
		this.updateBump = function (e) {
			mesh.material.normalScale.set(e, e);
		}
	};	
	let gui = new GUI();
	gui.add( mesh.material, "displacementScale" ).min( 0 ).max( 3.0 ).onChange( function ( value ) {
		mesh.material.displacementScale = value;
	} ).name("Displacement Scale");
	gui.add(controls, "normalScale", 0.0,1.0)
		.onChange(controls.updateBump)
		.name("Normal Scale");
}

function render() {
	lightFollowingCamera(light, camera);
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}