import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        InfoBox,
        SecondaryBox,
        createGroundPlane,
        onWindowResize, 
        createLightSphere} from "../libs/util/util.js";

let scene, renderer, camera, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("rgb(30, 30, 42)");    // View function in util/utils
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// To use the keyboard
let keyboard = new KeyboardState();

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let groundPlane = createGroundPlane(4.0, 2.5, 50, 50); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 1.5 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Show text information onscreen
showInformation();
let infoBox = new SecondaryBox("");

// Teapot
let objColor = "rgb(255,20,20)"; // Define the color of the object
let objShininess = 200;          // Define the shininess of the object

let geometry = new TeapotGeometry(0.5);
let material = new THREE.MeshPhongMaterial({color: objColor, shininess: objShininess});
  material.side = THREE.DoubleSide;
let obj = new THREE.Mesh(geometry, material);
  obj.castShadow = true;
  obj.position.set(0.0, 0.5, 0.0);
scene.add(obj);

//---------------------------------------------------------
// Default light intensity, position, color, ambient color and intensity
let lightIntensity = 1.0;
let lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
let lightColor = "rgb(255,255,255)";
let ambientColor = "rgb(50,50,50)";

// Sphere to represent the light
let lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

//---------------------------------------------------------
// Create and set all lights. Only Spot and ambient will be visible at first

// More info here: https://threejs.org/docs/#api/en/lights/AmbientLight
let ambientLight = new THREE.AmbientLight(ambientColor);
scene.add( ambientLight );

let spotLight = new THREE.SpotLight(lightColor);
setSpotLight(lightPosition);

let pointLight = new THREE.PointLight(lightColor);
setPointLight(lightPosition);

let dirLight = new THREE.DirectionalLight(lightColor);
setDirectionalLighting(lightPosition);

// Hide all lights and make only the spotLight visible
hideAllLights();
spotLight.visible = true;
let currentLight = spotLight; // current light

buildInterface();
render();

// Set Point Light
// More info here: https://threejs.org/docs/#api/en/lights/PointLight
function setPointLight(position)
{
  pointLight.position.copy(position);
  pointLight.name = "Point Light"
  pointLight.castShadow = true;
  scene.add( pointLight );
}

// Set Spotlight
// More info here: https://threejs.org/docs/#api/en/lights/SpotLight
function setSpotLight(position)
{
  spotLight.position.copy(position);
  spotLight.angle = THREE.MathUtils.degToRad(40);    
  spotLight.decay = 2; // The amount the light dims along the distance of the light.
  spotLight.penumbra = 1; // Percent of the spotlight cone that is attenuated due to penumbra. 

    // Shadow settings
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 512;
  spotLight.shadow.mapSize.height = 512;
  spotLight.name = "Spot Light"

  scene.add(spotLight);
}

// Set Directional Light
// More info here: https://threejs.org/docs/#api/en/lights/DirectionalLight
function setDirectionalLighting(position)
{
  dirLight.position.copy(position);

  // Shadow settings
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 512;
  dirLight.shadow.mapSize.height = 512;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 20;
  dirLight.shadow.camera.left = -5;
  dirLight.shadow.camera.right = 5;
  dirLight.shadow.camera.top = 5;
  dirLight.shadow.camera.bottom = -5;
  dirLight.name = "Direction Light";

  scene.add(dirLight);
}

function hideAllLights()
{
   spotLight.visible = dirLight.visible = pointLight.visible = false;
}

// Update light position of the current light
function updateLightPosition()
{
  currentLight.position.copy(lightPosition);
  lightSphere.position.copy(lightPosition);
  infoBox.changeMessage("Light Position: " + lightPosition.x.toFixed(2) + ", " +
                          lightPosition.y.toFixed(2) + ", " + lightPosition.z.toFixed(2));
}

// Update light intensity of the current light
function updateLightIntensity()
{
   currentLight.intensity = lightIntensity;
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  let controls = new function ()
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
      switch (this.lightType)
      {
         case 'Spot':
            currentLight = spotLight;
            break;
         case 'Point':
            currentLight = pointLight;
            break;
         case 'Direction':
            currentLight = dirLight;
            break;
      }
      hideAllLights();
      currentLight.visible = true;
      updateLightPosition();
      updateLightIntensity();
    };
  };

  let gui = new GUI();
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
  let controls = new InfoBox();
    controls.add("Lighting - Types of Lights");
    controls.addParagraph();
    controls.add("Use the WASD-QE keys to move the light");
    controls.show();
}

function render()
{
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
