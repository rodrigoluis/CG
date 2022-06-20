import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        createGroundPlaneXZ,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor("rgb(30, 30, 40)");
var camera = initCamera(new THREE.Vector3(5, 15, 30)); // Init camera in this position
initDefaultBasicLight(scene, true, new THREE.Vector3(25, 30, 20))

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlaneXZ(23, 23); // width and height
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
axesHelper.visible = false;
scene.add( axesHelper );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Object Material for all objects
var objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,20,20)", shininess:"200"});

// Add objects to scene
let cube = createCube(5.0); 
scene.add(cube);
let cylinder = createCylinder(2.0, 2.0, 5.0, 20, 4, false);
scene.add(cylinder);
let sphere = createSphere(3.0, 20, 20);
scene.add(sphere);
let torus = createTorus(3.0, 1.0, 20, 20, Math.PI * 2)
scene.add(torus);
let ico = createIcosahedron(4.0, 0);
scene.add(ico);

hideAllObjects();
let currentObject = cube;
currentObject.visible = true;

buildInterface();
render();

function createIcosahedron(radius, detail)
{
  var geometry = new THREE.IcosahedronGeometry(radius, detail);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius, 0.0);
  return object;
}

function createTorus(radius, tube, radialSegments, tubularSegments, arc)
{
  var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius+tube, 0.0);
  return object;
}

function createCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
{
  var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, height/2.0, 0.0);
  return object;
}

function createSphere(radius, widthSegments, heightSegments)
{
  var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius, 0.0);
  return object;
}

function createCube(s)
{
  var geometry = new THREE.BoxGeometry(s, s, s);
  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, s/2.0, 0.0);
  return object;
}

function hideAllObjects()
{
   cube.visible = cylinder.visible = sphere.visible = torus.visible = ico.visible = false;
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
      switch (this.type)
      {
        case 'Cube':
            currentObject = cube;
            break;
        case 'Cylinder':
            currentObject = cylinder;
            break;
        case 'Sphere':
            currentObject = sphere;
            break;
        case 'Torus':
            currentObject = torus;
            break;
        case 'Icosahedron':
            currentObject = ico;
            break;
      }
      hideAllObjects();
      currentObject.visible = true;
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