import * as THREE from  '../build/three.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        createGroundPlane,
        createLightSphere,        
        onWindowResize, 
        degreesToRadians,
        radiansToDegrees} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
  
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(80, 70, 170)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(3.6, 4.6, 8.2);
  camera.up.set( 0, 1, 0 );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Create objects
createTeapot( 2.0,  0.5,  0.0, Math.random() * 0xffffff);
createTeapot(0.0,  0.5,  2.0, Math.random() * 0xffffff);  
createTeapot(0.0,  0.5, -2.0, Math.random() * 0xffffff);    

//---------------------------------------------------------
// Default light position
var lightPosition = new THREE.Vector3(3.7, 2.2, 1.0);

// Sphere to represent the light
var lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

//---------------------------------------------------------
// Create and set the spotlight
var spotLight = new THREE.SpotLight("rgb(255,255,255)");
  spotLight.position.copy(lightPosition);
  spotLight.distance = 0;
  spotLight.castShadow = true;
  spotLight.decay = 2;
  spotLight.penumbra = 0.5;
  spotLight.angle= degreesToRadians(40);
  // Shadow Parameters
  spotLight.shadow.mapSize.width = 512;
  spotLight.shadow.mapSize.height = 512;
  spotLight.shadow.camera.fov = radiansToDegrees(spotLight.angle);
  spotLight.shadow.camera.near = .2;    
  spotLight.shadow.camera.far = 20.0;        

scene.add(spotLight);

// Create helper for the spotlight
const spotHelper = new THREE.SpotLightHelper(spotLight, 0xFF8C00);
scene.add(spotHelper);

// Create helper for the spotlight shadow
const shadowHelper = new THREE.CameraHelper(spotLight.shadow.camera);
scene.add(shadowHelper);

buildInterface();
render();

function createTeapot(x, y, z, color )
{
  var geometry = new TeapotGeometry(0.5);
  var material = new THREE.MeshPhongMaterial({color, shininess:"200"});
    material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.position.set(x, y, z);
  scene.add(obj);
}

function updateLight() {
  spotLight.target.updateMatrixWorld();
  lightSphere.position.copy(spotLight.position);
  spotLight.shadow.camera.updateProjectionMatrix();     
  spotHelper.update();
  shadowHelper.update();    
}

function makeXYZGUI(gui, vector3, name, onChangeFn) {
  const folder = gui.addFolder(name);
  folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
  folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
  folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
  folder.open();
}    

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.angle = radiansToDegrees(spotLight.angle);
    this.shadowMapSize = spotLight.shadow.mapSize.width;
  
    this.onUpdateLightAngle = function(){
      spotLight.angle = degreesToRadians(this.angle);
      updateLight();      
    };   
    this.onUpdateShadowFar = function(){
      if(spotLight.shadow.camera.far <= spotLight.shadow.camera.near-0.1) // set far always greater than near
        spotLight.shadow.camera.near = 0.1;
      updateLight(); 
    };   
    this.onUpdateShadowNear = function(){
      if(spotLight.shadow.camera.near >= spotLight.shadow.camera.far) // set near always smaller than far
        spotLight.shadow.camera.far = spotLight.shadow.camera.near+10;
      updateLight();                
    };
    this.onUpdateShadowMap = function(){
      spotLight.shadow.mapSize.width = this.shadowMapSize;
      spotLight.shadow.mapSize.height = this.shadowMapSize;   
      //spotLight.shadow.map.dispose(); 
      spotLight.shadow.map = null;
    };     
  };

  var gui = new GUI();

  var spotFolder = gui.addFolder("SpotLight Parameters");
  spotFolder.open();    
  spotFolder.add(spotLight, 'intensity', 0, 5);
  spotFolder.add(spotLight, 'penumbra', 0, 1);    
  spotFolder.add(spotLight, 'distance', 0, 40, 0.5)
    .onChange(function(){updateLight()});        
  spotFolder.add(controls, 'angle', 20, 80)
    .name("Angle")
    .onChange(function() { controls.onUpdateLightAngle() });
  makeXYZGUI(spotFolder, spotLight.position, 'position', updateLight);
  makeXYZGUI(spotFolder, spotLight.target.position, 'target', updateLight);
  
  var shadowFolder = gui.addFolder("Shadow");
  shadowFolder.open();    
  shadowFolder.add(shadowHelper, 'visible', true);
  shadowFolder.add(controls, 'shadowMapSize', 16, 512, 16)
    .onChange(function() { controls.onUpdateShadowMap() });
  shadowFolder.add(spotLight.shadow.camera, 'near', .1, 30, 0.1)
    .onChange(function() { controls.onUpdateShadowNear() })
    .listen(); // Change GUI when the value changes outside
  shadowFolder.add(spotLight.shadow.camera, 'far', .1, 30, 0.1)
    .onChange(function() { controls.onUpdateShadowFar()  })
    .listen();
}

function render()
{
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}