import * as THREE from 'three';
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {ColladaLoader} from '../build/jsm/loaders/ColladaLoader.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize,
        lightFollowingCamera} from "../libs/util/util.js";

//----------------------------------------------------------------------        
let scene = new THREE.Scene();    // Create main scene
let clock = new THREE.Clock();
let renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(60, 60, 80)");
let camera = initCamera(new THREE.Vector3(15, 7, -10)); // Init camera in this position
let orbit = new OrbitControls( camera, renderer.domElement );
  orbit.target.set( 0, 2, 0 );
  orbit.update();
let light = initDefaultBasicLight(scene, true, new THREE.Vector3(1, 1, -1)) ;	
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
let mixer, r2d2, time = 0;

// // Create the loading manager
// const loadingManager = new THREE.LoadingManager( () => {
//   let loadingScreen = document.getElementById( 'loading-screen' );
//   loadingScreen.transition = 0;
//   loadingScreen.style.setProperty('--speed1', '0');  
//   loadingScreen.style.setProperty('--speed2', '0');  
//   loadingScreen.style.setProperty('--speed3', '0');      

//   let button  = document.getElementById("myBtn")
//   button.style.backgroundColor = 'Red';
//   button.innerHTML = 'Click to Enter';
//   button.addEventListener("click", onButtonPressed);  
// });

// Create the loading manager
const loadingManager = new THREE.LoadingManager( () => {
  const loadingScreen = document.getElementById( 'loading-screen' );
  loadingScreen.classList.add( 'fade-out' );
  loadingScreen.addEventListener( 'transitionend', (e) => {
    const element = e.target;
    element.remove();  
  });  
});


// Loading objects and audio
loadColladaObject(loadingManager, ' ../assets/objects/stormtrooper/stormtrooper.dae');
loadGLTFObject(loadingManager, '../assets/objects/r2d2/scene.gltf');
let gridHelper = new THREE.PolarGridHelper( 9 );
scene.add( gridHelper );

render();

//-- Functions --------------------------------------------------------
// function onButtonPressed() {
//   const loadingScreen = document.getElementById( 'loading-screen' );
//   loadingScreen.transition = 0;
//   loadingScreen.classList.add( 'fade-out' );
//   loadingScreen.addEventListener( 'transitionend', (e) => {
//     const element = e.target;
//     element.remove();  
//   });  
//   // Config and play the loaded audio
//   let sound = new THREE.Audio( new THREE.AudioListener() );
//   audioLoader.load( audioPath, function( buffer ) {
//     sound.setBuffer( buffer );
//     sound.setLoop( true );
//     sound.play(); 
//   });
// }

function loadColladaObject(manager, object)
{
  const loader = new ColladaLoader( manager );
  loader.load( object, ( collada ) => {
    const avatar = collada.scene;
    const animations = avatar.animations;
    mixer = new THREE.AnimationMixer( avatar );
    mixer.clipAction( animations[ 0 ] ).play();
    scene.add( avatar );
  } );
}

function loadGLTFObject(manager, object)
{
  var loader = new GLTFLoader( manager );
  loader.load( object, function ( gltf ) {
    r2d2 = gltf.scene;
    scene.add ( r2d2 );
    }, null, null);
}

// Function to rotate the man around the center object
function rotateR2D2(delta) {
  if(r2d2) {
    let radius = 7.0;
    let scale = 0.005;
    time+=delta*30;
    var mat4 = new THREE.Matrix4();
    r2d2.matrixAutoUpdate = false;
    r2d2.matrix.identity();  // reset matrix
    r2d2.matrix.multiply(mat4.makeRotationY(THREE.MathUtils.degToRad(-time)));
    r2d2.matrix.multiply(mat4.makeTranslation(radius, 0.0, 0.0));
    r2d2.matrix.multiply(mat4.makeScale(scale,scale,scale));
  }
}

function render() {
    const delta = clock.getDelta();
    if ( mixer !== undefined ) mixer.update( delta );
    if ( r2d2 !== undefined ) rotateR2D2( delta );

    lightFollowingCamera(light, camera) // Makes light follow the camera    
    requestAnimationFrame( render );
    renderer.render( scene, camera );
}