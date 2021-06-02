import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        InfoBox,
        SecondaryBox,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians, 
        createLightSphere} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );
var objColor = "rgb(255,20,20)";
var objShininess = 200;

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
var material = new THREE.MeshPhongMaterial({color:objColor, shininess:"200"});
  material.side = THREE.DoubleSide;
var obj = new THREE.Mesh(geometry, material);
  obj.castShadow = true;
  obj.position.set(0.0, 0.5, 0.0);
scene.add(obj);

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
// Control available light and set the active light
var lightArray = new Array();
var activeLight = 0; // View first Light
var lightIntensity = 1.0;

//---------------------------------------------------------
// Default light position, color, ambient color and intensity
var lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
var lightColor = "rgb(255,255,255)";
var ambientColor = "rgb(50,50,50)";

// Sphere to represent the light
var lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

//---------------------------------------------------------
// Create and set all lights. Only Spot and ambient will be visible at first
var spotLight = new THREE.SpotLight(lightColor);
setSpotLight(lightPosition);

var pointLight = new THREE.PointLight(lightColor);
setPointLight(lightPosition);

var dirLight = new THREE.DirectionalLight(lightColor);
setDirectionalLighting(lightPosition);

// More info here: https://threejs.org/docs/#api/en/lights/AmbientLight
var ambientLight = new THREE.AmbientLight(ambientColor);
scene.add( ambientLight );

buildInterface();
render();

// Set Point Light
// More info here: https://threejs.org/docs/#api/en/lights/PointLight
function setPointLight(position)
{
  pointLight.position.copy(position);
  pointLight.name = "Point Light"
  pointLight.castShadow = true;
  pointLight.visible = false;
  spotLight.penumbra = 0.5;
  
  scene.add( pointLight );
  lightArray.push( pointLight );
}

// Set Spotlight
// More info here: https://threejs.org/docs/#api/en/lights/SpotLight
function setSpotLight(position)
{
  spotLight.position.copy(position);
  spotLight.shadow.mapSize.width = 512;
  spotLight.shadow.mapSize.height = 512;
  spotLight.angle = degreesToRadians(40);    
  spotLight.castShadow = true;
  spotLight.decay = 2;
  spotLight.penumbra = 0.5;
  spotLight.name = "Spot Light"

  scene.add(spotLight);
  lightArray.push( spotLight );
}

// Set Directional Light
// More info here: https://threejs.org/docs/#api/en/lights/DirectionalLight
function setDirectionalLighting(position)
{
  dirLight.position.copy(position);
  dirLight.shadow.mapSize.width = 512;
  dirLight.shadow.mapSize.height = 512;
  dirLight.castShadow = true;

  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 20;
  dirLight.shadow.camera.left = -5;
  dirLight.shadow.camera.right = 5;
  dirLight.shadow.camera.top = 5;
  dirLight.shadow.camera.bottom = -5;
  dirLight.name = "Direction Light";
  dirLight.visible = false;

  scene.add(dirLight);
  lightArray.push( dirLight );
}

// Update light position of the current light
function updateLightPosition()
{
  lightArray[activeLight].position.copy(lightPosition);
  lightSphere.position.copy(lightPosition);
  infoBox.changeMessage("Light Position: " + lightPosition.x.toFixed(2) + ", " +
                          lightPosition.y.toFixed(2) + ", " + lightPosition.z.toFixed(2));
}

// Update light intensity of the current light
function updateLightIntensity()
{
  lightArray[activeLight].intensity = lightIntensity;
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.color = objColor;
    this.shininess = objShininess;
    this.lightIntensity = lightIntensity;
    this.lightType = 'Spot'
    this.ambientLight = true;

    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
    this.onEnableAmbientLight = function(){
      ambientLight.visible = this.ambientLight;
    };
    this.updateColor = function(){
      material.color.set(this.color);
    };
    this.onUpdateShininess = function(){
      material.shininess = this.shininess;
    };
    this.onUpdateLightIntensity = function(){
      lightIntensity = this.lightIntensity;
      updateLightIntensity();
    };
    this.onChangeLight = function()
    {
      lightArray[activeLight].visible = false;
      switch (this.lightType)
      {
        case 'Spot':
            activeLight = 0;
            break;
        case 'Point':
            activeLight = 1;
            break;
        case 'Direction':
            activeLight = 2;
            break;
      }
      lightArray[activeLight].visible = true;
      updateLightPosition();
      updateLightIntensity();
    };
  };

  var gui = new GUI();
  gui.addColor(controls, 'color')
    .name("Obj Color")
    .onChange(function(e) { controls.updateColor() });
  gui.add(controls, 'shininess', 0, 1000)
    .name("Obj Shininess")
    .onChange(function(e) { controls.onUpdateShininess() });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
  gui.add(controls, 'lightType', ['Spot', 'Point', 'Direction'])
    .name("Light Type")
    .onChange(function(e) { controls.onChangeLight(); });
  gui.add(controls, 'lightIntensity', 0, 5)
    .name("Light Intensity")
    .onChange(function(e) { controls.onUpdateLightIntensity() });
  gui.add(controls, 'ambientLight', true)
    .name("Ambient Light")
    .onChange(function(e) { controls.onEnableAmbientLight() });
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

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Lighting - Types of Lights");
    controls.addParagraph();
    controls.add("Use the WASD-QE keys to move the light");
    controls.show();
}

function render()
{
  stats.update();
  trackballControls.update();
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
