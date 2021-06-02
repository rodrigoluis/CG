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
var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(5,15,40);
  camera.up.set( 0, 1, 0 );

var spGroup;

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(40, 35); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Object Material
var objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,0,0)"});
  objectMaterial.side =  THREE.DoubleSide; // Show front and back polygons

//----------------------------------
// Create Lathe Geometry
//----------------------------------
// First, create the point vector to be used by the Lathe algorithm
var points = generatePoints();
// Set the main properties of the surface
var segments = 20;
var phiStart = 0;
var phiLength = 2 * Math.PI;
var latheGeometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength);
var object = new THREE.Mesh(latheGeometry, objectMaterial);
  object.castShadow = true;
scene.add(object);

buildInterface();
render();

function generatePoints()
{
  var points = [];
  var numberOfPoints = 12;
  for (var i = 0; i < numberOfPoints; i++) {
    points.push(new THREE.Vector2(Math.sin(i*2 / 4.17)+3, i));
  }
  // material for all points
  var material = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});

  spGroup = new THREE.Object3D();
  points.forEach(function (point) {
    var spGeom = new THREE.SphereGeometry(0.2);
    var spMesh = new THREE.Mesh(spGeom, material);
    spMesh.position.set(point.x, point.y, 0);
    spGroup.add(spMesh);
  });
  // add the points as a group to the scene
  scene.add(spGroup);
  return points;
}

function buildInterface()
{
  var controls = new function ()
  {
    this.viewObject = true;
    this.viewPoints = true;
    this.viewAxes = false;

    this.onViewObject = function(){
      object.visible = this.viewObject;
    };
    this.onViewPoints = function(){
      spGroup.visible = this.viewPoints;
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'viewObject', true)
    .name("View Object")
    .onChange(function(e) { controls.onViewObject() });
  gui.add(controls, 'viewPoints', false)
    .name("View Points")
    .onChange(function(e) { controls.onViewPoints() });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
  stats.update();
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
