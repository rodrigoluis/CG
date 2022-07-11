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

// handle resize
window.addEventListener('resize', function(){ onResize() })

//----------------------------------------------------------------------------
// Handle arToolkitSource
let arToolkitSource = null;
setSource('image','../assets/AR/kanjiScene.jpg')

//----------------------------------------------------------------------------
// initialize arToolkitContext
var arToolkitContext = new ARjs.Context({
	cameraParametersUrl: '../libs/AR/data/camera_para.dat',
	detectionMode: 'mono',
})

// initialize it
arToolkitContext.init(function onCompleted(){
	camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
})

//----------------------------------------------------------------------------
// Create a ArMarkerControls
let markerControls;
markerControls = new ARjs.MarkerControls(arToolkitContext, camera, {	
	type : 'pattern',
	patternUrl : '../libs/AR/data/patt.kanji',
	changeMatrixMode: 'cameraTransformMatrix' // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
})
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false

//----------------------------------------------------------------------------
// Adding object to the scene
createTeapot();
createInterface();

// Render the whole thing on the page
render();

function render()
{
   updateAR();      
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

function updateAR()
{
	if( arToolkitSource.ready === false )	return
	arToolkitContext.update( arToolkitSource.domElement )
	scene.visible = camera.visible   
}

function createTeapot()
{
   // Teapot
   let objColor = "rgb(255,20,20)"; // Define the color of the object
   let objShininess = 200;          // Define the shininess of the object

   let geometry = new TeapotGeometry(0.5);
   let material = new THREE.MeshPhongMaterial({color: objColor, shininess: objShininess});
      material.side = THREE.DoubleSide;
   let obj = new THREE.Mesh(geometry, material);
      obj.castShadow = true;
      obj.position.set(0.0, 0.5, 0.0);
   scene.add(obj);
}

function setSource(type, url)
{
   if(arToolkitSource) arToolkitSource = null
   arToolkitSource = new ARjs.Source({	
	   sourceType : type,
      sourceUrl : url,
   })
   arToolkitSource.init(function onReady(){
      setTimeout(() => {
         onResize()
      }, 100);
   })
}

function createInterface()
{
   var controls = new function ()
   {
      this.source = "Image";
      this.onChangeSource = function()
      {
        //deletePreviousSource()
        switch (this.source)
        {
           case 'Image':
              setSource('image','../assets/AR/kanjiScene.jpg')
              break;
           case 'Video':
              setSource('video','../assets/AR/kanjiScene.mp4')         
              break;
           case 'Camera':
              setSource('webcam',null)                     
              break;
        }
      };
   };
  
   var gui = new GUI();
   gui.add(controls, 'source', ['Image', 'Video', 'Camera'])
   .name("Source")
   .onChange(function(e) { controls.onChangeSource(); });
}

function onResize(){
	arToolkitSource.onResizeElement()
	arToolkitSource.copyElementSizeTo(renderer.domElement)
	if( arToolkitContext.arController !== null ){
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
	}
}