import * as THREE from  'three';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize, 
        createGroundPlaneXZ} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(5, 7, 10)); // Init camera in this position
initDefaultBasicLight(scene);

var material = new THREE.MeshLambertMaterial({color:"rgb(200,0,0)"});

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
// var axesHelper = new THREE.AxesHelper( 12 );
// scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube

var peGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 20, 20);
criaPe(peGeo, material,  5,  2.5)
criaPe(peGeo, material,  5, -2.5)
criaPe(peGeo, material, -5, -2.5)
criaPe(peGeo, material, -5,  2.5)

var cube = new THREE.BoxGeometry(1,1,1);
var tampa = new THREE.Mesh(cube, material);
   tampa.scale.set(11, 0.3, 6)
   tampa.translateY(3)
scene.add(tampa);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

render();

function criaPe(geo, mat, x, z)
{
   let pe = new THREE.Mesh(geo, mat);
   pe.translateX(x)
   pe.translateZ(z) 
   pe.translateY(1.5)  
   scene.add(pe);
}

function render()
{
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
