import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {ConvexGeometry} from '../build/jsm/geometries/ConvexGeometry.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlane,
        onWindowResize, 
        lightFollowingCamera} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information        
var clock = new THREE.Clock();
var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 30)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(5,15,40);
  camera.up.set( 0, 1, 0 );

var followCamera = false; // Controls if light will follow camera

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(40, 35); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 20 );
  axesHelper.visible = false;
  axesHelper.translateY(0.1);
scene.add( axesHelper );

var objColor = "rgb(255, 0, 0)";
var objOpacity = 0.5;

// Object Material
var mat = new THREE.MeshPhongMaterial({
  color: objColor,
  opacity: objOpacity,
  transparent: true});

//----------------------------------
// Create Convex Geometry
//----------------------------------
var numPoints = 30;

var sphereGeom = new THREE.SphereGeometry(0.2); // Sphere to represent points
var sphereMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});

// Global variables to be removed from memory each interaction
// var pointCloud = null;
// //  var spGroup = null;
var objectSize = 10;
// var convexGeometry = null;
// var object = null;
// var pointCloudVisibility = true;
// var objectVisibility = true;
// var castShadow = true;

// Create convex object the first time
//updateConvexObject();



  // First, create the point vector to be used by the convex hull algorithm
//   var localPoints = generatePoints(numPoints);

//   // Then, build the convex geometry with the generated points
//   convexGeometry = new ConvexGeometry(localPoints);

//   object = new THREE.Mesh(convexGeometry, objectMaterial);
//       object.castShadow = castShadow;
//       object.visible = objectVisibility;
//   scene.add(object);

// função cria pontos seguindo alguma lógica
// Pontos são armazenados em um array comum
let points = generatePoints();

 // Cria fecho convexo com os pontos gerados
let convexGeometry = new ConvexGeometry(points);

let object = new THREE.Mesh(convexGeometry, mat);
   object.castShadow = true;
scene.add(object);


render();

function generatePoints(numberOfPoints = 40)
{
  var points = [];
  var maxSize = objectSize;
  for (var i = 0; i < numberOfPoints; i++) {
    var randomX = Math.round(-maxSize + Math.random() * maxSize*2);
    var randomY = Math.round(0.1 + Math.random() * maxSize); //
    var randomZ = Math.round(-maxSize + Math.random() * maxSize*2);
    points.push(new THREE.Vector3(randomX, randomY, randomZ));
  }

  var material = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});

  return points;
}

function updateConvexObject( )
{
  // As the object is updated when changing number of Points
  // it's useful to remove the previous object from memory (if it exists)
  if(object) scene.remove(object);
  if(pointCloud) scene.remove(pointCloud);
  if(convexGeometry) convexGeometry.dispose();

  // First, create the point vector to be used by the convex hull algorithm
  var localPoints = generatePoints(numPoints);

  // Then, build the convex geometry with the generated points
  convexGeometry = new ConvexGeometry(localPoints);

  object = new THREE.Mesh(convexGeometry, objectMaterial);
      object.castShadow = castShadow;
      object.visible = objectVisibility;
  scene.add(object);

  // Uncomment to view debug information of the renderer
  //console.log(renderer.info);
}

function render()
{
  stats.update();
  trackballControls.update();
  if(followCamera)
      lightFollowingCamera(light, camera) // Makes light follow the camera
  else
      light.position.set(5,15,40);
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}


