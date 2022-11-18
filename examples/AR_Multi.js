import * as THREE from 'three';
import {initDefaultBasicLight} from "../libs/util/util.js";
import {ARjs}    from  '../libs/AR/ar.js';
import { initAR,
         createSourceChangerInterface} from "../libs/util/utilAR.js"

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
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Set AR Stuff
let AR = {
   source: null,
   context: null,
}
initAR(AR, renderer);
setARStuff();
createSourceChangerInterface('../assets/AR/multiScene.jpg','../assets/AR/multiScene.webm', 'webcam')
render();

function render()
{
   updateAR();      
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
      // copy projection matrix to camera
      camera.projectionMatrix.copy( AR.context.getProjectionMatrix() );
   })
   
   //----------------------------------------------------------------------------
   // Create a ArMarkerControls
	let patternArray = ["a", "b", "c", "d", "f", "g"];
	let colorArray   = [0xff0000, 0xff8800, 0xffff00, 0x00cc00, 0x0000ff, 0xcc00ff];
   let markerControls;
	for (let i = 0; i < 6; i++)
	{
		let markerObject = new THREE.Object3D();
		scene.add(markerObject);
		markerControls = new ARjs.MarkerControls(AR.context, markerObject, {
			type : 'pattern', 
         patternUrl : "../libs/AR/data/multi/patt." + patternArray[i],
		});
	
      let side = 1.25;
		let mesh = new THREE.Mesh( 
			new THREE.BoxGeometry(side, side, side), 
			new THREE.MeshLambertMaterial({
            color:colorArray[i], 
            transparent:true, 
            opacity:0.8})     // Main color of the object
         );
		mesh.position.y = side/2;
		markerObject.add( mesh );
	} 
}