import * as THREE from '../build/three.module.js';
import {GUI} from '../build/jsm/libs/dat.gui.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import {initRenderer, 
        initDefaultSpotlight, 
        createGroundPlane,
        degreesToRadians,
        getMaxSize,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var clock = new THREE.Clock();
var stats = new Stats();          // To show FPS information
var light = initDefaultSpotlight(scene, new THREE.Vector3(2, 4, 2)); // Use default light

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(2.8, 1.8, 4.0);
  camera.up.set( 0, 1, 0 );

// Control the appearence of first object loaded
var firstRender = false;

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );
  trackballControls.target = new THREE.Vector3(0, 1.0, 0);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(5.0, 5.0, 60, 60, "rgb(100,140,90)");
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 2 );
  axesHelper.visible = false;
scene.add( axesHelper );

//----------------------------------------------------------------------------
var man = null;
var playAction = false;
var time = 0;
var mixer = new Array();

//----------------------------------------------------------------------------
//-- AUDIO STUFF -------------------------------------------------------------

//-------------------------------------------------------
// Create a listener and add it to que camera
var firstPlay = true;
var listener = new THREE.AudioListener();
  camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );  

// Create ambient sound
var audioLoader = new THREE.AudioLoader();
audioLoader.load( '../assets/sounds/sampleMusic.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	//sound.play(); // Will play when start button is pressed
});

//-- Create windmill sound ---------------------------------------------------       
const windmillSound = new THREE.PositionalAudio( listener );
audioLoader.load( '../assets/sounds/sampleSound.ogg', function ( buffer ) {
  windmillSound.setBuffer( buffer );
  windmillSound.setLoop( true );
  //sound1.play(); // Will play when start button is pressed
} ); // Will be added to the target object

//-- END OF AUDIO STUFF -------------------------------------------------------

// Load animated files
loadGLTFFile('../assets/objects/windmill/','scene.gltf', true, windmillSound);
loadGLTFFile('../assets/objects/walkingMan/','scene.gltf', false);

buildInterface();
render();

function loadGLTFFile(modelPath, modelName, centerObject, sound = null)
{
  var loader = new GLTFLoader( );
  loader.load( modelPath + modelName, function ( gltf ) {
    var obj = gltf.scene;
    obj.traverse( function ( child ) {
      if ( child ) {
          child.castShadow = true;
      }
    });
    obj.traverse( function( node )
    {
      if( node.material ) node.material.side = THREE.DoubleSide;
    });

    // Only fix the position of the windmill
    if(centerObject)
    {
        obj = normalizeAndRescale(obj, 2);
        obj = fixPosition(obj);
        obj.add( sound ); // Add sound to windmill
    }
    else {
      man = obj;
      rotateMan(0);
    }
    scene.add ( obj );

    // Create animationMixer and push it in the array of mixers
    var mixerLocal = new THREE.AnimationMixer(obj);
    mixerLocal.clipAction( gltf.animations[0] ).play();
    mixer.push(mixerLocal);

    return obj;
    }, onProgress, onError);
}

function onError() { };

function onProgress ( xhr, model ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
    }
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

// Function to rotate the man around the center object
function rotateMan(delta)
{
  if(man)
  {
    time+=delta*25;

    var mat4 = new THREE.Matrix4();
    var scale = 0.4;
    man.matrixAutoUpdate = false;
    man.matrix.identity();  // reset matrix
    man.matrix.multiply(mat4.makeRotationY(degreesToRadians(-time)));
    man.matrix.multiply(mat4.makeTranslation(2.0, 0.0, 0.0));
    man.matrix.multiply(mat4.makeScale(scale, scale, scale));
  }
}

function buildInterface()
{
  // Interface
  var controls = new function ()
  {
    this.playMusic = true;
    this.playWindmill = true;    
    this.onPlayAnimation = function(){
      if(firstPlay) 
      { // Execute only once
        playAction = !playAction;        
        sound.play();
        windmillSound.play();
        firstPlay = false;
      }
    };    
    this.onPlayMusic = function(){
      if(this.playMusic)
        sound.play();
      else
        sound.pause();
     };
     this.onPlayWindmill = function(){
      if(this.playWindmill)
        windmillSound.play();
      else
        windmillSound.pause();
     };     
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'onPlayAnimation').name("START");  
  gui.add(controls, 'playMusic', true)
  .name("Play Music")
  .onChange(function(e) { controls.onPlayMusic() });
  gui.add(controls, 'playWindmill', true)
  .name("Play Windmill Sound")
  .onChange(function(e) { controls.onPlayWindmill() });

}

function render()
{
  stats.update();
  var delta = clock.getDelta(); // Get the seconds passed since the time 'oldTime' was set and sets 'oldTime' to the current time.
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);

  // Animation control
  if (playAction)
  {
    for(var i = 0; i<mixer.length; i++)
      mixer[i].update( delta );
    rotateMan(delta);
  }
}