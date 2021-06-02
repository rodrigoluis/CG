import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
//var camera = initCamera(new THREE.Vector3(15, 0, 0)); // Init camera in this position
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(5,15,30);
  camera.up.set( 0, 1, 0 );

var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(23, 23); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
axesHelper.visible = false;
scene.add( axesHelper );

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Object Material for all objects
var objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,0,0)"});

// Add objects to scene
var objectArray = new Array();
var activeObject = 0; // View first object
scene.add(createCube(5.0));
scene.add(createCylinder(2.0, 2.0, 5.0, 20, 4, false));
scene.add(createSphere(3.0, 20, 20));
scene.add(createTorus(3.0, 1.0, 20, 20, Math.PI * 2));
scene.add(createIcosahedron(4.0, 0));

buildInterface();
render();

function createIcosahedron(radius, detail)
{
  var geometry = new THREE.IcosahedronGeometry(radius, detail);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius, 0.0);
    object.visible = false;

  objectArray.push(object);
  return object;
}

function createTorus(radius, tube, radialSegments, tubularSegments, arc)
{
  var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius+tube, 0.0);
    object.visible = false;

  objectArray.push(object);
  return object;
}

function createCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
{
  var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, height/2.0, 0.0);
    object.visible = false;

  objectArray.push(object);
  return object;
}

function createSphere(radius, widthSegments, heightSegments)
{
  var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius, 0.0);
    object.visible = false;

  objectArray.push(object);
  return object;
}

function createCube(s)
{
  var geometry = new THREE.BoxGeometry(s, s, s);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, s/2.0, 0.0);
    object.visible = true;

  objectArray.push(object);
  return object;
}

function buildInterface()
{
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.type = 'Cube';
    this.onChooseObject = function()
    {
      objectArray[activeObject].visible = false;
      switch (this.type)
      {
        case 'Cube':
            activeObject = 0;
            break;
        case 'Cylinder':
            activeObject = 1;
            break;
        case 'Sphere':
            activeObject = 2;
            break;
        case 'Torus':
            activeObject = 3;
            break;
        case 'Icosahedron':
            activeObject = 4;
            break;
      }
      objectArray[activeObject].visible = true;
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'type', ['Cube', 'Cylinder', 'Sphere', 'Torus', 'Icosahedron'])
    .name("Change Object")
    .onChange(function(e) { controls.onChooseObject(); });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}