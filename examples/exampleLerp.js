import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initDefaultSpotlight,
        initCamera,
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

let scene    = new THREE.Scene();    // Create main scene
let renderer = initRenderer();    // View function in util/utils
let light    = initDefaultSpotlight(scene, new THREE.Vector3(7.0, 7.0, 7.0)); 
let camera   = initCamera(new THREE.Vector3(3.6, 4.6, 8.2)); // Init camera in this position
let trackballControls = new TrackballControls(camera, renderer.domElement );

// Show axes 
let axesHelper = new THREE.AxesHelper( 5 );
  axesHelper.translateY(0.1);
scene.add( axesHelper );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Create sphere
let geometry = new THREE.SphereGeometry( 0.2, 32, 16 );
let material = new THREE.MeshPhongMaterial({color:"red", shininess:"200"});
let obj = new THREE.Mesh(geometry, material);
  obj.castShadow = true;
  obj.position.set(0, 0.2, 0);
scene.add(obj);

// Variables that will be used for linear interpolation
const lerpConfig = {
  destination: new THREE.Vector3(0.0, 0.2, 0.0),
  alpha: 0.01,
  move: true
}

buildInterface();
render();

function buildInterface()
{     
  let gui = new GUI();
  let folder = gui.addFolder("Lerp Options");
    folder.open();
    folder.add(lerpConfig.destination, 'x', -5, 5).onChange();
    folder.add(lerpConfig.destination, 'y', 0.1, 3).onChange();
    folder.add(lerpConfig.destination, 'z', -5, 5).onChange();  
    folder.add(lerpConfig, 'alpha', 0.01, 1).onChange();      
    folder.add(lerpConfig, "move",  true)
          .name("Move Object");
}

function render()
{
  trackballControls.update();

  if(lerpConfig.move) obj.position.lerp(lerpConfig.destination, lerpConfig.alpha);

  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}