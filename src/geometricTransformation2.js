import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        onWindowResize, 
        degreesToRadians, 
        initDefaultBasicLight} from "../libs/util/util.js";

        
var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(7, 7, 7)); // Init camera in this position
var trackballControls = new TrackballControls( camera, renderer.domElement );
initDefaultBasicLight(scene);

// Set angles of rotation
var angle = [-1.57, 0]; // In degreesToRadians

// Show world axes
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

var s1 = createSphere();
scene.add(s1);

var c1 = createCylinder();
s1.add(c1);

var s2 = createSphere();
c1.add(s2);

var c2 = createCylinder();
s2.add(c2);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

buildInterface();
render();

function createSphere()
{
  var sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  var sphereMaterial = new THREE.MeshPhongMaterial( {color:'rgb(180,180,255)'} );
  var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  return sphere;
}

function createCylinder()
{
  var cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.0, 25);
  var cylinderMaterial = new THREE.MeshPhongMaterial( {color:'rgb(100,255,100)'} );
  var cylinder = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
  return cylinder;
}

function rotateCylinder()
{
  // More info:
  // https://threejs.org/docs/#manual/en/introduction/Matrix-transformations
  c1.matrixAutoUpdate = false;
  s2.matrixAutoUpdate = false;
  c2.matrixAutoUpdate = false;

  var mat4 = new THREE.Matrix4();

  // resetting matrices
  c1.matrix.identity();
  s2.matrix.identity();
  c2.matrix.identity();

  // Will execute T1 and then R1
  c1.matrix.multiply(mat4.makeRotationZ(angle[0])); // R1
  c1.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T1
  
  // Just need to translate the sphere to the right position
  s2.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0));

  // Will execute T2 and then R2
  c2.matrix.multiply(mat4.makeRotationZ(angle[1])); // R2
  c2.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T2
}

function buildInterface()
{
  var controls = new function ()
  {
    this.joint1 = 270;
    this.joint2 = 0;

    this.rotate = function(){
      angle[0] = degreesToRadians(this.joint1);
      angle[1] = degreesToRadians(this.joint2);
      rotateCylinder();
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'joint1', 0, 360)
    .onChange(function() { controls.rotate() })
    .name("First Joint");
  gui.add(controls, 'joint2', 0, 360)
    .onChange(function() { controls.rotate() })
    .name("Second Joint");
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  rotateCylinder();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
