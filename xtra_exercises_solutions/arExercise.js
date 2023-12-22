import * as THREE from  '../build/three.module.js';
import {ARjs}    from  '../libs/AR/ar.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import { getMaxSize,
         initRenderer} from "../libs/util/util.js";

let renderer = initRenderer();
    renderer.setClearColor(new THREE.Color('lightgrey'), 0)
var clock = new THREE.Clock();
var scene	= new THREE.Scene();
var camera = new THREE.Camera();
scene.add(camera);

var mixer = new Array();

// array of functions for the rendering loop
var onRenderFcts= [];

//----------------------------------------------------------------------------
// Handle arToolkitSource
// More info: https://ar-js-org.github.io/AR.js-Docs/marker-based/
//var arToolkitSource = new THREEx.ArToolkitSource({
var arToolkitSource = new ARjs.Source({	
	// // to read from the webcam
	// sourceType : 'webcam',

	// // to read from an image
	//sourceType : 'image',
	//sourceUrl : '../assets/AR/kanjiScene.jpg',

	// to read from a video
	sourceType : 'video',
	sourceUrl : '../assets/AR/kanjiScene.mp4'	
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
var position = new THREE.Vector3(-5, 5, 0);
var spotLight = new THREE.SpotLight(0xffffff);
spotLight.name = "spotLight"
spotLight.position.copy(position);
spotLight.castShadow = true;
spotLight.distance = 0;    
spotLight.decay = 2;
spotLight.penumbra = 0.5;
spotLight.angle = THREE.MathUtils.degToRad(40);    
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
scene.add(spotLight);

var ambientLight = new THREE.AmbientLight(0xffffff);
ambientLight.name = "ambientLight";
scene.add(ambientLight);

loadGLTFFile('dog/', '', 1.5, 0, true);
var planeGeometry = new THREE.PlaneGeometry(2.0, 2.0, 50, 50);
var planeMaterial = new THREE.MeshLambertMaterial({
	color:"rgb(200,200,200)", 
	transparent: true,
	opacity:0.3,
	side:THREE.DoubleSide
});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
plane.rotateX(THREE.MathUtils.degToRad(90));
scene.add(plane);

//----------------------------------------------------------------------------
// Render the whole thing on the page

// render the scene
onRenderFcts.push(function(){
	renderer.render( scene, camera );
})

function onError() { };

function onProgress ( xhr, model ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
    }
}

function loadGLTFFile(modelPath, modelFolder, desiredScale, angle)
{
   var loader = new GLTFLoader( );
      loader.load( '../assets/objects/dog.glb', function ( gltf ) {      
   var obj = gltf.scene;
	obj.castShadow = true;
    obj.name = modelFolder;
    obj.traverse( function ( child ) {
      if ( child ) {
          child.castShadow = true;
      }
    });
    obj.traverse( function( node )
    {
      if( node.material ) node.material.side = THREE.DoubleSide;
    });

    var obj = normalizeAndRescale(obj, desiredScale);
    var obj = fixPosition(obj);
    obj.rotateY(THREE.MathUtils.degToRad(angle));

    scene.add ( obj );

    // Create animationMixer and push it in the array of mixers
    var mixerLocal = new THREE.AnimationMixer(obj);
    mixerLocal.clipAction( gltf.animations[0] ).play();
    mixer.push(mixerLocal);
    }, onProgress, onError);
}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale)
{
  var scale = getMaxSize(obj); // Available in 'utils.js'
  obj.scale.set(newScale * (1.0/scale),
                newScale * (1.0/scale),
                newScale * (1.0/scale));
  return obj;
}

function fixPosition(obj)
{
  // Fix position of the object over the ground plane
  var box = new THREE.Box3().setFromObject( obj );
  if(box.min.y > 0)
    obj.translateY(-box.min.y);
  else
    obj.translateY(-1*box.min.y);
  return obj;
}

// run the rendering loop
requestAnimationFrame(function animate(nowMsec)
{
	var lastTimeMsec= null;	
	var delta = clock.getDelta();

	for(var i = 0; i<mixer.length; i++)
	mixer[i].update( delta );

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
