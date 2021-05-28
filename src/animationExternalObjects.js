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
initDefaultSpotlight(scene, new THREE.Vector3(2, 4, 2)); // Use default light

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.8, 1.8, 4.0);
  camera.up.set( 0, 1, 0 );

// Control the appearence of first object loaded
var firstRender = false;

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

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
var playAction = true;
var time = 0;
var mixer = new Array();

// Load animated files
loadGLTFFile('../assets/objects/windmill/','scene.gltf', true);
loadGLTFFile('../assets/objects/walkingMan/','scene.gltf', false);

buildInterface();
render();

function loadGLTFFile(modelPath, modelName, centerObject)
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

    // Only fix the position of the centered object
    // The man around will have a different geometric transformation
    if(centerObject)
    {
        obj = normalizeAndRescale(obj, 2);
        obj = fixPosition(obj);
    }
    else {
      man = obj;
    }
    scene.add ( obj );

    // Create animationMixer and push it in the array of mixers
    var mixerLocal = new THREE.AnimationMixer(obj);
    mixerLocal.clipAction( gltf.animations[0] ).play();
    mixer.push(mixerLocal);
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
    this.viewAxes = false;
    this.onPlayAnimation = function(){
      playAction = !playAction;
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'onPlayAnimation').name("Play / Stop Anim.");
  gui.add(controls, 'viewAxes', false)
  .name("View Axes")
  .onChange(function(e) { controls.onViewAxes() });
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