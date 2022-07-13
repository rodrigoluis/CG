import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import {ARjs}    from  '../libs/AR/ar.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initDefaultSpotlight} from "../libs/util/util.js";

// init scene and camera
let scene, camera, renderer, light;
renderer	= new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.shadowMap.enabled = true;
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 1280, 960 ); // Change here to render in low resolution (for example 640 x 480)
	document.body.appendChild( renderer.domElement );
scene	= new THREE.Scene();
camera = new THREE.Camera();
   scene.add(camera);
light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light

// Set AR Stuff
let AR = {
   source: null,
   context: null,
}
setARStuff();

window.addEventListener('resize', function(){ onResize() })

//----------------------------------------------------------------------------
// Adding object to the scene
let sceneObjects = {
   teapot: null,
   cube: null,
   torus: null
}

createCubeKnot();
createTeapot();

scene.add(sceneObjects.teapot);
scene.add(sceneObjects.cube);
scene.add(sceneObjects.torus);

createInterface();

//----------------------------------------------------------------------------
// Render the whole thing on the page
render();

function render()
{
   updateAR();      
   animateObject();
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

function updateAR()
{
   if(AR.source)
   {
      if( AR.source.ready === false )	return
      AR.context.update( AR.source.domElement )
      scene.visible = camera.visible   
   }
}

function animateObject()
{
   sceneObjects.torus.rotation.x += Math.PI*0.01
}

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
   obj.visible = false;

   sceneObjects.teapot = obj;
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

   sceneObjects.cube = mesh;

	var geometry	= new THREE.TorusKnotGeometry(0.25,0.1,64,16);
	var material	= new THREE.MeshNormalMaterial();
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= 0.5
   
   sceneObjects.torus = mesh;
}

function createInterface()
{
   // controls which object should be rendered
   var firstObject = true;

   var controls = new function ()
   {
      this.onChangeObject = function(){
         firstObject = !firstObject;
         if(firstObject) {
            sceneObjects.teapot.visible = false;
            sceneObjects.cube.visible = true;            
            sceneObjects.torus.visible = true;                        
         }
         else {
            sceneObjects.teapot.visible = true;
            sceneObjects.cube.visible = false;            
            sceneObjects.torus.visible = false;                        
         }
      };
   };
   // GUI interface
   var gui = new GUI();
   gui.add(controls, 'onChangeObject').name("Change Object");
}

function onResize(){
	AR.source.onResizeElement()
	AR.source.copyElementSizeTo(renderer.domElement)
	if( AR.context.arController !== null ){
		AR.source.copyElementSizeTo(AR.context.arController.canvas)
	}
}

function setARStuff()
{
   //----------------------------------------------------------------------------
   // Handle arToolkitSource
   // More info: https://ar-js-org.github.io/AR.js-Docs/marker-based/
   AR.source = new ARjs.Source({	
      // to read from a video
      sourceType : 'video',
      sourceUrl : '../assets/AR/kanjiScene.mp4'

      // to read from the webcam
      //sourceType : 'webcam',
   
      // to read from an image
      // sourceType : 'image',
      // sourceUrl : '../assets/AR/kanjiScene.jpg',
   
   })
   
   AR.source.init(function onReady(){
      setTimeout(() => {
         onResize()
      }, 100);
   })
   
   //----------------------------------------------------------------------------
   // initialize arToolkitContext
   AR.context = new ARjs.Context({
      cameraParametersUrl: '../libs/AR/data/camera_para.dat',
      detectionMode: 'mono',
   })
   
   // initialize it
   AR.context.init(function onCompleted(){
      // copy projection matrix to camera
      camera.projectionMatrix.copy( AR.context.getProjectionMatrix() );
   })
   
   //----------------------------------------------------------------------------
   // Create a ArMarkerControls
   var markerControls = new ARjs.MarkerControls(AR.context, camera, {	
      type : 'pattern',
      patternUrl : '../libs/AR/data/patt.kanji',
      changeMatrixMode: 'cameraTransformMatrix' // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
   })
   // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
   scene.visible = false   
}