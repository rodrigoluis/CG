import * as THREE 			from  'three';
import {RaytracingRenderer} from '../libs/other/raytracingRenderer.js';

var scene, renderer;

var container = document.createElement('div');
document.body.appendChild(container);

var scene = new THREE.Scene();

// The canvas is in the XY plane.
// Hint: put the camera in the positive side of the Z axis and the
// objects in the negative side
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 3;
camera.position.y = 1.5;

// light
var intensity = 0.5;
var light = new THREE.PointLight(0xffffff, intensity);
light.position.set(0, 2.50, 0);
scene.add(light);

var light = new THREE.PointLight(0x55aaff, intensity);
light.position.set(-1.00, 1.50, 2.00);
scene.add(light);

var light = new THREE.PointLight(0xffffff, intensity);
light.position.set(1.00, 1.50, 2.00);
scene.add(light);

renderer = new RaytracingRenderer(window.innerWidth, window.innerHeight, 32, camera);
container.appendChild(renderer.domElement);

createObjects();
createRoom();
render();

function createObjects() {
	var cylinderMaterial = new THREE.MeshPhongMaterial({
		color: "rgb(150,190,220)",
		specular: "rgb(255,255,255)",
		shininess: 1000,
	});

	var cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.00, 80);

	// Cylinders
	var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
	cylinder.position.set(-2.0, 0.5, -1.0);
	scene.add(cylinder);

	cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
	cylinder.position.set(0.0, 0.5, -2.0);
	scene.add(cylinder);

	cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
	cylinder.position.set(2.0, 0.5, -1.0);
	scene.add(cylinder);

	//-- Knot Geometry --------------------------------------------------------------------
	var knotGeometry = new THREE.TorusKnotGeometry(.2, .06, 30, 30);

	var mirrorMaterialSmooth = new THREE.MeshPhongMaterial({
		color: "rgb(255,170,0)",
		specular: "rgb(34,34,34)",
		shininess: 10000,
	});
	mirrorMaterialSmooth.mirror = true;
	mirrorMaterialSmooth.reflectivity = 0.5;

	var knot = new THREE.Mesh(knotGeometry, mirrorMaterialSmooth);
	knot.position.set(-2.0, 1.35, -1);
	scene.add(knot);

	//-- Mirror Sphere --------------------------------------------------------------------
	var mirrorMaterial = new THREE.MeshPhongMaterial({
		color: "rgb(0,0,0)",
		specular: "rgb(255,255,255)",
		shininess: 1000,
	});
	mirrorMaterial.mirror = true;
	mirrorMaterial.reflectivity = 1;

	var sphereGeometry = new THREE.SphereGeometry(.5, 16, 16);
	var sphere = new THREE.Mesh(sphereGeometry, mirrorMaterial);
	sphere.position.set(0.0, 1.5, -2.0);
	sphere.rotation.y = 1.30;
	scene.add(sphere);

	//-- Vase --------------------------------------------------------------------

	mirrorMaterialSmooth = new THREE.MeshPhongMaterial({
		color: "rgb(255,0,0)",
		specular: "rgb(155,155,155)",
		shininess: 1000,
	});
	mirrorMaterialSmooth.mirror = true;
	mirrorMaterialSmooth.reflectivity = 0.1;

	cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.2, .8, 80);

	// Cylinders
	cylinder = new THREE.Mesh(cylinderGeometry, mirrorMaterialSmooth);
	cylinder.position.set(2.0, 1.4, -1.0);
	scene.add(cylinder);


}

function createRoom() {
	// materials
	var materialBox = new THREE.MeshLambertMaterial({ color: "rgb(255,255,255)" });
	var materialBoxSides = new THREE.MeshLambertMaterial({ color: "rgb(100,100,255)" });

	// top, bottom walls
	// bottom
	var planeGeometry = new THREE.BoxGeometry(6.00, 0.05, 4.00);
	var plane = new THREE.Mesh(planeGeometry, materialBox);
	plane.position.set(0, 0.0, -2.00);
	scene.add(plane);

	// top
	plane = new THREE.Mesh(planeGeometry, materialBox);
	plane.position.set(0, 3.0, -2.00);
	scene.add(plane);

	// left and right walls
	var sidesGeometry = new THREE.BoxGeometry(0.05, 3.00, 4.00);
	var leftPlane = new THREE.Mesh(sidesGeometry, materialBoxSides);
	leftPlane.position.set(-3.00, 1.50, -2.00)
	scene.add(leftPlane);

	// right
	var rightPlane = new THREE.Mesh(sidesGeometry, materialBoxSides);
	rightPlane.position.set(3.00, 1.50, -2.00)
	scene.add(rightPlane);

	var backGeometry = new THREE.BoxGeometry(6.0, 3.00, 0.05);
	var backPlane = new THREE.Mesh(backGeometry, materialBox);
	backPlane.position.set(0, 1.50, -4.00);
	scene.add(backPlane);
}

function render() {
	renderer.render(scene, camera);
}
