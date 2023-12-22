import * as THREE from  'three';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize, 
        createGroundPlaneXZ} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(5, 7, 15)); // Init camera in this position
initDefaultBasicLight(scene);

var material = new THREE.MeshLambertMaterial({color:"rgb(200,0,0)"});

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

var geo = new THREE.SphereGeometry(0.5, 20, 20);

for(let i = 0; i < 360; i+=30)
{
   var sphere = new THREE.Mesh(geo, material);
   sphere.rotateY(THREE.MathUtils.degToRad(i))
   sphere.translateX(8);
   sphere.translateY(0.4)
   scene.add(sphere)
}




// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

render();


function render()
{
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
