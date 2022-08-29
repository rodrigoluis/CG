import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        SecondaryBox,
        initDefaultSpotlight,
        createGroundPlane,
        createLightSphere,        
        onWindowResize} from "../libs/util/util.js";

let scene, renderer, camera, stats, light, lightSphere, lightPosition, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("rgb(30, 30, 42)");    // View function in util/utils
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement );
stats = new Stats();          // To show FPS information

lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
light = initDefaultSpotlight(scene, lightPosition); // Use default light
lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);

// To use the keyboard
var keyboard = new KeyboardState();

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(4.0, 2.5, 50, 50); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 1.5 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Show text information onscreen
showInformation();

var infoBox = new SecondaryBox("");

//---------------------------------------------------------
// Build Materials

let phongObject, lambertObject, normalObject, normalFlatObject,
    toonObject, basicObject, wireframeObject;

// Teapot basic geometry
var geometry = new TeapotGeometry(0.5);

phongObject =      createPhongObject(geometry);
lambertObject =    createLambertObject(geometry);
normalObject =     createNormalMaterial(geometry);
normalFlatObject = createNormalMaterialFlat(geometry);  
toonObject =       createToonMaterial(geometry);
basicObject =      createBasicMaterial(geometry);
wireframeObject =  createBasicMaterialWireframe(geometry);

hideAllObjects();
phongObject.visible = true; // default

buildInterface();
render();


function hideAllObjects()
{
   phongObject.visible = lambertObject.visible = normalObject.visible = 
   normalFlatObject.visible = toonObject.visible = basicObject.visible =
   wireframeObject.visible = false;   
}

function buildObject(geometry, material)
{
  let obj = new THREE.Mesh(geometry, material);
      obj.castShadow = true;
      obj.position.set(0.0, 0.5, 0.0);

  scene.add( obj );
  return obj;
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshPhongMaterial
function createPhongObject(geometry)
{
   let material = new THREE.MeshPhongMaterial({
     color:"rgb(255,20,20)",     // Main color of the object
     shininess:"100",            // Shininess of the object
     specular:"rgb(255,255,255)" // Color of the specular component
   });
   return buildObject(geometry, material);
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshLambertMaterial
function createLambertObject(geometry)
{
   let material = new THREE.MeshLambertMaterial({
      color:"rgb(255,20,20)"     // Main color of the object
   });
   return buildObject(geometry, material);
}


//More information here: https://threejs.org/docs/#api/en/materials/MeshNormalMaterial
function createNormalMaterial(geometry)
{
  var material = new THREE.MeshNormalMaterial();

  return buildObject(geometry, material);
}

function createNormalMaterialFlat(geometry)
{
  var material = new THREE.MeshNormalMaterial({flatShading: true});

  return buildObject(geometry, material);
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshToonMaterial
function createToonMaterial(geometry)
{
  var material = new THREE.MeshToonMaterial({
    color:"rgb(230,120,50)",     // Main color of the object
  });

  return buildObject(geometry, material);  
}

//More information here: https://threejs.org/docs/#api/en/materials/MeshBasicMaterial
function createBasicMaterial(geometry)
{
  var material = new THREE.MeshBasicMaterial({
    color:"rgb(255,20,20)"     // Main color of the object
  });

  return buildObject(geometry, material);  
}

function createBasicMaterialWireframe(geometry)
{
  var material = new THREE.MeshBasicMaterial({
    color:"rgb(255,255,255)",     // Main color of the object
    wireframe: true
  });

  return buildObject(geometry, material);
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
      hideAllObjects();
      switch (this.materialType)
      {
         case 'Phong':
            phongObject.visible = true;
            break;
         case 'Lambert':
            lambertObject.visible = true;
            break;
         case 'Normal':
            normalObject.visible = true;
            break;
         case 'NormalFlat':
            normalFlatObject.visible = true;
            break;
         case 'Toon':
            toonObject.visible = true;
            break;
         case 'Basic':
            basicObject.visible = true;
            break;
         case 'BasicWireframe':
            wireframeObject.visible = true;
            break;
      }
    };
  };

  var gui = new GUI();

  gui.add(controls, 'materialType',
    ['Phong','Lambert','Normal','NormalFlat','Toon','Basic','BasicWireframe'])
    .name("Material Type")
    .onChange(function(e) { controls.onChangeMaterial(); });

  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
  stats.update();
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
