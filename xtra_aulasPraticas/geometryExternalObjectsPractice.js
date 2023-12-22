import * as THREE from  'three';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {initRenderer, 
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
let light = initDefaultBasicLight(scene, true); // Use default light
    light.position.copy(new THREE.Vector3(10, 20, 10));

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(15.0, 15.0, 80, 80); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

//---------------------------------------------------------
// Load external objects

let loader = new GLTFLoader( );
loader.load('../assets/objects/TocoToucan.gltf', 
            function ( gltf ) 
{
  let obj = gltf.scene;
  obj.traverse( function ( child ) {
    if ( child ) {
        child.castShadow = true;
    }
  });
  scene.add ( obj );
}, null, null);

render();

function render()
{
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
