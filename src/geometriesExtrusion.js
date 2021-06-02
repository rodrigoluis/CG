import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";

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
var objColor = "rgb(200, 129, 0)";

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(30, 30); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
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
var extrudeSettings =
{
  depth: 5,
  bevelEnabled: false,
};

var extrudeGeometry = new THREE.ExtrudeGeometry(smileShape(), extrudeSettings);
var object = new THREE.Mesh(extrudeGeometry, objectMaterial);
  object.castShadow = true;
scene.add(object);

object.translateY(4.0);
object.rotateZ(degreesToRadians(180));

buildInterface();
render();

function smileShape()
{
  var smileyShape = new THREE.Shape();
    smileyShape.absarc( 0.0, 0.0, 4.0, 0, Math.PI * 2, false );

  var smileyEye1Path = new THREE.Path();
    smileyEye1Path.absellipse( -1.5, -2.0, 1.0, 1.0, 0, Math.PI * 2, true );

  var smileyEye2Path = new THREE.Path();
    smileyEye2Path.absarc( 1.5, -2.0, 1.0, 0, Math.PI * 2, true );

  var smileyMouthPath = new THREE.Path();
    smileyMouthPath.moveTo( -2.0, 0.0 );
    smileyMouthPath.quadraticCurveTo( 0.0, 2.0, 2.0, 0.0 )
    smileyMouthPath.bezierCurveTo( 3.0, 0.5, 3.0, 1.0, 2.0, 2.0 )
    smileyMouthPath.quadraticCurveTo( 0.0, 4.0, -2.0, 2.0 )
    smileyMouthPath.quadraticCurveTo( -3.5, 1.0, -2.0, 0.0 );

  smileyShape.holes.push( smileyEye1Path );
  smileyShape.holes.push( smileyEye2Path );
  smileyShape.holes.push( smileyMouthPath );

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
