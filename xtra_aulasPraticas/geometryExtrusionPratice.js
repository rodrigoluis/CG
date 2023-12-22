import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
  //var clock = new THREE.Clock();  
var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(5,15,30);
  camera.up.set( 0, 1, 0 );
var objColor = "rgb(230, 50, 50)";

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(30, 30); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Object Material
var objectMaterial = new THREE.MeshPhongMaterial({color:objColor});
  objectMaterial.side =  THREE.DoubleSide; // Show front and back polygons

//----------------------------------
// Create Extrude Geometry
//----------------------------------
var extrudeSettings = {depth: 5};

var extrudeGeometry = new THREE.ExtrudeGeometry(smileShape(), extrudeSettings);
var object = new THREE.Mesh(extrudeGeometry, objectMaterial);
  object.castShadow = true;
scene.add(object);

object.translateY(4.0);
object.rotateZ(THREE.MathUtils.degToRad(180));

buildInterface();
render();

function smileShape()
{
  var smileyShape = new THREE.Shape();
    smileyShape.absarc( 0.0, 0.0, 4.0, 0, Math.PI * 2 );

  var hole1 = new THREE.Path();
    hole1.absarc( 0.0, 0.0, 2.0, 0, Math.PI * 2  );    

  smileyShape.holes.push( hole1 );

  return smileyShape;
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.viewObject = true;
    this.viewAxes = false;
    this.color = objColor;

    this.onViewObject = function(){
      object.visible = this.viewObject;
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
    this.updateColor = function(){
      objectMaterial.color.set(this.color);
    };
  };

  var gui = new GUI();
  gui.add(controls, 'viewObject', true)
    .name("View Object")
    .onChange(function(e) { controls.onViewObject() });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
  gui.addColor(controls, 'color')
    .name("Change Color")
    .onChange(function(e) { controls.updateColor();});
}

function render()
{
  stats.update();
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
