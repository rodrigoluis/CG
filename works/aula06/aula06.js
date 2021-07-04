import * as THREE from  '../../build/three.module.js';
import Stats from       '../../build/jsm/libs/stats.module.js';
import {GUI} from       '../../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../../libs/util/KeyboardState.js';
import {TeapotGeometry} from '../../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        InfoBox,
        SecondaryBox,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians, 
        createLightSphere} from "../../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );
var objColor = "rgb(255,255,255)";
var objShininess = 200;

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(5.0, 5.0, 50, 50); // width and height
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

var rotateActive = false;

//---------------------------------------------------------
// Default light position,color, ambient color and intensity
var redLightPosition = new THREE.Vector3(1.7, 0.8, 2.4);
var blueLightPosition = new THREE.Vector3(-1.7, 0.8, 0.4);
var greenLightPosition = new THREE.Vector3(1.7, 0.8, -1.4);

//Definindo as cores das esferas
var redLightColor = "rgb(255,0,0)";
var blueLightColor = "rgb(0,0,255)";
var greenLightColor = "rgb(0,255,0)";

var ambientColor = "rgb(50,50,50)";

// Sphere to represent the light
var redLightSphere = createLightSphere(scene, 0.05, 10, 10, redLightPosition);
var blueLightSphere = createLightSphere(scene, 0.05, 10, 10, blueLightPosition);
var greenLightSphere = createLightSphere(scene, 0.05, 10, 10, greenLightPosition);

var lightPosition;

//---------------------------------------------------------
// Create and set all lights. Only Spot and ambient will be visible at first
var redSpotLight = new THREE.SpotLight(redLightColor);
var redKey = false;

var blueSpotLight = new THREE.SpotLight(blueLightColor);
var blueKey = false;

var greenSpotLight = new THREE.SpotLight(greenLightColor);
var greenKey = false;

// More info here: https://threejs.org/docs/#api/en/lights/AmbientLight
var ambientLight = new THREE.AmbientLight(ambientColor);
scene.add( ambientLight );

buildInterface();
render();


// Set Spotlight
// More info here: https://threejs.org/docs/#api/en/lights/SpotLight
function setSpotLight(light,position)
{
  light.position.copy(position);
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;
  light.angle = degreesToRadians(40);    
  light.castShadow = true;
  light.decay = 2;
  light.penumbra = 0.5;
  light.name = "Spot Light"

  scene.add(light);
  lightArray.push( light );
  //console.log(lightArray);
}

function removeSportLight(light)
{
  scene.remove(light);
  lightArray.pop( light );
}

// Update light position of the current light
function updateLightPosition(sphere,positionLight,spotLight)
{
  spotLight.position.copy(positionLight);
  sphere.position.copy(positionLight);
  infoBox.changeMessage("Light Position: " + positionLight.x.toFixed(2) + ", " +
                          positionLight.y.toFixed(2) + ", " + positionLight.z.toFixed(2));
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
    this.lightColor = 'Red'
    this.ambientLight = true;
    this.rotate = false;
    this.sphere = false;

    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
    this.onEnableAmbientLight = function(){
      ambientLight.visible = this.ambientLight;
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
     // lightArray[activeLight].visible = false;
      switch (this.lightColor)
      {
        case 'Red':
            activeLight = lightArray.indexOf(redSpotLight);
            break;
        case 'Blue':
            activeLight = lightArray.indexOf(blueSpotLight);
            break;
        case 'Green':
            activeLight = lightArray.indexOf(greenSpotLight);
            break;
      }
      console.log(activeLight);
      lightPosition = lightArray[activeLight].position;
    //  lightArray[activeLight].visible = true;
    //  updateLightPosition();
    //  updateLightIntensity();
    };
    this.onEnableRotation = function(){
      rotateActive = !rotateActive;
    }
    this.toggleLights = function(par)
    {
      //console.log(par);
      if(par == 'red'){
        if(!redKey){
          redKey = !redKey;
          setSpotLight(redSpotLight,redLightPosition);
        }else{
          redKey = !redKey;
          removeSportLight(redSpotLight);
        }
      }else if(par == 'blue'){
        if(!blueKey)
        {
          blueKey = !blueKey;
          setSpotLight(blueSpotLight,blueLightPosition);
        }else{
          blueKey = !blueKey;
          removeSportLight(blueSpotLight);
        }
      }else if(par == 'green'){
        if(!greenKey)
        {
          greenKey = !greenKey;
          setSpotLight(greenSpotLight,greenLightPosition);
        }else{
          greenKey = !greenKey;
          removeSportLight(greenSpotLight);
        }
      }
      //console.log(lightArray);
    }
  };

  var gui = new GUI();
  gui.add(controls, 'shininess', 0, 1000)
    .name("Obj Shininess")
    .onChange(function(e) { controls.onUpdateShininess() });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
  gui.add(controls, 'lightColor', ['Green', 'Red', 'Blue'])
    .name("Light Color")
    .onChange(function(e) { controls.onChangeLight(); });
  gui.add(controls, 'lightIntensity', 0, 5)
    .name("Light Intensity")
    .onChange(function(e) { controls.onUpdateLightIntensity() });
  gui.add(controls, 'ambientLight', true)
    .name("Ambient Light")
    .onChange(function(e) { controls.onEnableAmbientLight() });
  gui.add(controls, 'rotate', false)
    .name("Object Rotation")
    .onChange(function(e) { controls.onEnableRotation() });
  gui.add(controls,'sphere', false)
    .name("Red Light")
    .onChange(function(e) { controls.toggleLights('red') });
  gui.add(controls,'sphere', false)
    .name("Blue Light")
    .onChange(function(e) { controls.toggleLights('blue') });
  gui.add(controls,'sphere', false)
    .name("Green Light")
    .onChange(function(e) { controls.toggleLights('green') });

}

function keyboardUpdate()
{
  //sphere,positionLight,spotLight
  keyboard.update();
  //RED
  /*if ( keyboard.pressed("D") )
  {
    redLightPosition.x += 0.05;
    updateLightPosition(redLightSphere,redLightPosition,redSpotLight);
  }
  if ( keyboard.pressed("A") )
  {
    redLightPosition.x -= 0.05;
    updateLightPosition(redLightSphere,redLightPosition,redSpotLight);
  }
  if ( keyboard.pressed("W") )
  {
    redLightPosition.y += 0.05;
    updateLightPosition(redLightSphere,redLightPosition,redSpotLight);
  }
  if ( keyboard.pressed("S") )
  {
    redLightPosition.y -= 0.05;
    updateLightPosition(redLightSphere,redLightPosition,redSpotLight);
  }*/
  if ( keyboard.pressed("E") )
  {
    if(redLightPosition.x > -1.40){
      redLightPosition.x -= 0.05;
      updateLightPosition(redLightSphere,redLightPosition,redSpotLight);
    }
  }
  if ( keyboard.pressed("Q") )
  {
    if(redLightPosition.x < 2.40){
      redLightPosition.x += 0.05;
      updateLightPosition(redLightSphere,redLightPosition,redSpotLight);
    }
  }
  //BLUE
  /*if ( keyboard.pressed("L") )
  {
    blueLightPosition.x += 0.05;
    updateLightPosition(blueLightSphere,blueLightPosition,blueSpotLight);
  }
  if ( keyboard.pressed("J") )
  {
    blueLightPosition.x -= 0.05;
    updateLightPosition(blueLightSphere,blueLightPosition,blueSpotLight);
  }
  if ( keyboard.pressed("I") )
  {
    blueLightPosition.y += 0.05;
    updateLightPosition(blueLightSphere,blueLightPosition,blueSpotLight);
  }
  if ( keyboard.pressed("K") )
  {
    blueLightPosition.y -= 0.05;
    updateLightPosition(blueLightSphere,blueLightPosition,blueSpotLight);
  }*/
  if ( keyboard.pressed("W") )
  {
    if(blueLightPosition.z > - 1.80){
      blueLightPosition.z -= 0.05;
      updateLightPosition(blueLightSphere,blueLightPosition,blueSpotLight);
    }
  }
  if ( keyboard.pressed("S") )
  {
    if(blueLightPosition.z < 2.40){
      blueLightPosition.z += 0.05;
      updateLightPosition(blueLightSphere,blueLightPosition,blueSpotLight);
    }
  }
  //GREEN
  /*if ( keyboard.pressed("B") )
  {
    greenLightPosition.x += 0.05;
    updateLightPosition(greenLightSphere,greenLightPosition,greenSpotLight);
  }
  if ( keyboard.pressed("C") )
  {
    greenLightPosition.x -= 0.05;
    updateLightPosition(greenLightSphere,greenLightPosition,greenSpotLight);
  }
  if ( keyboard.pressed("G") )
  {
    greenLightPosition.y += 0.05;
    updateLightPosition(greenLightSphere,greenLightPosition,greenSpotLight);
  }
  if ( keyboard.pressed("V") )
  {
    greenLightPosition.y -= 0.05;
    updateLightPosition(greenLightSphere,greenLightPosition,greenSpotLight);
  }*/
  if ( keyboard.pressed("A") )
  {
    if(greenLightPosition.z > -1.40){
      greenLightPosition.z -= 0.05;
      updateLightPosition(greenLightSphere,greenLightPosition,greenSpotLight);
    }
  }
  if ( keyboard.pressed("D") )
  {
    if(greenLightPosition.z < 2.40){
      greenLightPosition.z += 0.05;
      updateLightPosition(greenLightSphere,greenLightPosition,greenSpotLight);
    }
  }
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Use the QE keys to move the red Light");
    controls.add("Use the WS keys to move the blue Light");
    controls.add("Use the AD keys to move the green Light");
    controls.show();
}

function render()
{
  stats.update();
  trackballControls.update();
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera);

  if(rotateActive){
    obj.rotation.y += 0.01;
  }
}
