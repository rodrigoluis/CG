/*
Based on the following example:
http://jyunming-chen.github.io/tutsplus/tutsplus28.html
*/

import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
		initCamera,
		onWindowResize,
		lightFollowingCamera,
		initDefaultSpotlight} from "../libs/util/util.js";

let scene = new THREE.Scene();
let camera = initCamera(new THREE.Vector3(0, 12, 45)); // Init camera in this position
let renderer = initRenderer(); 
	renderer.setClearColor(new THREE.Color("rgb(200, 200, 240)"));
let light = initDefaultSpotlight(scene, camera.position);
let orbitcontrols = new OrbitControls (camera, renderer.domElement);
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let sphereLightMesh;
let pointLight;
let invert = 1;
let phase = 0;
let lightAnimation = true;

let textureFile = "../assets/textures/plaster.jpg"
let normalMapFile = "../assets/textures/plaster_normal.jpg"
let floorFile = "../assets/textures/floor-wood.jpg";

// Create boxes with and without normal map
var box = createMesh(new THREE.BoxGeometry(15, 15, 15), textureFile);
box.rotation.y = -0.5;
box.position.x = 14;
box.castShadow = true;
scene.add(box);

var boxNormal = createMesh(new THREE.BoxGeometry(15, 15, 15), textureFile, normalMapFile);
boxNormal.rotation.y = 0.5;
boxNormal.position.x = -14;
boxNormal.castShadow = true;
scene.add(boxNormal);

var floorTex = new THREE.TextureLoader().load(floorFile)
var plane = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 0.1, 30), new THREE.MeshPhongMaterial({color: 0x3c3c3c, map: floorTex}));
	plane.receiveShadow = true;
plane.position.y = -7.5;
plane.rotation.x = -0.5 * Math.PI;
scene.add(plane);

pointLight = new THREE.PointLight("#ff5808");
pointLight.castShadow = true;
scene.add(pointLight);

// add a small sphere simulating the pointlight
var sphereLight = new THREE.SphereGeometry(0.2);
var sphereLightMaterial = new THREE.MeshBasicMaterial({color: 0xac6c25});
sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
	sphereLightMesh.castShadow = true;
scene.add(sphereLightMesh);

// setup the control gui
buildInterface()
render();

function buildInterface() {
	let controls = new function () {
		this.normalScale = 1;
		this.light = true;
		this.updateBump = function (e) {
			boxNormal.material.normalScale.set(e, e);
		}
		this.lightAnimationFunc = function (par) {
			lightAnimation = par;
		}		
	};	
	let gui = new GUI();
	gui.add(controls, "normalScale", 0,1)
		.onChange(controls.updateBump)
		.name("Normal Scale");
	gui.add(controls, "light", true)
		.onChange(controls.lightAnimationFunc)
		.name("Light Animation");
}

function createMesh(geom, imageFile, normal) {
	let nmap = (normal ? new THREE.TextureLoader().load(normal) : null);
	var tex = new THREE.TextureLoader().load(imageFile);
	var mat = new THREE.MeshPhongMaterial({
		map: tex,
		normalMap: nmap,
	});
	var mesh = new THREE.Mesh(geom, mat);
	return mesh;
}

function updateLightPosition() {
	if (phase > 2 * Math.PI) {
		invert = invert * -1;
		phase -= 2 * Math.PI;
	} else {
		phase += 0.03;
	}
	sphereLightMesh.position.z = +(21 * (Math.sin(phase)));
	sphereLightMesh.position.x = -14 + (14 * (Math.cos(phase)));
	if (invert < 0) {
		var pivot = 0;
		sphereLightMesh.position.x = (invert * (sphereLightMesh.position.x - pivot)) + pivot;
	}
	pointLight.position.copy ( sphereLightMesh.position );		
}

function render() {
	if(lightAnimation) updateLightPosition();
	lightFollowingCamera(light, camera);
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}
