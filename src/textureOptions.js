import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initDefaultSpotlight,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(0.0, 0.0, 5.0);
  camera.up.set( 0, 1, 0 );

var lightPosition = new THREE.Vector3(0.0, 0.0, 5.0);
var light = initDefaultSpotlight(scene, lightPosition); // Use default light

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

//----------------------------------------------------------------------------
//-- Scene Objects -----------------------------------------------------------
var planeGeometry = new THREE.PlaneGeometry(4.0, 4.0, 10, 10);
var planeMaterial = new THREE.MeshLambertMaterial({color:"rgb(255,255,255)",side:THREE.DoubleSide});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

//----------------------------------------------------------------------------
//-- Use TextureLoader to load texture files
var textureLoader = new THREE.TextureLoader();
var floor  = textureLoader.load('../assets/textures/marble.png');

// Apply texture to the 'map' property of the plane
plane.material.map = floor;

// Set defaults
var repeatFactor = 2;
var wrapModeS  = THREE.RepeatWrapping;
var wrapModeT  = THREE.RepeatWrapping;
var minFilter = THREE.LinearFilter;
var magFilter = THREE.LinearFilter;
updateTexture();

buildInterface();
render();

function updateTexture()
{
  plane.material.map.repeat.set(repeatFactor,repeatFactor);
  plane.material.map.wrapS = wrapModeS;
  plane.material.map.wrapT = wrapModeT;
  plane.material.map.minFilter = minFilter;
  plane.material.map.magFilter = magFilter;
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.wrapS = 'Repeat';
    this.wrapT = 'Repeat';
    this.repeat = repeatFactor;
    this.mag = 'Linear';
    this.min = 'Linear';

    this.onChangeRepeatFactor = function(){
      repeatFactor = this.repeat;
      updateTexture();
    };
    this.onChangingWrappingMode_S = function()
    {
      switch (this.wrapS)
      {
        case 'Clamp':
            wrapModeS = THREE.ClampToEdgeWrapping;
            break;
        case 'Repeat':
            wrapModeS = THREE.RepeatWrapping;
            break;
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    };
    this.onChangingWrappingMode_T = function()
    {
      switch (this.wrapT)
      {
        case 'Clamp':
            wrapModeT = THREE.ClampToEdgeWrapping;
            break;
        case 'Repeat':
            wrapModeT = THREE.RepeatWrapping;
            break;
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    };
    // Best to see if the object is far
    this.onChangingMinification = function()
    {
      switch (this.min)
      {
        case 'Linear':
            minFilter = THREE.LinearFilter;
            break;
        case 'Nearest':
            minFilter = THREE.NearestFilter;
            break;
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    };
    // Best to see if the object is near
    this.onChangingMagnification = function()
    {
      switch (this.mag)
      {
        case 'Linear':
            magFilter = THREE.LinearFilter;
            break;
        case 'Nearest':
            magFilter = THREE.NearestFilter;
            break;
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    };
  };

  var gui = new GUI();

  gui.add(controls, 'repeat', 1, 10)
    .name("Repeat Factor")
    .onChange(function(e) { controls.onChangeRepeatFactor()});
  gui.add(controls, 'wrapS',['Clamp', 'Repeat'])
    .name("Wrapping Mode S")
    .onChange(function(e) { controls.onChangingWrappingMode_S(); });
  gui.add(controls, 'wrapT',['Clamp', 'Repeat'])
    .name("Wrapping Mode T")
    .onChange(function(e) { controls.onChangingWrappingMode_T(); });
  gui.add(controls, 'mag',['Linear', 'Nearest'])
    .name("Magnification")
    .onChange(function(e) { controls.onChangingMagnification(); });
  gui.add(controls, 'min',['Linear', 'Nearest'])
    .name("Minification")
    .onChange(function(e) { controls.onChangingMinification(); });
}

function render()
{
  stats.update();
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}

