import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {ColladaLoader} from '../build/jsm/loaders/ColladaLoader.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize,
        degreesToRadians,
        lightFollowingCamera} from "../libs/util/util.js";

//----------------------------------------------------------------------        
let scene = new THREE.Scene();    // Create main scene
let stats = new Stats();          // To show FPS information
let clock = new THREE.Clock();
let renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(60, 60, 80)");
let camera = initCamera(new THREE.Vector3(15, 7, -10)); // Init camera in this position
let orbit = new OrbitControls( camera, renderer.domElement );
  orbit.target.set( 0, 2, 0 );
  orbit.update();
let light = initDefaultBasicLight(scene, true, new THREE.Vector3(1, 1, -1)) ;	
window.addEventListener( 'resize', onWindowResize, false );
let mixer1, mixer2, man, manScale = 2, time = 0;

const gridHelper = new THREE.PolarGridHelper( 8, 16 );
scene.add( gridHelper );

// Create the loading manager
const loadingManager = new THREE.LoadingManager( () => {
  const loadingScreen = document.getElementById( 'loading-screen' );
  loadingScreen.classList.add( 'fade-out' );
  loadingScreen.addEventListener( 'transitionend', (e) => {
    const element = e.target;
    element.remove();  
  });  
});

// Loading animated objects passing the manager as a parameter
loadColladaObject(loadingManager, ' ../assets/objects/stormtrooper/stormtrooper.dae');
loadGLTFObject(loadingManager, '../assets/objects/walkingMan/scene.gltf');

render();

function loadColladaObject(manager, object)
{
  // Create the first object that will use de loadingManager
  const loader = new ColladaLoader( manager );
  loader.load( object, ( collada ) => {
    const avatar = collada.scene;
    const animations = avatar.animations;
    mixer1 = new THREE.AnimationMixer( avatar );
    mixer1.clipAction( animations[ 0 ] ).play();
    scene.add( avatar );
  } );
}

function loadGLTFObject(manager, object)
{
  var loader = new GLTFLoader( manager );
  loader.load( object, function ( gltf ) {
    var obj = gltf.scene;
    man = obj;
    scene.add ( obj );
    mixer2 = new THREE.AnimationMixer(obj);
    mixer2.clipAction( gltf.animations[0] ).play();
    }, null, null);
}


// Function to rotate the man around the center object
function rotateMan(delta) {
  if(man) {
    let radius = 7.0;
    time+=delta*30;
    var mat4 = new THREE.Matrix4();
    man.matrixAutoUpdate = false;
    man.matrix.identity();  // reset matrix
    man.matrix.multiply(mat4.makeRotationY(degreesToRadians(-time)));
    man.matrix.multiply(mat4.makeTranslation(radius, 0.0, 0.0));
    man.matrix.multiply(mat4.makeScale(manScale,manScale,manScale));
  }
}

function render() {
    stats.update();
    const delta = clock.getDelta();
    if ( mixer1 !== undefined ) mixer1.update( delta );
    if ( mixer2 !== undefined ) {
      mixer2.update( delta );    
      rotateMan(delta);
    }
    lightFollowingCamera(light, camera) // Makes light follow the camera    
    requestAnimationFrame( render );
    renderer.render( scene, camera );
}