import * as THREE from 'three';
import {ARjs}    from  '../libs/AR/ar.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import { initAR,
         createSourceChangerInterface} from "../libs/util/utilAR.js"
import {initDefaultSpotlight,
        initRenderer} from "../libs/util/util.js";

let scene, camera, renderer;
renderer = initRenderer();
   renderer.setClearColor(new THREE.Color('lightgrey'), 0)
   renderer.antialias = true;
scene	= new THREE.Scene();
camera = new THREE.Camera();
   scene.add(camera);
initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20), 4000); // Use default light

//----------------------------------------------------------------------------
// Set AR Stuff
let AR = {
   source: null,
   context: null,
}
initAR(AR, renderer, camera);
setARStuff();
createSourceChangerInterface('../assets/AR/kanjiScene.jpg', '../assets/AR/kanjiScene.mp4')
createTeapot();
render();

function render()
{
   updateAR();      
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

function updateAR()
{
	if( AR.source.ready === false )	return
	AR.context.update( AR.source.domElement )
	scene.visible = camera.visible   
}

function createTeapot()
{
	var textureLoader = new THREE.TextureLoader();
	var glass  = textureLoader.load('../assets/textures/glass.png');
	   glass.mapping = THREE.EquirectangularReflectionMapping; // Reflection as default
      glass.colorSpace = THREE.SRGBColorSpace;
	var geometry = new TeapotGeometry(0.5);
	var material = new THREE.MeshPhongMaterial({
      color:"rgb(255,255,255)", 
      envMap:glass, 
      refractionRatio: 0.95 });
      material.side = THREE.DoubleSide;
	var obj = new THREE.Mesh(geometry, material);
       obj.position.set(0.0, 0.5, 0.0);
   scene.add(obj);
}

function setARStuff()
{
   //----------------------------------------------------------------------------
   // initialize arToolkitContext
   AR.context = new ARjs.Context({
      cameraParametersUrl: '../libs/AR/data/camera_para.dat',
      detectionMode: 'mono',
   })

   // initialize it
   AR.context.init(function onCompleted(){
      camera.projectionMatrix.copy( AR.context.getProjectionMatrix() );
   })

   //----------------------------------------------------------------------------
   // Create a ArMarkerControls
   let markerControls;
   markerControls = new ARjs.MarkerControls(AR.context, camera, {	
      type : 'pattern',
      patternUrl : '../libs/AR/data/patt.kanji',
      changeMatrixMode: 'cameraTransformMatrix' 
   })
   // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
   scene.visible = false
}