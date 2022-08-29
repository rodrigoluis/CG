import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {InfoBox,
        createGroundPlane,
        createLightSphere,        
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene

 // Use this to show information onscreen
var controls = new InfoBox();
  controls.add("Shadow Types");
  controls.addParagraph();
  controls.add("Radius parameter works only for VSM and PCF.");
  controls.show();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0.0, 1.8, 2.5);

// Set all renderers
let renderer = new THREE.WebGLRenderer();
  document.getElementById("webgl-output").appendChild( renderer.domElement );  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type  = THREE.VSMShadowMap; // default

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

//---------------------------------------------------------
// Default light position
var lightPosition = new THREE.Vector3(2.0, 1.2, 0.0);

// Sphere to represent the light
var lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

var ambientLight = new THREE.AmbientLight("rgb(60,60,60)");
scene.add( ambientLight );

//---------------------------------------------------------
// Create and set the spotlight
var dirLight = new THREE.DirectionalLight("rgb(255,255,255)");
  dirLight.position.copy(lightPosition);
  dirLight.castShadow = true;
  // Shadow Parameters
  dirLight.shadow.mapSize.width = 256;
  dirLight.shadow.mapSize.height = 256;
  dirLight.shadow.camera.near = .1;
  dirLight.shadow.camera.far = 6;
  dirLight.shadow.camera.left = -2.5;
  dirLight.shadow.camera.right = 2.5;
  dirLight.shadow.camera.bottom = -2.5;
  dirLight.shadow.camera.top = 2.5;
  dirLight.shadow.bias = -0.0005;  

  // No effect on Basic and PCFSoft
  dirLight.shadow.radius = 4;

  // Just for VSM - to be added in threejs.r132
  //dirLight.shadow.blurSamples = 2;
scene.add(dirLight);

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Create helper for the spotlight shadow
const shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
  shadowHelper.visible = false;
scene.add(shadowHelper);

createScene();
buildInterface();
render();

//-----------------------------------------------------------------------------
function createScene()
{
  var groundPlane = createGroundPlane(5, 5); 
    groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
  scene.add(groundPlane);

  // Create object
  var geometry = new TeapotGeometry(0.5);
  var material = new THREE.MeshPhongMaterial({color:"rgb(255,0,0)", shininess:"200"});
    material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.position.set(0.5, 0.5, 0.0);
  scene.add(obj);
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.type = 'VSM';
    this.onChangeShadowType = function()
    {
      renderer.dispose();
      switch (this.type)
      {   
        case 'Basic': 
            renderer.shadowMap.type = THREE.BasicShadowMap;
            break;
        case 'PCF':
            renderer.shadowMap.type = THREE.PCFShadowMap;
            break;
        case 'PCF Soft':
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
        case 'VSM':
            renderer.shadowMap.type = THREE.VSMShadowMap;
            break;
      }       
    };
  };

  var gui = new GUI();
  gui.add(controls, 'type', ['VSM', 'PCF', 'PCF Soft', 'Basic'])
    .name("Shadow Map Type")
    .onChange(function(e) { controls.onChangeShadowType(); });
  
  var dirLightFolder = gui.addFolder("Light Shadow Parameters");
    dirLightFolder.open();
    dirLightFolder.add(dirLight.shadow, 'radius', 0, 15).name("Radius");
    // dirLightFolder.add(dirLight.shadow, 'blurSamples', 1, 25);   // To be added in threejs.r132
    dirLightFolder.add(shadowHelper, 'visible', true);
}

function render()
{
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}