import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import {ARjs}    from  '../libs/AR/ar.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {InfoBox,
		initDefaultSpotlight} from "../libs/util/util.js";

// init scene and camera
var scene	= new THREE.Scene();
var camera = new THREE.Camera();
scene.add(camera);
var renderer	= new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.shadowMap.enabled = true;
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 1280, 960 ); // Change here to render in low resolution (for example 640 x 480)
	document.body.appendChild( renderer.domElement );

var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light

// array of functions for the rendering loop
var onRenderFcts= [];

// Show text information onscreen
showInformation();

//----------------------------------------------------------------------------
// Handle arToolkitSource
// More info: https://ar-js-org.github.io/AR.js-Docs/marker-based/
//var arToolkitSource = new THREEx.ArToolkitSource({
var arToolkitSource = new ARjs.Source({	
	// to read from the webcam
	sourceType : 'webcam',

	// to read from an image
	//sourceType : 'image',
	//sourceUrl : '../assets/AR/kanjiScene.jpg',

	// to read from a video
	// sourceType : 'video',
	// sourceUrl : '../assets/AR/kanjiScene.mp4'
})

arToolkitSource.init(function onReady(){
	setTimeout(() => {
		onResize()
	}, 2000);
})

// handle resize
window.addEventListener('resize', function(){
	onResize()
})

function onResize(){
	arToolkitSource.onResizeElement()
	arToolkitSource.copyElementSizeTo(renderer.domElement)
	if( arToolkitContext.arController !== null ){
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
	}
}

//----------------------------------------------------------------------------
// initialize arToolkitContext
//
// create atToolkitContext
//var arToolkitContext = new THREEx.ArToolkitContext({
var arToolkitContext = new ARjs.Context({
	cameraParametersUrl: '../libs/AR/data/camera_para.dat',
	detectionMode: 'mono',
})

// initialize it
arToolkitContext.init(function onCompleted(){
	// copy projection matrix to camera
	camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
})

// update artoolkit on every frame
onRenderFcts.push(function(){
	if( arToolkitSource.ready === false )	return
	arToolkitContext.update( arToolkitSource.domElement )
	// update scene.visible if the marker is seen
	scene.visible = camera.visible
})

//----------------------------------------------------------------------------
// Create a ArMarkerControls
//
// init controls for camera
//var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
var markerControls = new ARjs.MarkerControls(arToolkitContext, camera, {	
	type : 'pattern',
	patternUrl : '../libs/AR/data/patt.kanji',
	changeMatrixMode: 'cameraTransformMatrix' // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
})
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false

//----------------------------------------------------------------------------
// Adding object to the scene

// add a torus knot
var cubeKnot = new THREE.Object3D();
createCubeKnot();
scene.add( cubeKnot );

var tea = new THREE.Object3D();
createTeapot();
scene.add( tea );

// controls which object should be rendered
var firstObject = true;

var controls = new function ()
{
	this.onChangeObject = function(){
		firstObject = !firstObject;
		if(firstObject) {
			cubeKnot.visible = true;
			tea.visible = false;
		}
		else {
			cubeKnot.visible = false;
			tea.visible = true;
		}
	};
};

// GUI interface

var gui = new GUI();
gui.add(controls, 'onChangeObject').name("Change Object");

//----------------------------------------------------------------------------
// Render the whole thing on the page

// render the scene
onRenderFcts.push(function(){
	renderer.render( scene, camera );
})

function createTeapot()
{
	var textureLoader = new THREE.TextureLoader();
	var glass  = textureLoader.load('../assets/textures/granite.png');
	glass.mapping = THREE.EquirectangularReflectionMapping; // Reflection as default
	glass.encoding = THREE.sRGBEncoding;

	// Create the main object (teapot)
	var geometry = new TeapotGeometry(0.5);
	var material = new THREE.MeshLambertMaterial({color:"rgb(255,255,255)", envMap:glass, refractionRatio: 0.95 });
	  material.side = THREE.DoubleSide;
	var obj = new THREE.Mesh(geometry, material);
	  obj.position.set(0.0, 0.5, 0.0);

	  tea.add(obj);
	tea.visible = false;
}

function createCubeKnot()
{
	var geometry	= new THREE.BoxGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= geometry.parameters.height/2
	cubeKnot.add( mesh );

	var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
	var material	= new THREE.MeshNormalMaterial();
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= 0.5
	cubeKnot.add( mesh );

	onRenderFcts.push(function(delta){
		mesh.rotation.x += Math.PI*delta
	})
}

function showInformation()
{
	// Use this to show information onscreen
	controls = new InfoBox();
		controls.add("Augmented Reality - Basic Example");
		controls.addParagraph();
		controls.add("Put the 'KANJI' marker in front of the camera.");
		controls.show();
}

// run the rendering loop
requestAnimationFrame(function animate(nowMsec)
{
	var lastTimeMsec= null;	
	// keep looping
	requestAnimationFrame( animate );
	// measure time
	lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
	var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
	lastTimeMsec	= nowMsec
	// call each update function
	onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(deltaMsec/1000, nowMsec/1000)
	})
})
