/*
Autor: PEDRO LUIZ BONORINO BRAGA (2022.1)
*/

import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians, 
        lightFollowingCamera} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information        
var clock = new THREE.Clock();
var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 30)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(5,5,10);
  camera.up.set( 0, 1, 0 );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(40, 35); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
  groundPlane.receiveShadow = true;
scene.add(groundPlane);

var loader = new GLTFLoader();

loader.load( './assets/toonTank.glb', function ( gltf ) {
  var obj = gltf.scene;
  obj.name = 'Tank';
  obj.visible = true;
  obj.castShadow = true;
  obj.traverse( function ( child ) {
    if ( child ) {
        child.castShadow = true;
    }
  });

  scene.add ( obj );
  }, null, null);

// ====================================================================================================
render();

function render()
{
  stats.update();
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}