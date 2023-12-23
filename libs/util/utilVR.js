import * as THREE from '../../build/three.module.js';
import {GLTFLoader} from '../../build/jsm/loaders/GLTFLoader.js'
import { FlyControls } from '../../build/jsm/controls/FlyControls.js';
import { InfoBox, 
         getMaxSize,
         createGroundPlane,
         initDefaultBasicLight} from "../../libs/util/util.js";

function showMessages(message1, message2)
{
    // Use this to show information onscreen
    var controls = new InfoBox();
        controls.add(message1);
        if(message2) controls.add(message2);        
    controls.show();     
}

export function setFlyNonVRBehavior(camera, renderer, message1, message2 = null)
{
    let flyCamera = new FlyControls( camera, renderer.domElement );
    flyCamera.movementSpeed = 5;
    flyCamera.domElement = renderer.domElement;
    flyCamera.rollSpeed = 0.2;

    showMessages(message1, message2);
    return flyCamera;
}

export function setLookNonVRBehavior(camera, renderer, message1, message2 = null)
{
    let lookCamera = new FlyControls( camera, renderer.domElement );
    lookCamera.domElement = renderer.domElement;
    lookCamera.movementSpeed = 0; // Avoid moving
    lookCamera.rollSpeed = 0.3;

    showMessages(message1, message2);  
    return lookCamera;
}

//-- Create Scene --------------------------------------------------------------------------------
//-- Assets loaded with only with '../' because the source is on a different folder level --------
export function createVRBasicScene(scene, camera, mixer)
{
   let light = initDefaultBasicLight(scene, true, new THREE.Vector3(-100, 200, 1), 200, 2014, 0.1, 400); // 

	// Load all textures 
	var textureLoader = new THREE.TextureLoader();
		var floor 	= textureLoader.load('../assets/textures/sand.jpg');	
		var cubeTex = textureLoader.load('../assets/textures/crate.jpg');			

	// Create Ground Plane
	var groundPlane = createGroundPlane(60.0, 60.0, 100, 100, "rgb(200,200,150)");
		groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
		groundPlane.material.map = floor;		
		groundPlane.material.map.wrapS = THREE.RepeatWrapping;
		groundPlane.material.map.wrapT = THREE.RepeatWrapping;
		groundPlane.material.map.repeat.set(8,8);		
	scene.add(groundPlane);

	// Create feature cubes [size, xPos, zPos, textureName]
	createCube(scene, 3.0, -20.0, -20.0, cubeTex);
	createCube(scene,1.0, -15.0,  12.0, cubeTex);
	createCube(scene,1.0, -10.0,  -5.0, cubeTex);
	createCube(scene,1.0,  -5.0,  13.0, cubeTex);
	createCube(scene,1.0,   5.0,  10.0, cubeTex);
	createCube(scene,1.0,  10.0, -15.0, cubeTex);
	createCube(scene,1.0,  20.0, -12.0, cubeTex);
	createCube(scene,4.0,  20.0,  22.0, cubeTex);		
	createWindMill(scene, camera, mixer);
}

function createCube(scene, cubeSize, xPos, zPos, texture)
{
	var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	var cubeMaterial = new THREE.MeshLambertMaterial();
	var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.castShadow = true;
		cube.receiveShadow = true;		
		cube.position.set(xPos, cubeSize/2.0, zPos);
		cube.material.map = texture;
	scene.add(cube);	
}

function createWindMill(scene, camera, mixer)
{
	//-- Create windmill sound       
	var listener = new THREE.AudioListener();
	camera.add( listener );
	const windmillSound = new THREE.PositionalAudio( listener );
	var audioLoader = new THREE.AudioLoader();
		audioLoader.load( '../assets/sounds/sampleSound.ogg', function ( buffer ) {
		windmillSound.setBuffer( buffer );
		windmillSound.setLoop(true);
		windmillSound.play(); 
	} ); 

	// Load GLTF windmill
	var loader = new GLTFLoader( );
	loader.load( '../assets/objects/windmill.glb', function ( gltf ) {
	var obj = gltf.scene;
		obj.traverse( function ( child ) {
			if ( child ) { child.castShadow = true; }
		});
		obj = normalizeAndRescale(obj, 8);
		obj.rotateY(THREE.MathUtils.degToRad(-90));				
		obj.add( windmillSound ); // Add sound to windmill
	scene.add ( obj );

	// Create animationMixer and push it in the array of mixers
	var mixerLocal = new THREE.AnimationMixer(obj);
	mixerLocal.clipAction( gltf.animations[0] ).play();
	mixer.push(mixerLocal);
	return obj;
	}, null, null);
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
