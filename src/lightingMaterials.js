import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        SecondaryBox,
        initDefaultSpotlight,
        createGroundPlane,
        createLightSphere,        
        onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
var light = initDefaultSpotlight(scene, lightPosition); // Use default light
var lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(4.0, 2.5, 50, 50); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 1.5 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Show text information onscreen
showInformation();

var infoBox = new SecondaryBox("");

// Teapot
var geometry = new TeapotGeometry(0.5);

//---------------------------------------------------------
// Build Materials
var objectArray = new Array();
var activeObject = 0; // View first object

usePhongMaterial(geometry, true);
useLambertMaterial(geometry, false);
useNormalMaterial(geometry, false);
useNormalMaterialFlat(geometry, false);
useToonMaterial(geometry, false);
useBasicMaterial(geometry, false);
useBasicMaterialWireframe(geometry, false);

buildInterface();
render();

//More information here: https://threejs.org/docs/#api/en/materials/MeshNormalMaterial
function useNormalMaterial(geometry, visibility)
{
  var material = new THREE.MeshNormalMaterial();

  buildObject(geometry, material, visibility, "Normal Material");
}

function useNormalMaterialFlat(geometry, visibility)
{
  var material = new THREE.MeshNormalMaterial({flatShading: true});

  buildObject(geometry, material, visibility, "Normal Material - Flat");
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshToonMaterial
function useToonMaterial(geometry, visibility)
{
  var material = new THREE.MeshToonMaterial({
    color:"rgb(230,120,50)",     // Main color of the object
    aoMapIntensity:"0.1"
  });

  buildObject(geometry, material, visibility, "Toon Material");
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshBasicMaterial
function useBasicMaterial(geometry, visibility)
{
  var material = new THREE.MeshBasicMaterial({
    color:"rgb(255,20,20)"     // Main color of the object
  });

  buildObject(geometry, material, visibility, "Basic Material");
}

function useBasicMaterialWireframe(geometry, visibility)
{
  var material = new THREE.MeshBasicMaterial({
    color:"rgb(255,255,255)",     // Main color of the object
    wireframe: true
  });

  buildObject(geometry, material, visibility, "Basic Material - Wireframe");
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshLambertMaterial
function useLambertMaterial(geometry, visibility)
{
  var material = new THREE.MeshLambertMaterial({
    color:"rgb(255,20,20)"     // Main color of the object
  });

  buildObject(geometry, material, visibility, "Lambert Material");
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshPhongMaterial
function usePhongMaterial(geometry, visibility)
{
  var material = new THREE.MeshPhongMaterial({
    color:"rgb(255,20,20)",     // Main color of the object
    shininess:"200",            // Shininess of the object
    specular:"rgb(255,255,255)" // Color of the specular component
  });

  buildObject(geometry, material, visibility, "Phong Material");
}

function buildObject(geometry, material, visibility, name)
{
  var obj = new THREE.Mesh(geometry, material);
    obj.name = name;
    obj.castShadow = true;
    obj.visible = visibility;
    obj.position.set(0.0, 0.5, 0.0);

  scene.add( obj );
  objectArray.push( obj );
}

function keyboardUpdate()
{
  keyboard.update();
  if ( keyboard.pressed("D") )
  {
    lightPosition.x += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("A") )
  {
    lightPosition.x -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("W") )
  {
    lightPosition.y += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("S") )
  {
    lightPosition.y -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("E") )
  {
    lightPosition.z -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("Q") )
  {
    lightPosition.z += 0.05;
    updateLightPosition();
  }
}

// Update light position of the current light
function updateLightPosition()
{
  light.position.copy(lightPosition);
  lightSphere.position.copy(lightPosition);
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Lighting - Types of Materials");
    controls.addParagraph();
    controls.add("Use the WASD-QE keys to move the light");
    controls.show();
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.materialType = 'Phong'

    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };

    this.onChangeMaterial = function()
    {
      objectArray[activeObject].visible = false;
      switch (this.materialType)
      {
        case 'Phong':
            activeObject = 0;
            break;
        case 'Gouraud':
            activeObject = 1;
            break;
        case 'Normal':
            activeObject = 2;
            break;
        case 'NormalFlat':
            activeObject = 3;
            break;
        case 'Toon':
            activeObject = 4;
            break;
        case 'Basic':
            activeObject = 5;
            break;
        case 'BasicWireframe':
            activeObject = 6;
            break;
      }
      objectArray[activeObject].visible = true;
    };
  };

  var gui = new GUI();

  gui.add(controls, 'materialType',
    ['Phong','Gouraud','Normal','NormalFlat','Toon','Basic','BasicWireframe'])
    .name("Material Type")
    .onChange(function(e) { controls.onChangeMaterial(); });

  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
  stats.update();
  trackballControls.update();
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}

