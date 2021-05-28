import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';
import {initRenderer, 
        SecondaryBox,
        initDefaultSpotlight,
        createGroundPlane,
        getMaxSize,        
        onWindowResize, 
        degreesToRadians, 
        lightFollowingCamera} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var light = initDefaultSpotlight(scene, new THREE.Vector3(2, 3, 2)); // Use default light
var lightSphere = createSphere(0.1, 10, 10);
  lightSphere.position.copy(light.position);
scene.add(lightSphere);

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );

// Control the appearence of first object loaded
var firstRender = false;

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(4.0, 4.0, 80, 80); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

var infoBox = new SecondaryBox("");

//---------------------------------------------------------
// Load external objects
var objectArray = new Array();
var activeObject = 0; // View first object

loadOBJFile('../assets/objects/', 'plane', 3.0, 0, true);
loadOBJFile('../assets/objects/', 'L200', 2.5, 90, false);
loadOBJFile('../assets/objects/', 'tank', 2.0, 90, false);

loadGLTFFile('../assets/objects/', 'orca', 4.0, 180, false);
loadGLTFFile('../assets/objects/', 'wooden_goose', 2.0, 90, false);
loadGLTFFile('../assets/objects/', 'chair', 1.0, 180, false);

buildInterface();
render();

function loadOBJFile(modelPath, modelName, desiredScale, angle, visibility)
{
  var currentModel = modelName;
  var manager = new THREE.LoadingManager( );

  var mtlLoader = new MTLLoader( manager );
  mtlLoader.setPath( modelPath );
  mtlLoader.load( modelName + '.mtl', function ( materials ) {
      materials.preload();

      var objLoader = new OBJLoader( manager );
      objLoader.setMaterials(materials);
      objLoader.setPath(modelPath);
      objLoader.load( modelName + ".obj", function ( obj ) {
        obj.visible = visibility;
        obj.name = modelName;
        // Set 'castShadow' property for each children of the group
        obj.traverse( function (child)
        {
          child.castShadow = true;
        });

        obj.traverse( function( node )
        {
          if( node.material ) node.material.side = THREE.DoubleSide;
        });

        var obj = normalizeAndRescale(obj, desiredScale);
        var obj = fixPosition(obj);
        obj.rotateY(degreesToRadians(angle));

        scene.add ( obj );
        objectArray.push( obj );

        // Pick the index of the first visible object
        if(modelName == 'plane')
        {
          activeObject = objectArray.length-1;
        }
      }, onProgress, onError );
  });
}

function loadGLTFFile(modelPath, modelFolder, desiredScale, angle, visibility)
{
  var loader = new GLTFLoader( );
  loader.load( modelPath + modelFolder + '/scene.gltf', function ( gltf ) {
    var obj = gltf.scene;
    obj.visible = visibility;
    obj.name = modelFolder;
    obj.traverse( function ( child ) {
      if ( child ) {
          child.castShadow = true;
      }
    });
    obj.traverse( function( node )
    {
      if( node.material ) node.material.side = THREE.DoubleSide;
    });

    var obj = normalizeAndRescale(obj, desiredScale);
    var obj = fixPosition(obj);
    obj.rotateY(degreesToRadians(angle));

    scene.add ( obj );
    objectArray.push( obj );

    }, onProgress, onError);
}

function onError() { };

function onProgress ( xhr, model ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      infoBox.changeMessage("Loading... " + Math.round( percentComplete, 2 ) + '% processed' );
    }
}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale)
{
  var scale = getMaxSize(obj); // Available in 'utils.js'
  obj.scale.set(newScale * (1.0/scale),
                newScale * (1.0/scale),
                newScale * (1.0/scale));
  return obj;
}

function fixPosition(obj)
{
  // Fix position of the object over the ground plane
  var box = new THREE.Box3().setFromObject( obj );
  if(box.min.y > 0)
    obj.translateY(-box.min.y);
  else
    obj.translateY(-1*box.min.y);
  return obj;
}

function renderFirstObjectLoaded()
{
  activeObject = 0;
  objectArray[0].visible = true;
  if(!firstRender) firstRender = true;
}

function createSphere(radius, widthSegments, heightSegments)
{
  var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
  var material = new THREE.MeshBasicMaterial({color:"rgb(255,255,50)"});
  var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
  return object;
}

function buildInterface()
{
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.type = "";
    this.onChooseObject = function()
    {
      objectArray[activeObject].visible = false;
      // Get number of the object by parsing the string (Object'number')
      activeObject = this.type[6];
      objectArray[activeObject].visible = true;
      infoBox.changeMessage(objectArray[activeObject].name);
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'type',
  ['Object0', 'Object1', 'Object2', 'Object3', 'Object4', 'Object5'])
    .name("Change Object")
    .onChange(function(e) { controls.onChooseObject(); });
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
